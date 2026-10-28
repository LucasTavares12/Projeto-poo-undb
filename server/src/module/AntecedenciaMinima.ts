import { Horario } from "./Horario";
import { RelogioClinica } from "./RelogioClinica";

/**
 * Regra da página do cliente: agendar, remarcar e cancelar pelo site só com pelo menos
 * `HORAS` horas de antecedência. Dá tempo de a clínica se organizar e evita surpresas
 * em cima da hora. A equipe, pelo painel, não segue essa regra (ex: encaixar quem chegou).
 */
export class AntecedenciaMinima {
  public static readonly HORAS = 2;

  private static readonly MILISSEGUNDOS = AntecedenciaMinima.HORAS * 60 * 60 * 1000;

  /** true se o horário começa daqui a `HORAS` horas ou mais. */
  public static permite(data: Date, horario: Horario, agora: Date = new Date()): boolean {
    const inicio = RelogioClinica.momento(data, horario).getTime();
    return inicio - agora.getTime() >= AntecedenciaMinima.MILISSEGUNDOS;
  }

  public static mensagemParaAgendar(): string {
    return (
      `Pelo site, os agendamentos precisam ser feitos com pelo menos ${AntecedenciaMinima.HORAS} ` +
      "horas de antecedência. Escolha um horário mais tarde."
    );
  }

  public static mensagemParaAlterar(): string {
    return (
      `Faltam menos de ${AntecedenciaMinima.HORAS} horas para o seu horário: para remarcar ou ` +
      "cancelar agora, fale direto com a clínica."
    );
  }
}
