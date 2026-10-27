import { ApiClient } from "./ApiClient";
import type { Agendamento, StatusAgendamento } from "./types";
import type { TipoMensagem } from "../models/MensagemWhatsApp";

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

  /**
   * Tira do Kanban os agendamentos finalizados (continuam valendo nos relatórios).
   * Devolve quantos saíram do quadro.
   */
  public async arquivarFinalizados(): Promise<number> {
    const resposta = await this.post<{ arquivados: number }>(
      "/agendamentos/finalizados/arquivar",
      {}
    );
    return resposta.arquivados;
  }

  /** Quantos finalizados estão fora do Kanban (limpos da tela). */
  public async contarArquivados(): Promise<number> {
    const resposta = await this.get<{ quantidade: number }>("/agendamentos/arquivados/quantidade");
    return resposta.quantidade;
  }

  /** Traz de volta ao Kanban os finalizados que foram limpos. Devolve quantos voltaram. */
  public async restaurarArquivados(): Promise<number> {
    const resposta = await this.post<{ restaurados: number }>(
      "/agendamentos/arquivados/restaurar",
      {}
    );
    return resposta.restaurados;
  }

  /** Página do cliente: agendamentos em aberto feitos com este telefone. */
  public listarDoCliente(telefone: string): Promise<Agendamento[]> {
    const query = new URLSearchParams({ telefone });
    return this.get<Agendamento[]>(`/meus-agendamentos?${query.toString()}`);
  }

  /** Página do cliente: cancela o próprio agendamento, confirmando pelo telefone. */
  public cancelarDoCliente(id: number, telefone: string): Promise<void> {
    const query = new URLSearchParams({ telefone });
    return this.excluir(`/meus-agendamentos/${id}?${query.toString()}`);
  }

  /** Painel: horários livres para remarcar o agendamento na data ("YYYY-MM-DD"). */
  public horariosParaRemarcar(id: number, data: string): Promise<string[]> {
    const query = new URLSearchParams({ data });
    return this.get<string[]>(`/agendamentos/${id}/horarios-remarcacao?${query.toString()}`);
  }

  /** Painel: muda o dia e o horário, mantendo cliente, tratamentos e valor. */
  public remarcar(id: number, data: string, horarioInicio: string): Promise<Agendamento> {
    return this.patch<Agendamento>(`/agendamentos/${id}/remarcar`, { data, horarioInicio });
  }

  /** Página do cliente: horários livres para remarcar, confirmando pelo telefone. */
  public horariosParaRemarcarDoCliente(
    id: number,
    telefone: string,
    data: string
  ): Promise<string[]> {
    const query = new URLSearchParams({ telefone, data });
    return this.get<string[]>(`/meus-agendamentos/${id}/horarios-remarcacao?${query.toString()}`);
  }

  /** Página do cliente: remarca o próprio agendamento, confirmando pelo telefone. */
  public remarcarDoCliente(
    id: number,
    telefone: string,
    data: string,
    horarioInicio: string
  ): Promise<Agendamento> {
    const query = new URLSearchParams({ telefone });
    return this.patch<Agendamento>(`/meus-agendamentos/${id}/remarcar?${query.toString()}`, {
      data,
      horarioInicio,
    });
  }

  /** Kanban: anota que o lembrete ou o agradecimento foi mandado pelo WhatsApp. */
  public registrarMensagem(id: number, tipo: TipoMensagem): Promise<Agendamento> {
    return this.post<Agendamento>(`/agendamentos/${id}/mensagens`, { tipo });
  }

  public atualizarStatus(id: number, status: StatusAgendamento): Promise<Agendamento> {
    return this.patch<Agendamento>(`/agendamentos/${id}/status`, { status });
  }
}
