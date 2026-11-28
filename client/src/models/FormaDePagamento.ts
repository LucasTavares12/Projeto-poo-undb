import type { CodigoFormaDePagamento } from "../services/types";

/**
 * Como o cliente pretende pagar o atendimento (Pix, cartão de crédito, cartão de débito ou
 * dinheiro). Mesmas opções do servidor (FormaDePagamento), que é quem valida. Só existem as
 * instâncias estáticas; `de(codigo)` devolve a do código vindo da API.
 */
export class FormaDePagamento {
  public static readonly PIX = new FormaDePagamento("PIX", "Pix", "Transferência na hora");
  public static readonly CARTAO_CREDITO = new FormaDePagamento(
    "CARTAO_CREDITO",
    "Cartão de crédito",
    "Na maquininha"
  );
  public static readonly CARTAO_DEBITO = new FormaDePagamento(
    "CARTAO_DEBITO",
    "Cartão de débito",
    "Na maquininha"
  );
  public static readonly DINHEIRO = new FormaDePagamento("DINHEIRO", "Dinheiro", "Em espécie");

  private static readonly TODAS: FormaDePagamento[] = [
    FormaDePagamento.PIX,
    FormaDePagamento.CARTAO_CREDITO,
    FormaDePagamento.CARTAO_DEBITO,
    FormaDePagamento.DINHEIRO,
  ];

  private readonly codigo: CodigoFormaDePagamento;
  private readonly nome: string;
  private readonly detalhe: string;

  private constructor(codigo: CodigoFormaDePagamento, nome: string, detalhe: string) {
    this.codigo = codigo;
    this.nome = nome;
    this.detalhe = detalhe;
  }

  public static todas(): FormaDePagamento[] {
    return [...FormaDePagamento.TODAS];
  }

  /** A forma do código (null ou código desconhecido = não informada). */
  public static de(codigo: string | null | undefined): FormaDePagamento | null {
    return FormaDePagamento.TODAS.find((forma) => forma.codigo === codigo) ?? null;
  }

  /** "Pix", "Dinheiro"... ou "Não informada". */
  public static nomeDe(codigo: string | null | undefined): string {
    return FormaDePagamento.de(codigo)?.getNome() ?? "Não informada";
  }

  public getCodigo(): CodigoFormaDePagamento {
    return this.codigo;
  }

  public getNome(): string {
    return this.nome;
  }

  /** Explicação curta mostrada no botão de escolha. */
  public getDetalhe(): string {
    return this.detalhe;
  }
}
