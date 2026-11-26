import type { Profissional, Tratamento } from "../services/types";

/** Uma tabela da aba "Tratamentos": os de um profissional ou os de todos. */
export interface GrupoDeTratamentos {
  /** Identifica o grupo na tela ("p-3" ou "todos"). */
  chave: string;
  /** null = tratamentos que todos os profissionais realizam. */
  profissionalId: number | null;
  titulo: string;
  subtitulo: string;
  tratamentos: Tratamento[];
}

/**
 * Separa os tratamentos em uma lista por profissional (mais a dos que todos realizam) e
 * cuida da ordem de cada lista: é a ordem em que o cliente vê os serviços ao agendar.
 */
export class GruposDeTratamentos {
  private static readonly CHAVE_TODOS = "todos";

  public static chaveDe(profissionalId: number | null): string {
    return profissionalId === null ? GruposDeTratamentos.CHAVE_TODOS : `p-${profissionalId}`;
  }

  /**
   * Um grupo por profissional (na ordem do cadastro de profissionais, mesmo sem tratamentos)
   * e, se houver, o grupo dos de todos os profissionais no fim. Cada grupo vem ordenado.
   */
  public static agrupar(tratamentos: Tratamento[], profissionais: Profissional[]): GrupoDeTratamentos[] {
    const ordenar = (lista: Tratamento[]) =>
      [...lista].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));

    const grupos: GrupoDeTratamentos[] = profissionais.map((profissional) => ({
      chave: GruposDeTratamentos.chaveDe(profissional.id),
      profissionalId: profissional.id,
      titulo: profissional.nome,
      subtitulo: profissional.especialidade,
      tratamentos: ordenar(tratamentos.filter((t) => t.profissionalId === profissional.id)),
    }));

    const deTodos = tratamentos.filter((tratamento) => tratamento.profissionalId === null);
    if (deTodos.length > 0) {
      grupos.push({
        chave: GruposDeTratamentos.CHAVE_TODOS,
        profissionalId: null,
        titulo: "Todos os profissionais",
        subtitulo: "Aparecem para qualquer profissional, depois dos tratamentos dele.",
        tratamentos: ordenar(deTodos),
      });
    }
    return grupos;
  }

  /**
   * A lista com o tratamento `id` levado para a posição de `alvoId` (o que estava lá e os
   * seguintes descem/sobem uma posição). Não muda nada se algum dos dois não estiver na lista.
   */
  public static mover(lista: Tratamento[], id: number, alvoId: number): Tratamento[] {
    const de = lista.findIndex((tratamento) => tratamento.id === id);
    const para = lista.findIndex((tratamento) => tratamento.id === alvoId);
    if (de === -1 || para === -1 || de === para) {
      return lista;
    }
    const nova = [...lista];
    const [movido] = nova.splice(de, 1);
    nova.splice(para, 0, movido);
    return nova;
  }

  /** Sobe (-1) ou desce (+1) o tratamento uma posição (botões, para quem não arrasta). */
  public static deslocar(lista: Tratamento[], id: number, direcao: -1 | 1): Tratamento[] {
    const indice = lista.findIndex((tratamento) => tratamento.id === id);
    const vizinho = lista[indice + direcao];
    return indice === -1 || !vizinho ? lista : GruposDeTratamentos.mover(lista, id, vizinho.id);
  }

  /** A mesma lista com `ordem` = posição (0, 1, 2...), como o servidor vai gravar. */
  public static numerar(lista: Tratamento[]): Tratamento[] {
    return lista.map((tratamento, posicao) => ({ ...tratamento, ordem: posicao }));
  }

  /** true se as duas listas têm os mesmos tratamentos na mesma ordem. */
  public static mesmaOrdem(a: Tratamento[], b: Tratamento[]): boolean {
    return a.length === b.length && a.every((tratamento, i) => tratamento.id === b[i].id);
  }
}
