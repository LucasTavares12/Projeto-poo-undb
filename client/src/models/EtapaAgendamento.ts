import type { StatusAgendamento } from "../services/types";

/** Como cada etapa do agendamento aparece na tela (nome e estilo). */
export class EtapaAgendamento {
  /**
   * Dias que um atendimento fica na coluna "Finalizados" antes de sair sozinho para os
   * ocultos. Mesma regra do servidor (Agendamento.DIAS_PARA_OCULTAR_FINALIZADO).
   */
  public static readonly DIAS_PARA_OCULTAR_FINALIZADO = 2;

  private static readonly NOMES: Record<StatusAgendamento, string> = {
    AGENDADO: "Agendado",
    EM_ATENDIMENTO: "Em atendimento",
    FINALIZADO: "Finalizado",
    FALTOU: "Não compareceu",
  };

  private readonly status: StatusAgendamento;

  constructor(status: StatusAgendamento) {
    this.status = status;
  }

  public getNome(): string {
    return EtapaAgendamento.NOMES[this.status];
  }

  /** Atendimento encerrado: finalizado ou o cliente faltou (ficam na coluna "Finalizados"). */
  public estaEncerrada(): boolean {
    return this.status === "FINALIZADO" || this.status === "FALTOU";
  }

  /** Coluna do Kanban onde o card fica: as faltas ficam junto com os finalizados. */
  public colunaDoQuadro(): StatusAgendamento {
    return this.status === "FALTOU" ? "FINALIZADO" : this.status;
  }

  /** Classe CSS do selo da etapa ("agendado", "em-atendimento", "finalizado", "faltou"). */
  public getClasse(): string {
    return this.status.toLowerCase().replace("_", "-");
  }
}
