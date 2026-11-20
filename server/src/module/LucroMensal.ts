import { RelatorioMensal } from "./RelatorioMensal";
import { GastoMensal } from "./GastoMensal";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/**
 * Lucro de um mês: o faturamento (atendimentos finalizados) menos o gasto do mês informado
 * no painel. Pode ser o da clínica inteira (faturamento de todos − gasto da clínica) ou o de
 * um profissional (faturamento dele − gasto próprio dele). Sem gasto informado, ainda não dá
 * para saber o lucro (fica null). O gasto do mês anterior vai junto, para a tela sugerir o
 * mesmo valor (esses gastos costumam se repetir).
 */
export class LucroMensal {
  private readonly relatorio: RelatorioMensal;
  private readonly gasto: GastoMensal | null;
  private readonly gastoDoMesAnterior: GastoMensal | null;

  constructor(
    relatorio: RelatorioMensal,
    gasto: GastoMensal | null,
    gastoDoMesAnterior: GastoMensal | null = null
  ) {
    if (gasto !== null && gasto.getMes() !== relatorio.getMes()) {
      throw new ErroDeValidacao("O gasto informado é de outro mês.");
    }
    for (const outro of [gasto, gastoDoMesAnterior]) {
      if (outro !== null && outro.getProfissionalId() !== relatorio.getProfissionalId()) {
        throw new ErroDeValidacao(
          "O gasto informado não é do mesmo profissional (ou da clínica) do relatório."
        );
      }
    }
    this.relatorio = relatorio;
    this.gasto = gasto;
    this.gastoDoMesAnterior = gastoDoMesAnterior;
  }

  /** null = lucro da clínica inteira; com valor, o daquele profissional. */
  public getProfissionalId(): number | null {
    return this.relatorio.getProfissionalId();
  }

  public getFaturamento(): number {
    return this.relatorio.getFaturamentoTotal();
  }

  public gastoFoiInformado(): boolean {
    return this.gasto !== null;
  }

  /** null = o gasto do mês ainda não foi informado. */
  public getGasto(): number | null {
    return this.gasto?.getValor() ?? null;
  }

  /** Faturamento − gasto (pode ser negativo: prejuízo). null = falta informar o gasto. */
  public getLucro(): number | null {
    return this.gasto === null ? null : LucroMensal.centavos(this.getFaturamento() - this.gasto.getValor());
  }

  /** Quanto do faturamento sobrou, em % (null sem gasto ou sem faturamento). */
  public getMargem(): number | null {
    const lucro = this.getLucro();
    const faturamento = this.getFaturamento();
    return lucro === null || faturamento === 0 ? null : (lucro / faturamento) * 100;
  }

  private static centavos(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  public toJSON() {
    return {
      mes: this.relatorio.getMes(),
      profissionalId: this.getProfissionalId(),
      faturamento: this.getFaturamento(),
      gasto: this.getGasto(),
      lucro: this.getLucro(),
      margem: this.getMargem(),
      gastoDoMesAnterior: this.gastoDoMesAnterior?.getValor() ?? null,
    };
  }
}
