import { PeriodoDeDatas } from "./PeriodoDeDatas";
import type { PeriodoBloqueado } from "../services/types";

/**
 * Dias em que um profissional não atende (folgas, férias e feriados da clínica),
 * como a página do cliente e a remarcação enxergam: só os períodos, sem o motivo.
 */
export class DiasSemAtendimento {
  private readonly periodos: PeriodoDeDatas[];

  constructor(periodos: PeriodoBloqueado[] = []) {
    this.periodos = periodos.map(
      (periodo) => new PeriodoDeDatas(periodo.dataInicio, periodo.dataFim)
    );
  }

  /** true se não há atendimento no dia ("YYYY-MM-DD"). */
  public estaFechado(dia: string): boolean {
    return this.periodos.some((periodo) => periodo.contem(dia));
  }
}
