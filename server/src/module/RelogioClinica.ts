import { Horario } from "./Horario";
import { DataAgenda } from "./DataAgenda";

/**
 * "Agora" do ponto de vista da clínica, no fuso do servidor. Concentra aqui o dia de
 * hoje e a hora atual, usados nas regras que não aceitam datas ou horários que já passaram.
 */
export class RelogioClinica {
  /** Dia de hoje no formato da agenda: "YYYY-MM-DD". */
  public static hoje(): string {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${agora.getFullYear()}-${mes}-${dia}`;
  }

  /**
   * O instante (no fuso do servidor) em que um horário da agenda começa. As datas da agenda
   * ficam à meia-noite UTC, então o dia vem do texto "YYYY-MM-DD", não do fuso.
   */
  public static momento(data: Date, horario: Horario): Date {
    const [ano, mes, dia] = DataAgenda.paraTexto(data).split("-").map(Number);
    const minutos = horario.paraMinutos();
    return new Date(ano, mes - 1, dia, Math.floor(minutos / 60), minutos % 60);
  }

  /** true se o horário, no dia de hoje, já começou (ou passou). */
  public static jaPassouHoje(horario: Horario): boolean {
    const agora = new Date();
    return horario.paraMinutos() <= agora.getHours() * 60 + agora.getMinutes();
  }
}
