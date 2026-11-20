import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/**
 * Um mês do calendário ("AAAA-MM"), usado nos relatórios, no lucro e nos gastos.
 * Objeto de valor: valida o formato ao ser criado e não muda depois.
 */
export class MesReferencia {
  private static readonly FORMATO = /^(\d{4})-(0[1-9]|1[0-2])$/;

  private readonly ano: number;
  private readonly mes: number; // 1 a 12

  constructor(texto: string) {
    const correspondencia = MesReferencia.FORMATO.exec(String(texto ?? ""));
    if (!correspondencia) {
      throw new ErroDeValidacao('Mês inválido. Use o formato "AAAA-MM".');
    }
    this.ano = Number(correspondencia[1]);
    this.mes = Number(correspondencia[2]);
  }

  /** "2026-01" → "2025-12". */
  public anterior(): MesReferencia {
    return this.mes === 1
      ? MesReferencia.de(this.ano - 1, 12)
      : MesReferencia.de(this.ano, this.mes - 1);
  }

  public getQuantidadeDeDias(): number {
    return new Date(Date.UTC(this.ano, this.mes, 0)).getUTCDate();
  }

  /** Um dia do mês no formato das consultas: dia(5) → "2026-10-05". */
  public dia(numero: number): string {
    return `${this.toString()}-${String(numero).padStart(2, "0")}`;
  }

  public getPrimeiroDia(): string {
    return this.dia(1);
  }

  public getUltimoDia(): string {
    return this.dia(this.getQuantidadeDeDias());
  }

  /** true se a data ("YYYY-MM-DD") cai neste mês. */
  public contem(data: string): boolean {
    return data.startsWith(`${this.toString()}-`);
  }

  public equals(outro: MesReferencia): boolean {
    return this.toString() === outro.toString();
  }

  public toString(): string {
    return `${this.ano}-${String(this.mes).padStart(2, "0")}`;
  }

  private static de(ano: number, mes: number): MesReferencia {
    return new MesReferencia(`${ano}-${String(mes).padStart(2, "0")}`);
  }
}
