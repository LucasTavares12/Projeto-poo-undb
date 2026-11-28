import type { LucroMensal } from "../services/types";

export type SituacaoDoMes = "sem-gasto" | "lucro" | "prejuizo";

/**
 * Lucro de um mês como a tela mostra: faturamento − gasto informado. Sem gasto informado,
 * a situação fica "sem-gasto" (ainda não dá para saber se houve lucro).
 */
export class LucroDoMes {
  private static readonly PERCENTUAL = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  });

  private readonly dados: LucroMensal;

  constructor(dados: LucroMensal) {
    this.dados = dados;
  }

  public getMes(): string {
    return this.dados.mes;
  }

  public getFaturamento(): number {
    return this.dados.faturamento;
  }

  public getGasto(): number | null {
    return this.dados.gasto;
  }

  public getLucro(): number | null {
    return this.dados.lucro;
  }

  public situacao(): SituacaoDoMes {
    if (this.dados.lucro === null) {
      return "sem-gasto";
    }
    return this.dados.lucro >= 0 ? "lucro" : "prejuizo";
  }

  /** "Lucro do mês" ou "Prejuízo do mês". */
  public rotuloDoResultado(): string {
    return this.situacao() === "prejuizo" ? "Prejuízo do mês" : "Lucro do mês";
  }

  /** "Margem de 24,9% do faturamento" (ou null quando não há margem para mostrar). */
  public descreverMargem(): string | null {
    if (this.dados.margem === null) {
      return null;
    }
    return `Margem de ${LucroDoMes.PERCENTUAL.format(this.dados.margem)}% do faturamento`;
  }

  /** O gasto do mês anterior, para sugerir o mesmo valor (null = não tem). */
  public sugestaoDeGasto(): number | null {
    return this.dados.gastoDoMesAnterior;
  }
}
