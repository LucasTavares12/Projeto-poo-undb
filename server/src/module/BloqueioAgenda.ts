import { DataAgenda } from "./DataAgenda";

/**
 * Período de dias inteiros em que a agenda fica fechada: folga ou férias de um
 * profissional, ou feriado/recesso da clínica inteira (sem profissional).
 * Enquanto um bloqueio cobre uma data, nenhum horário aparece livre nesse dia,
 * mesmo que a grade semanal (HorarioDisponivel) esteja liberada.
 */
export class BloqueioAgenda {
  public static readonly TAMANHO_MAXIMO_MOTIVO = 150;
  /** Um bloqueio cobre no máximo um ano: períodos maiores costumam ser erro de digitação. */
  public static readonly DIAS_MAXIMOS = 366;

  private static readonly MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

  private id?: number;
  /** null = clínica inteira (vale para todos os profissionais). */
  private profissionalId: number | null;
  private dataInicio: Date;
  private dataFim: Date;
  private motivo: string;

  constructor(
    profissionalId: number | null,
    dataInicio: Date,
    dataFim: Date,
    motivo: string,
    id?: number
  ) {
    if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) {
      throw new Error("Informe datas válidas para o bloqueio.");
    }
    if (dataFim < dataInicio) {
      throw new Error("A data final do bloqueio não pode ser antes da data inicial.");
    }
    const motivoLimpo = String(motivo ?? "").trim();
    if (motivoLimpo.length > BloqueioAgenda.TAMANHO_MAXIMO_MOTIVO) {
      throw new Error(
        `O motivo pode ter no máximo ${BloqueioAgenda.TAMANHO_MAXIMO_MOTIVO} caracteres.`
      );
    }

    this.profissionalId = profissionalId;
    this.dataInicio = dataInicio;
    this.dataFim = dataFim;
    this.motivo = motivoLimpo;
    this.id = id;

    if (this.getQuantidadeDias() > BloqueioAgenda.DIAS_MAXIMOS) {
      throw new Error(`Um bloqueio pode durar no máximo ${BloqueioAgenda.DIAS_MAXIMOS} dias.`);
    }
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  public getDataInicio(): Date {
    return this.dataInicio;
  }

  public getDataFim(): Date {
    return this.dataFim;
  }

  public getMotivo(): string {
    return this.motivo;
  }

  public ehDaClinicaInteira(): boolean {
    return this.profissionalId === null;
  }

  /** true se a agenda deste profissional fica fechada por causa deste bloqueio. */
  public valeParaProfissional(profissionalId: number): boolean {
    return this.ehDaClinicaInteira() || this.profissionalId === profissionalId;
  }

  /** true se a data (dia inteiro) está dentro do período, contando o primeiro e o último dia. */
  public abrange(data: Date): boolean {
    const dia = DataAgenda.paraTexto(data);
    return (
      dia >= DataAgenda.paraTexto(this.dataInicio) &&
      dia <= DataAgenda.paraTexto(this.dataFim)
    );
  }

  /** Dias cobertos, contando o primeiro e o último (de 10 a 12 = 3 dias). */
  public getQuantidadeDias(): number {
    return (
      Math.round(
        (this.dataFim.getTime() - this.dataInicio.getTime()) / BloqueioAgenda.MILISSEGUNDOS_POR_DIA
      ) + 1
    );
  }

  public toJSON() {
    return {
      id: this.id,
      profissionalId: this.profissionalId,
      dataInicio: DataAgenda.paraTexto(this.dataInicio),
      dataFim: DataAgenda.paraTexto(this.dataFim),
      motivo: this.motivo,
      quantidadeDias: this.getQuantidadeDias(),
    };
  }

  /** O que a página do cliente pode ver: só o período, sem o motivo (que é interno). */
  public paraPublico() {
    return {
      dataInicio: DataAgenda.paraTexto(this.dataInicio),
      dataFim: DataAgenda.paraTexto(this.dataFim),
    };
  }
}
