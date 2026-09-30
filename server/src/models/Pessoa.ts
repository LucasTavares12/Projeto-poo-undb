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

  public abstract apresentar(): string;
}
