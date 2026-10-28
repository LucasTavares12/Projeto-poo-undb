import { Pessoa } from "./Pessoa";

export class Profissional extends Pessoa {
  public static readonly TAMANHO_MAXIMO_ESPECIALIDADE = 100;

  private id?: number;
  private especialidade: string;

  constructor(nome: string, telefone: string, especialidade: string, id?: number) {
    super(nome, telefone);
    this.especialidade = especialidade;
    this.id = id;
  }

  /** Profissional novo (cadastro no painel): valida nome, telefone e especialidade. */
  public static novo(nome: string, telefone: string, especialidade: string): Profissional {
    const profissional = new Profissional(nome, telefone, especialidade);
    profissional.validarContato();
    profissional.setEspecialidade(especialidade);
    return profissional;
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getEspecialidade(): string {
    return this.especialidade;
  }

  public setEspecialidade(especialidade: string): void {
    const texto = String(especialidade ?? "").trim();
    if (texto === "") {
      throw new Error("Informe a especialidade do profissional.");
    }
    if (texto.length > Profissional.TAMANHO_MAXIMO_ESPECIALIDADE) {
      throw new Error(
        `A especialidade pode ter no máximo ${Profissional.TAMANHO_MAXIMO_ESPECIALIDADE} caracteres.`
      );
    }
    this.especialidade = texto;
  }

  /** Altera os dados de uma vez, validando tudo (edição no painel). */
  public atualizarDados(nome: string, telefone: string, especialidade: string): void {
    this.setNome(nome);
    this.setTelefone(telefone);
    this.setEspecialidade(especialidade);
  }

  protected papel(): string {
    return "do profissional";
  }

  public apresentar(): string {
    return `Profissional: ${this.nome} - ${this.especialidade}`;
  }

  public toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      telefone: this.telefone,
      especialidade: this.especialidade,
    };
  }
}
