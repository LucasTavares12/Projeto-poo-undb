/**
 * Faltas (horários em que o cliente não compareceu) de um cliente ou de um período, para
 * avisar a equipe. A partir de
 * `FALTAS_PARA_ALERTA` faltas o aviso fica em destaque (cliente que costuma faltar: vale
 * mandar o lembrete e pedir a confirmação).
 */
export class Faltas {
  public static readonly FALTAS_PARA_ALERTA = 2;

  private readonly faltas: number;
  /** Faltas / horários encerrados, de 0 a 1 (null = não se sabe). */
  private readonly taxa: number | null;

  constructor(faltas: number | undefined, taxa: number | null = null) {
    this.faltas = Math.max(0, Math.floor(faltas ?? 0));
    this.taxa = taxa;
  }

  public temFaltas(): boolean {
    return this.faltas > 0;
  }

  /** Cliente que costuma faltar. */
  public deveAlertar(): boolean {
    return this.faltas >= Faltas.FALTAS_PARA_ALERTA;
  }

  public getQuantidade(): number {
    return this.faltas;
  }

  /** "Faltou 1 vez" / "Faltou 3 vezes". */
  public descrever(): string {
    return `Faltou ${this.faltas === 1 ? "1 vez" : `${this.faltas} vezes`}`;
  }

  /** "25%" (0% quando a taxa não é conhecida). */
  public taxaFormatada(): string {
    return `${Math.round((this.taxa ?? 0) * 100)}%`;
  }
}
