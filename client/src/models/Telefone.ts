/**
 * Telefone brasileiro com DDD: 10 dígitos (fixo) ou 11 (celular).
 * Mesma regra que o servidor aplica ao criar um agendamento.
 */
export class Telefone {
  private readonly digitos: string;

  constructor(texto: string) {
    // Guarda só os números, no máximo 11 (DDD + 9 dígitos).
    this.digitos = texto.replace(/\D/g, "").slice(0, 11);
  }

  public ehValido(): boolean {
    return this.digitos.length === 10 || this.digitos.length === 11;
  }

  /** Máscara aplicada enquanto a pessoa digita: "(98) 98877-6655" ou "(98) 3232-1234". */
  public formatar(): string {
    const d = this.digitos;
    if (d.length <= 2) {
      return d.length ? `(${d}` : "";
    }
    const ddd = d.slice(0, 2);
    const resto = d.slice(2);
    const corte = d.length === 11 ? 5 : 4;
    if (resto.length <= corte) {
      return `(${ddd}) ${resto}`;
    }
    return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
  }
}
