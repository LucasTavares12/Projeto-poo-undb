import { Horario } from "./Horario";
import { FormaDePagamento } from "./FormaDePagamento";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

export class Tratamento {
  public static readonly TAMANHO_MAXIMO_NOME = 150;
  /** Foto em base64 (data URL), já reduzida no navegador do painel. */
  private static readonly FORMATO_FOTO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
  /** ~1,5 MB de texto: bem acima de uma foto reduzida, bem abaixo do limite da coluna. */
  public static readonly TAMANHO_MAXIMO_FOTO = 1_500_000;

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
  /**
   * Posição do tratamento na lista do seu grupo (os do profissional, ou os de todos), a partir
   * de 0. É a ordem em que o cliente vê os serviços ao agendar.
   */
  private ordem = 0;
  /**
   * Foto que demonstra o tratamento para o cliente (data URL). null = sem foto: o cliente vê
   * o tratamento só com nome, descrição, valor e duração, como antes.
   */
  private foto: string | null = null;
  /**
   * Valor cobrado quando o cliente paga com cartão de crédito (ex.: para cobrir a taxa da
   * maquininha). null = no crédito vale o mesmo valor das outras formas de pagamento.
   */
  private valorCartaoCredito: number | null = null;

  constructor(
    nome: string,
    descricao: string,
    valor: number,
    duracaoMinutos: number,
    id?: number,
    profissionalId: number | null = null,
    ordem = 0
  ) {
    if (!Number.isFinite(valor) || valor < 0) {
      throw new ErroDeValidacao("Informe um valor válido para o tratamento (zero ou mais).");
    }
    if (duracaoMinutos <= 0 || duracaoMinutos % Horario.DURACAO_SLOT_MINUTOS !== 0) {
      throw new ErroDeValidacao(
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
    this.definirOrdem(ordem);
  }

  public getOrdem(): number {
    return this.ordem;
  }

  public definirOrdem(ordem: number): void {
    if (!Number.isInteger(ordem) || ordem < 0) {
      throw new ErroDeValidacao("Posição do tratamento inválida.");
    }
    this.ordem = ordem;
  }

  /** true se os dois tratamentos ficam na mesma lista (mesmo profissional, ou ambos de todos). */
  public ehDoMesmoGrupoQue(profissionalId: number | null): boolean {
    return this.profissionalId === profissionalId;
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
      throw new ErroDeValidacao("Informe o nome do tratamento.");
    }
    if (texto.length > Tratamento.TAMANHO_MAXIMO_NOME) {
      throw new ErroDeValidacao(
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
      throw new ErroDeValidacao("Informe um valor válido para o tratamento (zero ou mais).");
    }
    this.valor = valor;
  }

  public setDuracaoMinutos(duracaoMinutos: number): void {
    if (duracaoMinutos <= 0 || duracaoMinutos % Horario.DURACAO_SLOT_MINUTOS !== 0) {
      throw new ErroDeValidacao(
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

  public getValorCartaoCredito(): number | null {
    return this.valorCartaoCredito;
  }

  /** Define o valor no cartão de crédito; null tira (o crédito passa a cobrar o valor normal). */
  public setValorCartaoCredito(valor: number | null | undefined): void {
    if (valor === null || valor === undefined) {
      this.valorCartaoCredito = null;
      return;
    }
    if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
      throw new ErroDeValidacao(
        "Informe um valor válido para o cartão de crédito (zero ou mais), ou deixe em branco."
      );
    }
    this.valorCartaoCredito = valor;
  }

  /**
   * Quanto o tratamento custa nesta forma de pagamento: no cartão de crédito, o valor do
   * crédito (se a clínica cadastrou um); nas outras formas, ou sem forma escolhida, o valor normal.
   */
  public getValorPara(forma: FormaDePagamento | null): number {
    if (forma === FormaDePagamento.CARTAO_CREDITO && this.valorCartaoCredito !== null) {
      return this.valorCartaoCredito;
    }
    return this.valor;
  }

  public getFoto(): string | null {
    return this.foto;
  }

  /** Coloca ou troca a foto do tratamento; null (ou "") tira a foto. */
  public setFoto(foto: string | null | undefined): void {
    if (foto === null || foto === undefined || foto === "") {
      this.foto = null;
      return;
    }
    if (typeof foto !== "string" || !Tratamento.FORMATO_FOTO.test(foto)) {
      throw new ErroDeValidacao("A foto do tratamento precisa ser uma imagem PNG, JPG ou WebP.");
    }
    if (foto.length > Tratamento.TAMANHO_MAXIMO_FOTO) {
      throw new ErroDeValidacao("A foto do tratamento é grande demais. Use uma imagem menor.");
    }
    this.foto = foto;
  }

  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  /** Liga o tratamento a um profissional (ou, com null, libera para todos). */
  public vincularProfissional(profissionalId: number | null): void {
    if (profissionalId !== null && (!Number.isInteger(profissionalId) || profissionalId <= 0)) {
      throw new ErroDeValidacao("Profissional inválido.");
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
      ordem: this.ordem,
      valorCartaoCredito: this.valorCartaoCredito,
      foto: this.foto,
      quantidadeSlots: this.getQuantidadeSlots(),
    };
  }
}
