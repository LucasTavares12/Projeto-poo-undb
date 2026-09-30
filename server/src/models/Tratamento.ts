import { Horario } from "./Horario";

export class Tratamento {
  private id?: number;
  private nome: string;
  private descricao: string;
  private valor: number;
  private duracaoMinutos: number;

  constructor(
    nome: string,
    descricao: string,
    valor: number,
    duracaoMinutos: number,
    id?: number
  ) {
    if (valor < 0) {
      throw new Error("O valor do tratamento não pode ser negativo.");
    }
    if (duracaoMinutos <= 0 || duracaoMinutos % Horario.DURACAO_SLOT_MINUTOS !== 0) {
      throw new Error(
        `A duração do tratamento deve ser um múltiplo de ${Horario.DURACAO_SLOT_MINUTOS} minutos.`
      );
    }

    this.nome = nome;
    this.descricao = descricao;
    this.valor = valor;
    this.duracaoMinutos = duracaoMinutos;
    this.id = id;
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getNome(): string {
    return this.nome;
  }

  public getDescricao(): string {
    return this.descricao;
  }

  public getValor(): number {
    return this.valor;
  }

  public getDuracaoMinutos(): number {
    return this.duracaoMinutos;
  }

  public setNome(nome: string): void {
    this.nome = nome;
  }

  public setDescricao(descricao: string): void {
    this.descricao = descricao;
  }

  public setValor(valor: number): void {
    if (valor < 0) {
      throw new Error("O valor do tratamento não pode ser negativo.");
    }
    this.valor = valor;
  }

  public setDuracaoMinutos(duracaoMinutos: number): void {
    if (duracaoMinutos <= 0 || duracaoMinutos % Horario.DURACAO_SLOT_MINUTOS !== 0) {
      throw new Error(
        `A duração do tratamento deve ser um múltiplo de ${Horario.DURACAO_SLOT_MINUTOS} minutos.`
      );
    }
    this.duracaoMinutos = duracaoMinutos;
  }

  /** Quantidade de slots de 30min que o tratamento ocupa na agenda. */
  public getQuantidadeSlots(): number {
    return this.duracaoMinutos / Horario.DURACAO_SLOT_MINUTOS;
  }
}
