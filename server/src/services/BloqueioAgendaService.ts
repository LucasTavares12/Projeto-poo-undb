import { BloqueioAgenda } from "../module/BloqueioAgenda";
import { Agendamento } from "../module/Agendamento";
import { BloqueioAgendaRepository } from "../repositories/BloqueioAgendaRepository";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";
import { RelogioClinica } from "../module/RelogioClinica";
import { DataAgenda } from "../module/DataAgenda";

export interface DadosNovoBloqueio {
  /** null = clínica inteira (feriado, recesso). */
  profissionalId: number | null;
  dataInicio: Date;
  dataFim: Date;
  motivo: string;
}

export interface BloqueioCriado {
  bloqueio: BloqueioAgenda;
  /**
   * Agendamentos que já estavam marcados no período. Não são cancelados sozinhos:
   * a clínica decide se avisa o cliente e cancela ou se mantém o atendimento.
   */
  agendamentosAfetados: Agendamento[];
}

/**
 * Regras das folgas, férias e feriados: quem pode fechar qual agenda, e o aviso
 * dos agendamentos que caem no período fechado.
 */
export class BloqueioAgendaService {
  private readonly bloqueioRepo = new BloqueioAgendaRepository();
  private readonly profissionalRepo = new ProfissionalRepository();
  private readonly agendamentoRepo = new AgendamentoRepository();

  /**
   * Bloqueios que o usuário enxerga no painel. `profissionalDoUsuario` null = todos;
   * com valor, os desse profissional e os da clínica inteira. Sem `incluirPassados`,
   * só os que ainda não terminaram.
   */
  public listar(
    profissionalDoUsuario: number | null,
    incluirPassados: boolean
  ): Promise<BloqueioAgenda[]> {
    return this.bloqueioRepo.listar(
      profissionalDoUsuario,
      incluirPassados ? null : RelogioClinica.hoje()
    );
  }

  /** Página do cliente: períodos fechados (a partir de hoje) na agenda do profissional. */
  public listarDoProfissional(profissionalId: number): Promise<BloqueioAgenda[]> {
    if (!Number.isInteger(profissionalId) || profissionalId <= 0) {
      throw new Error("Profissional inválido.");
    }
    return this.bloqueioRepo.listar(profissionalId, RelogioClinica.hoje());
  }

  public buscarPorId(id: number): Promise<BloqueioAgenda | null> {
    return this.bloqueioRepo.buscarPorId(id);
  }

  public async criar(dados: DadosNovoBloqueio): Promise<BloqueioCriado> {
    const bloqueio = new BloqueioAgenda(
      dados.profissionalId,
      dados.dataInicio,
      dados.dataFim,
      dados.motivo
    );

    // Bloquear o passado não muda nada na agenda: provavelmente é erro na data.
    if (DataAgenda.paraTexto(bloqueio.getDataFim()) < RelogioClinica.hoje()) {
      throw new Error("O período do bloqueio já passou. Confira as datas.");
    }
    if (dados.profissionalId !== null) {
      const profissional = await this.profissionalRepo.buscarPorId(dados.profissionalId);
      if (!profissional) {
        throw new Error("Profissional não encontrado.");
      }
    }

    const salvo = await this.bloqueioRepo.salvar(bloqueio);
    const agendamentosAfetados = await this.agendamentoRepo.listarAgendadosNoPeriodo(
      salvo.getProfissionalId(),
      DataAgenda.paraTexto(salvo.getDataInicio()),
      DataAgenda.paraTexto(salvo.getDataFim())
    );
    return { bloqueio: salvo, agendamentosAfetados };
  }

  public remover(id: number): Promise<void> {
    return this.bloqueioRepo.deletar(id);
  }
}
