/**
 * Telefone brasileiro com DDD: 10 dígitos (fixo) ou 11 (celular). É o que identifica o
 * cliente (para remarcar, cancelar e montar a ficha). Toda validação de telefone do
 * sistema passa por aqui. Mesma regra do `Telefone` da página do cliente.
 */
export class Telefone {
  private readonly digitos: string;

  constructor(texto: string) {
    const digitos = Telefone.somenteDigitos(texto);
    if (digitos.length < 10 || digitos.length > 11) {
      throw new Error("Telefone inválido: informe o DDD e o número.");
    }
    this.digitos = digitos;
  }

  /** "(98) 98877-6655" → "98988776655". Não valida: serve também para dados antigos. */
  public static somenteDigitos(texto: string): string {
    return String(texto ?? "").replace(/\D/g, "");
  }

  public static ehValido(texto: string): boolean {
    const digitos = Telefone.somenteDigitos(texto);
    return digitos.length === 10 || digitos.length === 11;
  }

  public getDigitos(): string {
    return this.digitos;
  }

  /** "(98) 98877-6655" ou "(98) 3232-1234". */
  public formatar(): string {
    const ddd = this.digitos.slice(0, 2);
    const resto = this.digitos.slice(2);
    const corte = resto.length === 9 ? 5 : 4;
    return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
  }

  public equals(outro: Telefone): boolean {
    return this.digitos === outro.digitos;
  }

  public toString(): string {
    return this.formatar();
  }
}
