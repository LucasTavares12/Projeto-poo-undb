/**
 * Eixo de valores de um gráfico: arredonda o topo para um número "redondo"
 * (ex: maior valor 285 vira teto 300) e gera as marcas do eixo (0, 100, 200, 300).
 */
export class EscalaGrafico {
  private static readonly PASSOS = [1, 2, 2.5, 5, 10];

  private readonly passo: number;
  private readonly divisoes: number;

  constructor(maiorValor: number, divisoesDesejadas = 4) {
    if (maiorValor <= 0) {
      this.passo = 1;
      this.divisoes = divisoesDesejadas;
      return;
    }

    const passoBruto = maiorValor / divisoesDesejadas;
    const magnitude = 10 ** Math.floor(Math.log10(passoBruto));
    const fator = EscalaGrafico.PASSOS.find((passo) => passo * magnitude >= passoBruto) ?? 10;

    this.passo = fator * magnitude;
    this.divisoes = Math.ceil(maiorValor / this.passo);
  }

  public getTeto(): number {
    return this.passo * this.divisoes;
  }

  /** Marcas do eixo, de 0 até o teto. */
  public getMarcas(): number[] {
    return Array.from({ length: this.divisoes + 1 }, (_, indice) => indice * this.passo);
  }

  /** Posição de um valor no eixo, de 0 a 100 (%). */
  public percentual(valor: number): number {
    return (valor / this.getTeto()) * 100;
  }
}
