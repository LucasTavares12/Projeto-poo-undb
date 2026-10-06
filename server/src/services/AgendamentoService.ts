import { Agendamento } from "../module/Agendamento";
import { Cliente } from "../module/Cliente";
import { Tratamento } from "../module/Tratamento";
import { Horario } from "../module/Horario";
import { StatusAgendamento } from "../module/StatusAgendamento";
import { ClienteRepository } from "../repositories/ClienteRepository";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { TratamentoRepository } from "../repositories/TratamentoRepository";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";
import { DisponibilidadeService } from "./DisponibilidadeService";

export interface DadosNovoAgendamento {
  clienteNome: string;
  clienteTelefone: string;
  profissionalId: number;
  tratamentoIds: number[];
  data: Date;
  horarioInicio: Horario;
}

/**
 * Orquestra a criação e o andamento dos agendamentos, aplicando as regras
 * de negócio (disponibilidade real, múltiplos tratamentos, Kanban) por
 * cima dos repositórios, que só sabem ler/gravar no banco.
 */
export class AgendamentoService {
  private readonly clienteRepo = new ClienteRepository();
  private readonly profissionalRepo = new ProfissionalRepository();
  private readonly tratamentoRepo = new TratamentoRepository();
  private readonly agendamentoRepo = new AgendamentoRepository();
  private readonly disponibilidadeService = new DisponibilidadeService();

  /**
   * Cria um agendamento (pela página do cliente ou pelo "Novo agendamento" do painel):
   * só aceita horários livres na agenda liberada do profissional.
   */
  public async criar(dados: DadosNovoAgendamento): Promise<Agendamento> {
    const novo = await this.montarNovoAgendamento(dados);

    const horariosDisponiveis = await this.disponibilidadeService.listarHorariosDisponiveis(
      dados.profissionalId,
      dados.data,
      novo.getQuantidadeSlots()
    );
    const horarioAindaDisponivel = horariosDisponiveis.some((horario) =>
      horario.equals(dados.horarioInicio)
    );
    if (!horarioAindaDisponivel) {
      throw new Error("Esse horário não está mais disponível. Escolha outro horário.");
    }

    return this.salvarComCliente(novo);
  }

  /** Valida os dados e monta o agendamento (ainda sem salvar nada no banco). */
  private async montarNovoAgendamento(dados: DadosNovoAgendamento): Promise<Agendamento> {
    const nome = String(dados.clienteNome ?? "").trim();
    const telefone = String(dados.clienteTelefone ?? "").trim();
    if (!nome) {
      throw new Error("Informe o nome do cliente.");
    }
    if (!telefone) {
      throw new Error("Informe o telefone do cliente.");
    }
    // Telefone com DDD: 10 dígitos (fixo) ou 11 (celular).
    const digitosTelefone = telefone.replace(/\D/g, "").length;
    if (digitosTelefone < 10 || digitosTelefone > 11) {
      throw new Error("Telefone inválido: informe o DDD e o número.");
    }
    if (dados.tratamentoIds.length === 0) {
      throw new Error("Selecione ao menos um tratamento.");
    }
    if (Number.isNaN(dados.data.getTime())) {
      throw new Error("Data inválida.");
    }

    const profissional = await this.profissionalRepo.buscarPorId(dados.profissionalId);
    if (!profissional) {
      throw new Error("Profissional não encontrado.");
    }

    const tratamentos = await this.buscarTratamentos(dados.tratamentoIds);
    const deOutroProfissional = tratamentos.find(
      (tratamento) => !tratamento.ehRealizadoPor(dados.profissionalId)
    );
    if (deOutroProfissional) {
      throw new Error(
        `O tratamento "${deOutroProfissional.getNome()}" não é realizado por ${profissional.getNome()}.`
      );
    }

    return new Agendamento(
      new Cliente(nome, telefone),
      profissional,
      tratamentos,
      dados.data,
      dados.horarioInicio
    );
  }

