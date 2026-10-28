import { Horario } from "./Horario";

export class Tratamento {
  public static readonly TAMANHO_MAXIMO_NOME = 150;

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
    if (!Number.isFinite(valor) || valor < 0) {
      throw new Error("Informe um valor válido para o tratamento (zero ou mais).");
    }
    if (duracaoMinutos <= 0 || duracaoMinutos % Horario.DURACAO_SLOT_MINUTOS !== 0) {
      throw new Error(
        `A duração do tratamento deve ser um múltiplo de ${Horario.DURACAO_SLOT_MINUTOS} minutos.`
      );
    }

    this.nome = "";
    this.setNome(nome);
    this.descricao = String(descricao ?? "").trim();
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
    const texto = String(nome ?? "").trim();
    if (texto === "") {
      throw new Error("Informe o nome do tratamento.");
    }
    if (texto.length > Tratamento.TAMANHO_MAXIMO_NOME) {
      throw new Error(
        `O nome do tratamento pode ter no máximo ${Tratamento.TAMANHO_MAXIMO_NOME} caracteres.`
      );
    }
    this.nome = texto;
  }

  public setDescricao(descricao: string): void {
    this.descricao = String(descricao ?? "").trim();
  }

  public setValor(valor: number): void {
    if (!Number.isFinite(valor) || valor < 0) {
      throw new Error("Informe um valor válido para o tratamento (zero ou mais).");
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

  /** Altera os dados de uma vez, validando tudo (edição no painel). */
  public atualizarDados(
    nome: string,
    descricao: string,
    valor: number,
    duracaoMinutos: number,
    profissionalId: number | null
  ): void {
    this.setNome(nome);
    this.setDescricao(descricao);
    this.setValor(valor);
    this.setDuracaoMinutos(duracaoMinutos);
    this.vincularProfissional(profissionalId);
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
