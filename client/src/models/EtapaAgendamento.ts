import type { StatusAgendamento } from "../services/types";

/** Como cada etapa do agendamento aparece na tela (nome e estilo). */
export class EtapaAgendamento {
  private static readonly NOMES: Record<StatusAgendamento, string> = {
    AGENDADO: "Agendado",
    EM_ATENDIMENTO: "Em atendimento",
    FINALIZADO: "Finalizado",
  };

  private readonly status: StatusAgendamento;

  constructor(status: StatusAgendamento) {
    this.status = status;
  }

  public getNome(): string {
    return EtapaAgendamento.NOMES[this.status];
  }

  /** Classe CSS do selo da etapa ("agendado", "em-atendimento", "finalizado"). */
  public getClasse(): string {
    return this.status.toLowerCase().replace("_", "-");
  }
}