  /** Grava o cliente e depois o agendamento já ligado a ele. */
  private async salvarComCliente(novo: Agendamento): Promise<Agendamento> {
    const cliente = await this.clienteRepo.salvar(novo.getCliente());
    return this.agendamentoRepo.salvar(
      new Agendamento(
        cliente,
        novo.getProfissional(),
        novo.getTratamentos(),
        novo.getData(),
        novo.getHorarioInicio()
      )
    );
  }

  /** `profissionalId` null = todos (acesso total); com valor, só os daquele profissional. */
  public async listarTodos(profissionalId: number | null = null): Promise<Agendamento[]> {
    return profissionalId === null
      ? this.agendamentoRepo.listarTodos()
      : this.agendamentoRepo.listarPorProfissional(profissionalId);
  }

  /** Usado pela tela do cliente pra saber quais horários mostrar como clicáveis. */
  public async listarHorariosDisponiveis(
    profissionalId: number,
    data: Date,
    tratamentoIds: number[]
  ): Promise<Horario[]> {
    const tratamentos = await this.buscarTratamentos(tratamentoIds);
    // Sem tratamento escolhido ("Ver horários" da página inicial), mostra os horários de 30min livres.
    const quantidadeSlots = Math.max(1, this.somarSlots(tratamentos));
    return this.disponibilidadeService.listarHorariosDisponiveis(
      profissionalId,
      data,
      quantidadeSlots
    );
  }

  /** Usado pelo painel Kanban do admin ao arrastar um card para outra coluna. */
  public async moverStatus(
    id: number,
    novoStatus: StatusAgendamento,
    profissionalDoUsuario: number | null = null
  ): Promise<Agendamento> {
    const agendamento = await this.buscarVisivel(id, profissionalDoUsuario);

    agendamento.moverPara(novoStatus);
    await this.agendamentoRepo.atualizarStatus(id, agendamento.getStatus());
    return agendamento;
  }

  /**
   * Cancela (apaga) um agendamento que ainda não foi atendido. Os horários que
   * ele ocupava voltam a aparecer livres, já que a disponibilidade é calculada
   * a partir dos agendamentos existentes.
   */
  public async cancelar(id: number, profissionalDoUsuario: number | null = null): Promise<void> {
    const agendamento = await this.buscarVisivel(id, profissionalDoUsuario);
    if (!agendamento.podeSerCancelado()) {
      throw new Error(
        "Só é possível cancelar agendamentos que ainda não começaram a ser atendidos."
      );
    }

    await this.agendamentoRepo.deletar(id);
  }

  /**
   * Busca um agendamento que o usuário logado pode ver: com `profissionalDoUsuario`,
   * agendamentos de outros profissionais são tratados como inexistentes.
   */
  private async buscarVisivel(
    id: number,
    profissionalDoUsuario: number | null
  ): Promise<Agendamento> {
    const agendamento = await this.agendamentoRepo.buscarPorId(id);
    if (
      !agendamento ||
      (profissionalDoUsuario !== null &&
        agendamento.getProfissional().getId() !== profissionalDoUsuario)
    ) {
      throw new Error("Agendamento não encontrado.");
    }
    return agendamento;
  }

  /** Quantos slots de 30min seguidos o conjunto de tratamentos ocupa na agenda. */
  private somarSlots(tratamentos: Tratamento[]): number {
    return tratamentos.reduce((total, tratamento) => total + tratamento.getQuantidadeSlots(), 0);
  }

  private async buscarTratamentos(ids: number[]): Promise<Tratamento[]> {
    const tratamentos = await Promise.all(ids.map((id) => this.tratamentoRepo.buscarPorId(id)));

    const indiceNaoEncontrado = tratamentos.findIndex((tratamento) => tratamento === null);
    if (indiceNaoEncontrado !== -1) {
      throw new Error(`Tratamento com id ${ids[indiceNaoEncontrado]} não encontrado.`);
    }

    return tratamentos as Tratamento[];
  }
}
