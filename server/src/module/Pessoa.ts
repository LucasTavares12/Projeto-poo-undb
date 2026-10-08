export abstract class Pessoa {
  protected nome: string;
  protected telefone: string;

  constructor(nome: string, telefone: string) {
    this.nome = nome;
    this.telefone = telefone;
  }

  public getNome(): string {
    return this.nome;
  }

  public setNome(nome: string): void {
    this.nome = nome;
  }

  public getTelefone(): string {
    return this.telefone;
  }

  public setTelefone(telefone: string): void {
    this.telefone = telefone;
  }

  /** Compara só os números: "(98) 98877-6655" e "98988776655" são o mesmo telefone. */
  public temTelefone(telefone: string): boolean {
    const digitos = Pessoa.somenteDigitos(telefone);
    return digitos.length > 0 && Pessoa.somenteDigitos(this.telefone) === digitos;
  }

  private static somenteDigitos(telefone: string): string {
    return String(telefone ?? "").replace(/\D/g, "");
  }

  public abstract apresentar(): string;
}
