import { Pessoa } from "./Pessoa";

export class Cliente extends Pessoa {
  private id?: number;

  constructor(nome: string, telefone: string, id?: number) {
    super(nome, telefone);
    this.id = id;
  }

  public getId(): number | undefined {
    return this.id;
  }

  public apresentar(): string {
    return `Cliente: ${this.nome} (contato: ${this.telefone})`;
  }
}
