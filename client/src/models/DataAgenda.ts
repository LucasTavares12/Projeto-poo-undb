/**
 * Data de calendário (sem hora) no formato usado pela API: "YYYY-MM-DD".
 * Concentra a criação e a formatação de datas da agenda em um único objeto.
 */
export class DataAgenda {
  private readonly valor: string;

  constructor(valor: string) {
    this.valor = valor.slice(0, 10);
  }

  /** Dia atual no fuso do navegador (toISOString usaria UTC e viraria o dia à noite). */
  public static hoje(): DataAgenda {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return new DataAgenda(`${agora.getFullYear()}-${mes}-${dia}`);
  }

  /** "DD/MM/YYYY", como a data é exibida para o usuário. */
  public formatar(): string {
    const [ano, mes, dia] = this.valor.split("-");
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : this.valor;
  }

  /** A mesma data andando N dias (negativo volta). Conta em UTC para não sofrer com horário de verão. */
  public somarDias(dias: number): DataAgenda {
    const data = this.paraDate();
    data.setUTCDate(data.getUTCDate() + dias);
    return new DataAgenda(data.toISOString());
  }

  /** Dia do mês, sem zero à esquerda (ex: 5). */
  public getDia(): number {
    return this.paraDate().getUTCDate();
  }

  /** Dia da semana abreviado, sem ponto (ex: "seg"). */
  public getDiaDaSemanaCurto(): string {
    return DataAgenda.DIA_DA_SEMANA.format(this.paraDate()).replace(".", "");
  }

  /** Mês abreviado, sem ponto (ex: "out"). */
  public getMesCurto(): string {
    return DataAgenda.MES.format(this.paraDate()).replace(".", "");
  }

  /** Por extenso, para títulos (ex: "terça-feira, 21 de outubro"). */
  public formatarPorExtenso(): string {
    return DataAgenda.POR_EXTENSO.format(this.paraDate());
  }

  private static readonly DIA_DA_SEMANA = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  });

  private static readonly MES = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

  private static readonly POR_EXTENSO = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  private paraDate(): Date {
    return new Date(`${this.valor}T00:00:00Z`);
  }

  public toString(): string {
    return this.valor;
  }
}
