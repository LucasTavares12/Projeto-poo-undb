import { Horario } from "./Horario";
import { DataAgenda } from "./DataAgenda";

/**
 * "Agora" do ponto de vista da clínica. Concentra aqui o dia de hoje e a hora atual,
 * usados nas regras que não aceitam datas ou horários que já passaram.
 *
 * O fuso é sempre o da clínica (FUSO_PADRAO, ou a variável de ambiente FUSO_CLINICA),
 * nunca o do computador onde o servidor roda: hospedagens costumam rodar em UTC, 3 horas
 * à frente do Brasil, e aí "hoje" e a antecedência mínima ficariam errados.
 */
export class RelogioClinica {
  /** Horário de Brasília (sem horário de verão). */
  public static readonly FUSO_PADRAO = "America/Sao_Paulo";

  /**
   * Faz o processo inteiro do Node usar o fuso da clínica, mesmo que a hospedagem tenha
   * definido outro (ex.: TZ=UTC). Precisa ser chamado na inicialização, antes de criar a
   * aplicação e a conexão com o banco.
   */
  public static configurarFuso(): void {
    process.env.TZ = process.env.FUSO_CLINICA || RelogioClinica.FUSO_PADRAO;
  }

  /** Diferença do fuso da clínica para o UTC no formato do MySQL, ex.: "-03:00". */
  public static deslocamentoUtc(): string {
    const minutos = -new Date().getTimezoneOffset();
    const sinal = minutos < 0 ? "-" : "+";
    const absoluto = Math.abs(minutos);
    const horas = String(Math.floor(absoluto / 60)).padStart(2, "0");
    return `${sinal}${horas}:${String(absoluto % 60).padStart(2, "0")}`;
  }

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
