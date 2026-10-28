import { ErroDaAplicacao } from "./ErroDaAplicacao";

/** O que foi pedido não existe (ou o usuário não pode vê-lo, o que dá no mesmo para ele). */
export class ErroNaoEncontrado extends ErroDaAplicacao {
  public readonly status = 404;
}
