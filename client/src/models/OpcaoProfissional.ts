/**
 * Valor de um <select> de profissional. O select só trabalha com texto: a opção vazia ("")
 * representa "nenhum profissional" (todos, acesso total ou clínica inteira, conforme a tela).
 */
export class OpcaoProfissional {
  public static readonly NENHUM = "";

  /** Texto do select → id do profissional, ou null para a opção vazia. */
  public static lerId(valor: string): number | null {
    return valor === OpcaoProfissional.NENHUM ? null : Number(valor);
  }

  /** id do profissional (ou null) → texto do select. */
  public static paraValor(id: number | null): string {
    return id === null ? OpcaoProfissional.NENHUM : String(id);
  }
}
