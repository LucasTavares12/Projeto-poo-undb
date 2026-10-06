/** Valor em reais, exibido no padrão brasileiro ("R$ 1.250,00"). */
export class Dinheiro {
  private static readonly FORMATO = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  private readonly valor: number;

  constructor(valor: number) {
    this.valor = valor;
  }

  public formatar(): string {
    return Dinheiro.FORMATO.format(this.valor);
  }
}
