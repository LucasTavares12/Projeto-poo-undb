/**
 * O valor que a pessoa digita no campo "Gastos do mês". Aceita o jeito brasileiro
 * ("1.250,50", "R$ 800") e o com ponto ("1250.50"), e diz se dá para salvar.
 */
export class EntradaDeGasto {
  private readonly texto: string;

  constructor(texto: string) {
    this.texto = texto.trim();
  }

  /** Para preencher o campo com um valor já salvo: 1250.5 → "1250,50". */
  public static de(valor: number): EntradaDeGasto {
    return new EntradaDeGasto(valor.toFixed(2).replace(".", ","));
  }

  public toString(): string {
    return this.texto;
  }

  /** O número em reais, ou null se o texto não for um valor válido. */
  public valor(): number | null {
    let limpo = this.texto.replace(/R\$/gi, "").replace(/\s/g, "");
    if (limpo.includes(",")) {
      // "1.250,50": o ponto separa os milhares e a vírgula, os centavos.
      limpo = limpo.replace(/\./g, "").replace(",", ".");
    }
    if (limpo === "" || !/^\d+(\.\d{1,2})?$/.test(limpo)) {
      return null;
    }
    return Number(limpo);
  }

  /** Aviso para mostrar no campo (null = pode salvar). */
  public erro(): string | null {
    if (this.texto === "") {
      return "Informe o gasto do mês (pode ser zero).";
    }
    return this.valor() === null ? "Valor inválido. Use, por exemplo, 2.500,00." : null;
  }
}
