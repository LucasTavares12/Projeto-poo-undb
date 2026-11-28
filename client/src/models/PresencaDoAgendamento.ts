import type { Agendamento } from "../services/types";
import { HorarioMarcado } from "./HorarioMarcado";

/**
 * Se o cliente compareceu, do ponto de vista da tela: quando a equipe já pode marcar que ele
 * não veio e qual selo mostrar depois disso. O servidor confere as mesmas regras
 * (Agendamento.registrarFalta).
 */
export class PresencaDoAgendamento {
  private readonly agendamento: Agendamento;

  constructor(agendamento: Agendamento) {
    this.agendamento = agendamento;
  }

  public faltou(): boolean {
    return this.agendamento.status === "FALTOU";
  }

  /** Texto do selo do card (null = sem selo). */
  public rotulo(): string | null {
    return this.faltou() ? "Não compareceu" : null;
  }

  /** Classe CSS do selo. */
  public classe(): string {
    return this.faltou() ? "presenca faltou" : "presenca";
  }

  /** Só depois que o horário começou dá para dizer que o cliente não veio. */
  public podeMarcarFalta(agora: Date = new Date()): boolean {
    return (
      this.agendamento.status === "AGENDADO" && HorarioMarcado.de(this.agendamento).jaComecou(agora)
    );
  }
}
