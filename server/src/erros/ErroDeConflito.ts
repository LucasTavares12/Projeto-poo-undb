import { ErroDaAplicacao } from "./ErroDaAplicacao";

/** A ação esbarra em dados que já existem (ex: e-mail repetido, excluir algo que está em uso). */
export class ErroDeConflito extends ErroDaAplicacao {
  public readonly status = 409;
}
