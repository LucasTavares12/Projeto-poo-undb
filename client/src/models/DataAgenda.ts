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

  public toString(): string {
    return this.valor;
  }
}
