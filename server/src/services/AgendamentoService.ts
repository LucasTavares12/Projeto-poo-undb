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

  public async criar(dados: DadosNovoAgendamento): Promise<Agendamento> {
    if (dados.tratamentoIds.length === 0) {
      throw new Error("Selecione ao menos um tratamento.");
    }

    const profissional = await this.profissionalRepo.buscarPorId(dados.profissionalId);
    if (!profissional) {
      throw new Error("Profissional não encontrado.");
    }

    const tratamentos = await this.buscarTratamentos(dados.tratamentoIds);
    const quantidadeSlots = this.somarSlots(tratamentos);

    const horariosDisponiveis = await this.disponibilidadeService.listarHorariosDisponiveis(
      dados.profissionalId,
      dados.data,
      quantidadeSlots
    );

    const horarioAindaDisponivel = horariosDisponiveis.some((horario) =>
      horario.equals(dados.horarioInicio)
    );
    if (!horarioAindaDisponivel) {
      throw new Error("Esse horário não está mais disponível. Escolha outro horário.");
    }

    const cliente = await this.clienteRepo.salvar(
      new Cliente(dados.clienteNome, dados.clienteTelefone)
    );

    const agendamento = new Agendamento(
      cliente,
      profissional,
      tratamentos,
      dados.data,
      dados.horarioInicio
    );

    return this.agendamentoRepo.salvar(agendamento);
  }

  public async listarTodos(): Promise<Agendamento[]> {
    return this.agendamentoRepo.listarTodos();
  }

  /** Usado pela tela do cliente pra saber quais horários mostrar como clicáveis. */
  public async listarHorariosDisponiveis(
    profissionalId: number,
    data: Date,
    tratamentoIds: number[]
  ): Promise<Horario[]> {
    const tratamentos = await this.buscarTratamentos(tratamentoIds);
    const quantidadeSlots = this.somarSlots(tratamentos);
    return this.disponibilidadeService.listarHorariosDisponiveis(
      profissionalId,
      data,
      quantidadeSlots
    );
  }

  /** Usado pelo painel Kanban do admin ao arrastar um card para outra coluna. */
  public async moverStatus(id: number, novoStatus: StatusAgendamento): Promise<Agendamento> {
    const agendamento = await this.agendamentoRepo.buscarPorId(id);
    if (!agendamento) {
      throw new Error("Agendamento não encontrado.");
    }

    agendamento.moverPara(novoStatus);
    await this.agendamentoRepo.atualizarStatus(id, agendamento.getStatus());
    return agendamento;
  }

  /**
   * Cancela (apaga) um agendamento que ainda não foi atendido. Os horários que
   * ele ocupava voltam a aparecer livres, já que a disponibilidade é calculada
   * a partir dos agendamentos existentes.
   */
  public async cancelar(id: number): Promise<void> {
    const agendamento = await this.agendamentoRepo.buscarPorId(id);
    if (!agendamento) {
      throw new Error("Agendamento não encontrado.");
    }
    if (!agendamento.podeSerCancelado()) {
      throw new Error(
        "Só é possível cancelar agendamentos que ainda não começaram a ser atendidos."
      );
    }

    await this.agendamentoRepo.deletar(id);
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
