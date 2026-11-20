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

  /**
   * O que identifica a pessoa atendida: telefone (só números) + nome normalizado. Um mesmo
   * telefone pode ter várias pessoas (a mãe e a filha que ela agendou).
   */
  public getIdentificador(): string {
    return `${this.getTelefoneDigitos()}|${Pessoa.normalizarNome(this.nome)}`;
  }

  /** true se é a mesma pessoa: mesmo telefone e mesmo nome (sem ligar para acentos e maiúsculas). */
  public ehAMesmaPessoaQue(outro: Cliente): boolean {
    return this.getIdentificador() === outro.getIdentificador();
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
