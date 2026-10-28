/** Faixa da agenda: começa em `inicio` ("HH:MM") e ocupa `slots` faixas de 30 minutos. */
export class FaixaHoraria {
  private static readonly MINUTOS_POR_SLOT = 30;

  private readonly inicio: string;
  private readonly slots: number;

  constructor(inicio: string, slots: number) {
    this.inicio = inicio;
    this.slots = slots;
  }

  /** "HH:MM" em que a faixa termina. */
  public getFim(): string {
    const [horas, minutos] = this.inicio.split(":").map(Number);
    const total = horas * 60 + minutos + this.slots * FaixaHoraria.MINUTOS_POR_SLOT;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  /** "09:30–11:00" */
  public formatar(): string {
    return `${this.inicio}–${this.getFim()}`;
  }
}
