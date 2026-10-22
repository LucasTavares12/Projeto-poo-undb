import { ApiClient } from "./ApiClient";
import type { Agendamento, BloqueioAgenda, PeriodoBloqueado } from "./types";

export interface DadosBloqueio {
  /** null = clínica inteira. */
  profissionalId: number | null;
  dataInicio: string;
  dataFim: string;
  motivo: string;
}

export interface BloqueioCriado {
  bloqueio: BloqueioAgenda;
  /** Agendamentos que já estavam marcados no período bloqueado. */
  agendamentosAfetados: Agendamento[];
}

export class BloqueioAgendaService extends ApiClient {
  public listar(incluirPassados = false): Promise<BloqueioAgenda[]> {
    return this.get<BloqueioAgenda[]>(`/bloqueios${incluirPassados ? "?incluirPassados=true" : ""}`);
  }

  /** Página do cliente: dias em que o profissional não atende (a partir de hoje). */
  public listarDoProfissional(profissionalId: number): Promise<PeriodoBloqueado[]> {
    return this.get<PeriodoBloqueado[]>(`/bloqueios/publicos?profissionalId=${profissionalId}`);
  }

  public criar(dados: DadosBloqueio): Promise<BloqueioCriado> {
    return this.post<BloqueioCriado>("/bloqueios", dados);
  }

  public remover(id: number): Promise<void> {
    return this.excluir(`/bloqueios/${id}`);
  }
}
