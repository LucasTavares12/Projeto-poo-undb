import type { CodigoFormaDePagamento, Tratamento } from "../services/types";

/** Tratamentos escolhidos para um agendamento, com os totais que aparecem na tela. */
export class SelecaoDeTratamentos {
  private readonly tratamentos: Tratamento[];

  constructor(tratamentos: Tratamento[]) {
    this.tratamentos = tratamentos;
  }

  /**
   * Quanto o tratamento custa nesta forma de pagamento: no cartão de crédito, o valor do
   * crédito (se a clínica cadastrou um); nas outras formas, o valor normal. Mesma regra do
   * servidor (Tratamento.getValorPara), que é quem calcula o total gravado.
   */
  public static valorDe(tratamento: Tratamento, forma: CodigoFormaDePagamento | null): number {
    if (forma === "CARTAO_CREDITO" && tratamento.valorCartaoCredito != null) {
      return tratamento.valorCartaoCredito;
    }
    return tratamento.valor;
  }

  /** true se o tratamento tem um valor diferente quando pago no cartão de crédito. */
  public static temValorNoCredito(tratamento: Tratamento): boolean {
    return tratamento.valorCartaoCredito != null && tratamento.valorCartaoCredito !== tratamento.valor;
  }

  public getQuantidade(): number {
    return this.tratamentos.length;
  }

  /** Total na forma de pagamento escolhida (sem forma = valor normal). */
  public getValorTotal(forma: CodigoFormaDePagamento | null = null): number {
    return this.tratamentos.reduce(
      (total, tratamento) => total + SelecaoDeTratamentos.valorDe(tratamento, forma),
      0
    );
  }

  public getDuracaoTotalMinutos(): number {
    return this.tratamentos.reduce((total, tratamento) => total + tratamento.duracaoMinutos, 0);
  }

  public getNomes(): string[] {
    return this.tratamentos.map((tratamento) => tratamento.nome);
  }
}
