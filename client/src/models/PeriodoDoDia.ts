/** Horários de um período do dia (manhã, tarde ou noite). */
export interface GrupoDeHorarios {
  nome: string;
  horarios: string[];
}

/**
 * Manhã, tarde e noite: separar os horários livres por período deixa a lista
 * mais fácil de percorrer, principalmente no celular.
 */
export class PeriodoDoDia {
  private static readonly PERIODOS = [
    new PeriodoDoDia("Manhã", "00:00", "12:00"),
    new PeriodoDoDia("Tarde", "12:00", "18:00"),
    new PeriodoDoDia("Noite", "18:00", "24:00"),
  ];

  private readonly nome: string;
  private readonly inicio: string;
  private readonly fim: string;

  private constructor(nome: string, inicio: string, fim: string) {
    this.nome = nome;
    this.inicio = inicio;
    this.fim = fim;
  }

  /** Separa os horários ("HH:MM") por período, deixando de fora os períodos sem nenhum. */
  public static agrupar(horarios: string[]): GrupoDeHorarios[] {
    return PeriodoDoDia.PERIODOS.map((periodo) => ({
      nome: periodo.nome,
      horarios: horarios.filter((horario) => periodo.contem(horario)),
    })).filter((grupo) => grupo.horarios.length > 0);
  }

  /** "HH:MM" compara certo como texto. */
  private contem(horario: string): boolean {
    return this.inicio <= horario && horario < this.fim;
  }
}
