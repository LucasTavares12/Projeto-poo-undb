import { Horario } from "./Horario";

export class Tratamento {
  private id?: number;
  private nome: string;
  private descricao: string;
  private valor: number;
  private duracaoMinutos: number;
  /**
   * Profissional que realiza este tratamento. null = qualquer profissional da clínica
   * (é como ficam os tratamentos cadastrados antes de existir o vínculo).
   */
  private profissionalId: number | null = null;

  constructor(
    nome: string,
    descricao: string,
    valor: number,
    duracaoMinutos: number,
    id?: number,
    profissionalId: number | null = null
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
    this.vincularProfissional(profissionalId);
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

  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  /** Liga o tratamento a um profissional (ou, com null, libera para todos). */
  public vincularProfissional(profissionalId: number | null): void {
    if (profissionalId !== null && (!Number.isInteger(profissionalId) || profissionalId <= 0)) {
      throw new Error("Profissional inválido.");
    }
    this.profissionalId = profissionalId;
  }

  /** true se este profissional realiza o tratamento (o dono dele, ou qualquer um se não houver dono). */
  public ehRealizadoPor(profissionalId: number): boolean {
    return this.profissionalId === null || this.profissionalId === profissionalId;
  }

  /** Quantidade de slots de 30min que o tratamento ocupa na agenda. */
  public getQuantidadeSlots(): number {
    return this.duracaoMinutos / Horario.DURACAO_SLOT_MINUTOS;
  }

  public toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      valor: this.valor,
      duracaoMinutos: this.duracaoMinutos,
      profissionalId: this.profissionalId,
      quantidadeSlots: this.getQuantidadeSlots(),
    };
  }
}
