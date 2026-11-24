import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/**
 * Como o cliente pretende pagar o atendimento, informado já no agendamento: a equipe fica
 * sabendo antes e agiliza a hora de receber. Objeto de valor com um conjunto fechado de
 * opções (Pix, cartão de crédito, cartão de débito e dinheiro): só existem as instâncias
 * estáticas abaixo e duas iguais são sempre o mesmo objeto.
 */
export class FormaDePagamento {
  public static readonly PIX = new FormaDePagamento("PIX", "Pix");
  public static readonly CARTAO_CREDITO = new FormaDePagamento("CARTAO_CREDITO", "Cartão de crédito");
  public static readonly CARTAO_DEBITO = new FormaDePagamento("CARTAO_DEBITO", "Cartão de débito");
  public static readonly DINHEIRO = new FormaDePagamento("DINHEIRO", "Dinheiro");

  private static readonly TODAS: FormaDePagamento[] = [
    FormaDePagamento.PIX,
    FormaDePagamento.CARTAO_CREDITO,
    FormaDePagamento.CARTAO_DEBITO,
    FormaDePagamento.DINHEIRO,
  ];

  private readonly codigo: string;
  private readonly nome: string;

  private constructor(codigo: string, nome: string) {
    this.codigo = codigo;
    this.nome = nome;
  }

  public static todas(): FormaDePagamento[] {
    return [...FormaDePagamento.TODAS];
  }

  /** A forma com este código ("PIX", "DINHEIRO"...); lança erro se não existir. */
  public static ler(codigo: unknown): FormaDePagamento {
    const forma = FormaDePagamento.TODAS.find((opcao) => opcao.codigo === codigo);
    if (!forma) {
      throw new ErroDeValidacao("Escolha uma forma de pagamento válida.");
    }
    return forma;
  }

  /** Como `ler`, mas vazio (undefined, null ou "") significa "não informada" e vira null. */
  public static lerOpcional(codigo: unknown): FormaDePagamento | null {
    return codigo === undefined || codigo === null || codigo === ""
      ? null
      : FormaDePagamento.ler(codigo);
  }

  public getCodigo(): string {
    return this.codigo;
  }

  public getNome(): string {
    return this.nome;
  }

  public toString(): string {
    return this.nome;
  }

  /** Na API vai só o código; a tela sabe o nome de cada um. */
  public toJSON(): string {
    return this.codigo;
  }
}
