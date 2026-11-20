import { MesReferencia } from "./MesReferencia";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/**
 * Quanto foi gasto num mês, informado na aba "Relatórios". Pode ser o gasto da clínica
 * inteira (aluguel, contas, salários...) ou o gasto próprio de um profissional (produtos,
 * materiais, comissão...). Um valor por mês para cada um: é o que se desconta do
 * faturamento correspondente para chegar ao lucro.
 */
export class GastoMensal {
  /** Cabe na coluna DECIMAL(12,2). */
  public static readonly VALOR_MAXIMO = 9_999_999_999.99;

  private readonly mes: MesReferencia;
  /** null = gasto da clínica inteira; com valor, o gasto próprio daquele profissional. */
  private readonly profissionalId: number | null;
  private valor: number;

  /** Carrega do banco (o valor não é validado; o mês sempre é, pelo `MesReferencia`). */
  constructor(mes: string, valor: number, profissionalId: number | null = null) {
    this.mes = new MesReferencia(mes);
    this.valor = valor;
    this.profissionalId = profissionalId;
  }

  /** Gasto informado agora: valida o mês e o valor. */
  public static novo(mes: string, valor: unknown, profissionalId: number | null = null): GastoMensal {
    const gasto = new GastoMensal(mes, 0, profissionalId);
    gasto.setValor(valor);
    return gasto;
  }

  /** "AAAA-MM". */
  public getMes(): string {
    return this.mes.toString();
  }

  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  /** true = gasto da clínica inteira (não de um profissional). */
  public ehDaClinica(): boolean {
    return this.profissionalId === null;
  }

  public getValor(): number {
    return this.valor;
  }

  /** Zero ou mais, em centavos (R$ 1.250,505 vira R$ 1.250,51). */
  public setValor(valor: unknown): void {
    const numero = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;
    if (typeof numero !== "number" || !Number.isFinite(numero) || numero < 0) {
      throw new ErroDeValidacao("Informe um gasto válido (zero ou mais).");
    }
    if (numero > GastoMensal.VALOR_MAXIMO) {
      throw new ErroDeValidacao("O gasto informado é alto demais. Confira o valor.");
    }
    this.valor = Math.round(numero * 100) / 100;
  }

  public toJSON() {
    return { mes: this.getMes(), profissionalId: this.profissionalId, valor: this.valor };
  }
}
