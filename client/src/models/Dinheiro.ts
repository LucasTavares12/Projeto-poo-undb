/** Valor em reais, exibido no padrão brasileiro ("R$ 1.250,00"). */
export class Dinheiro {
  private static readonly FORMATO = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Para eixos e rótulos de gráfico, onde falta espaço ("R$ 1,2 mil").
  private static readonly FORMATO_COMPACTO = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });

  private readonly valor: number;

  constructor(valor: number) {
    this.valor = valor;
  }

  public formatar(): string {
    return Dinheiro.FORMATO.format(this.valor);
  }

  /** "R$ 1,2 mil": versão curta, para gráficos. */
  public formatarCompacto(): string {
    return Dinheiro.FORMATO_COMPACTO.format(this.valor);
  }
}
