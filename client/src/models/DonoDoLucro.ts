import { MesReferencia } from "./MesReferencia";

/**
 * De quem é o lucro mostrado no cartão: da clínica inteira (faturamento de todos − gasto da
 * clínica) ou de um profissional (faturamento dele − gasto próprio dele). Cuida dos textos
 * que mudam de um caso para o outro.
 */
export class DonoDoLucro {
  /** null = clínica inteira. */
  private readonly profissionalId: number | null;
  private readonly nomeDoProfissional: string | null;

  constructor(profissionalId: number | null, nomeDoProfissional: string | null = null) {
    this.profissionalId = profissionalId;
    this.nomeDoProfissional = nomeDoProfissional;
  }

  /** null = clínica inteira. */
  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  public ehDaClinica(): boolean {
    return this.profissionalId === null;
  }

  /** "Lucro da clínica" ou "Lucro de Bia". */
  public titulo(): string {
    if (this.ehDaClinica()) {
      return "Lucro da clínica";
    }
    return this.nomeDoProfissional ? `Lucro de ${this.nomeDoProfissional}` : "Lucro do profissional";
  }

  public descricao(mes: MesReferencia): string {
    return this.ehDaClinica()
      ? `Faturamento de todos os profissionais menos os gastos da clínica em ${mes.getNomeDoMes()}.`
      : `Faturamento ${this.nomeDoProfissional ? `de ${this.nomeDoProfissional}` : "do profissional"} menos os gastos ` +
          `próprios informados em ${mes.getNomeDoMes()}.`;
  }

  /** O que entra no gasto do mês. */
  public dicaDoGasto(): string {
    return this.ehDaClinica()
      ? "Some tudo o que a clínica gastou no mês: aluguel, produtos, salários, contas e outros custos."
      : "Some os gastos próprios do mês: produtos, materiais, comissão e outros custos. " +
          "O gasto geral da clínica fica no relatório de todos os profissionais.";
  }
}
