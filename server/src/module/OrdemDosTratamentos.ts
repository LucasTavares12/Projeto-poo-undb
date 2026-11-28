import { Tratamento } from "./Tratamento";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/**
 * Nova ordem dos tratamentos de um grupo (os de um profissional, ou os de todos os
 * profissionais), definida arrastando as linhas na aba "Tratamentos". É a ordem em que o
 * cliente vê os serviços ao agendar.
 *
 * Só aceita uma lista com exatamente os tratamentos do grupo, cada um uma vez: assim uma
 * tela desatualizada (alguém criou ou apagou um tratamento no meio-tempo) não bagunça a ordem.
 */
export class OrdemDosTratamentos {
  private readonly ids: number[];

  constructor(ids: unknown) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ErroDeValidacao("Informe a nova ordem dos tratamentos.");
    }
    if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
      throw new ErroDeValidacao("Tratamento inválido na nova ordem.");
    }
    if (new Set(ids).size !== ids.length) {
      throw new ErroDeValidacao("Um tratamento aparece mais de uma vez na nova ordem.");
    }
    this.ids = ids as number[];
  }

  /**
   * Aplica a ordem aos tratamentos do grupo (posição 0, 1, 2...) e devolve-os nessa ordem.
   * Lança erro se a lista não tiver exatamente os tratamentos do grupo.
   */
  public aplicar(tratamentosDoGrupo: Tratamento[]): Tratamento[] {
    const porId = new Map(tratamentosDoGrupo.map((tratamento) => [tratamento.getId(), tratamento]));
    if (porId.size !== this.ids.length || this.ids.some((id) => !porId.has(id))) {
      throw new ErroDeValidacao(
        "A lista de tratamentos mudou enquanto você organizava. Recarregue a página e tente de novo."
      );
    }
    return this.ids.map((id, posicao) => {
      const tratamento = porId.get(id)!;
      tratamento.definirOrdem(posicao);
      return tratamento;
    });
  }
}
