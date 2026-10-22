import type { Tratamento } from "../services/types";

/** Tratamentos escolhidos para um agendamento, com os totais que aparecem na tela. */
export class SelecaoDeTratamentos {
  private readonly tratamentos: Tratamento[];

  constructor(tratamentos: Tratamento[]) {
    this.tratamentos = tratamentos;
  }

  public getQuantidade(): number {
    return this.tratamentos.length;
  }

  public getValorTotal(): number {
    return this.tratamentos.reduce((total, tratamento) => total + tratamento.valor, 0);
  }

  public getDuracaoTotalMinutos(): number {
    return this.tratamentos.reduce((total, tratamento) => total + tratamento.duracaoMinutos, 0);
  }

  public getNomes(): string[] {
    return this.tratamentos.map((tratamento) => tratamento.nome);
  }
}
