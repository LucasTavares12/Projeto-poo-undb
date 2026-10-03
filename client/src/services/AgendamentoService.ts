import { ApiClient } from "./ApiClient";
import type { Agendamento, StatusAgendamento } from "./types";

export interface DadosNovoAgendamento {
  clienteNome: string;
  clienteTelefone: string;
  profissionalId: number;
  tratamentoIds: number[];
  data: string; // "YYYY-MM-DD"
  horarioInicio: string; // "HH:MM"
}

export class AgendamentoService extends ApiClient {
  /** Usado pelo painel Kanban do admin. */
  public listar(): Promise<Agendamento[]> {
    return this.get<Agendamento[]>("/agendamentos");
  }

  /** Horários clicáveis para o cliente escolher, dado profissional + data + tratamentos. */
  public disponibilidade(
    profissionalId: number,
    data: string,
    tratamentoIds: number[]
  ): Promise<string[]> {
    const query = new URLSearchParams({
      profissionalId: String(profissionalId),
      data,
      tratamentoIds: tratamentoIds.join(","),
    });
    return this.get<string[]>(`/disponibilidade?${query.toString()}`);
  }

  public criar(dados: DadosNovoAgendamento): Promise<Agendamento> {
    return this.post<Agendamento>("/agendamentos", dados);
  }

  /** Apaga um agendamento ainda não atendido, liberando os horários que ele ocupava. */
  public cancelar(id: number): Promise<void> {
    return this.excluir(`/agendamentos/${id}`);
  }

  public atualizarStatus(id: number, status: StatusAgendamento): Promise<Agendamento> {
    return this.patch<Agendamento>(`/agendamentos/${id}/status`, { status });
  }
}
