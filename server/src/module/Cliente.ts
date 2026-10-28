import { Pessoa } from "./Pessoa";

export class Cliente extends Pessoa {
  private id?: number;

  constructor(nome: string, telefone: string, id?: number) {
    super(nome, telefone);
    this.id = id;
  }

  /** Cliente novo (vindo de um agendamento): valida nome e telefone. */
  public static novo(nome: string, telefone: string): Cliente {
    const cliente = new Cliente(nome, telefone);
    cliente.validarContato();
    return cliente;
  }

  public getId(): number | undefined {
    return this.id;
  }

  protected papel(): string {
    return "do cliente";
  }

  public apresentar(): string {
    return `Cliente: ${this.nome} (contato: ${this.telefone})`;
  }

  public toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      telefone: this.telefone,
    };
  }
}
