/** Mês escolhido na aba "Relatórios", no formato da API ("AAAA-MM"). */
export class MesReferencia {
  private static readonly NOME = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  private readonly ano: number;
  private readonly mes: number; // 1 a 12

  constructor(ano: number, mes: number) {
    // Normaliza estouros (mês 0 vira dezembro do ano anterior, mês 13 vira janeiro do seguinte).
    const data = new Date(Date.UTC(ano, mes - 1, 1));
    this.ano = data.getUTCFullYear();
    this.mes = data.getUTCMonth() + 1;
  }

  public static atual(): MesReferencia {
    const hoje = new Date();
    return new MesReferencia(hoje.getFullYear(), hoje.getMonth() + 1);
  }

  /** A partir do texto da API ("AAAA-MM"). */
  public static de(texto: string): MesReferencia {
    const [ano, mes] = texto.split("-").map(Number);
    return new MesReferencia(ano, mes);
  }

  public anterior(): MesReferencia {
    return new MesReferencia(this.ano, this.mes - 1);
  }

  public proximo(): MesReferencia {
    return new MesReferencia(this.ano, this.mes + 1);
  }

  public ehDepoisDe(outro: MesReferencia): boolean {
    return this.toString() > outro.toString();
  }

  /** "Outubro de 2026" */
  public formatar(): string {
    const texto = MesReferencia.NOME.format(new Date(Date.UTC(this.ano, this.mes - 1, 1)));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  /** Só o nome, em minúsculas: "setembro". */
  public getNomeDoMes(): string {
    return MesReferencia.NOME.format(new Date(Date.UTC(this.ano, this.mes - 1, 1)))
      .split(" ")[0]
      .toLowerCase();
  }

  public toString(): string {
    return `${this.ano}-${String(this.mes).padStart(2, "0")}`;
  }
}
