/**
 * Datas da agenda (dia, sem hora). Toda data da agenda é guardada como meia-noite UTC
 * do dia, para "2026-10-22" ser sempre o mesmo dia, em qualquer fuso do servidor.
 * Concentra aqui a leitura do texto "YYYY-MM-DD" e a volta para texto, usadas pelos
 * controllers, entidades e repositórios.
 */
export class DataAgenda {
  private static readonly FORMATO = /^\d{4}-\d{2}-\d{2}$/;

  /** "YYYY-MM-DD" → Date (meia-noite UTC). Lança `mensagemDeErro` se o texto não for uma data. */
  public static ler(valor: unknown, mensagemDeErro = "Data inválida."): Date {
    const texto = String(valor ?? "");
    const data = new Date(`${texto}T00:00:00Z`);
    if (!DataAgenda.FORMATO.test(texto) || Number.isNaN(data.getTime())) {
      throw new Error(mensagemDeErro);
    }
    return data;
  }

  /** Date → "YYYY-MM-DD", o formato da API e do banco. */
  public static paraTexto(data: Date): string {
    return data.toISOString().slice(0, 10);
  }

  /** true se as duas datas caem no mesmo dia. */
  public static mesmoDia(uma: Date, outra: Date): boolean {
    return DataAgenda.paraTexto(uma) === DataAgenda.paraTexto(outra);
  }
}
