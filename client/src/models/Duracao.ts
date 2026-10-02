/** Duração de um tratamento, sempre em múltiplos do slot de 30min da agenda (regra do backend). */
export class Duracao {
  public static readonly SLOT_MINUTOS = 30;
  private static readonly MAXIMO_SLOTS = 8;

  private readonly minutos: number;

  constructor(minutos: number) {
    this.minutos = minutos;
  }

  /** Durações que o admin pode escolher ao cadastrar um tratamento (30min até 4h). */
  public static opcoes(): Duracao[] {
    return Array.from(
      { length: Duracao.MAXIMO_SLOTS },
      (_, indice) => new Duracao((indice + 1) * Duracao.SLOT_MINUTOS)
    );
  }

  public getMinutos(): number {
    return this.minutos;
  }

  /** "30 min", "1h", "1h30"... */
  public formatar(): string {
    const horas = Math.floor(this.minutos / 60);
    const resto = this.minutos % 60;
    if (horas === 0) {
      return `${resto} min`;
    }
    return resto === 0 ? `${horas}h` : `${horas}h${resto}`;
  }
}
