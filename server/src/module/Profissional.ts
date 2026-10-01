import { Pessoa } from "./Pessoa";

export class Profissional extends Pessoa {
  private id?: number;
  private especialidade: string;

  constructor(nome: string, telefone: string, especialidade: string, id?: number) {
    super(nome, telefone);
    this.especialidade = especialidade;
    this.id = id;
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getEspecialidade(): string {
    return this.especialidade;
  }

  public setEspecialidade(especialidade: string): void {
    this.especialidade = especialidade;
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
