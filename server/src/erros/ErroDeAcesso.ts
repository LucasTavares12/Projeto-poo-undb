import { ErroDaAplicacao } from "./ErroDaAplicacao";

/** O usuário está logado, mas a conta dele não pode fazer isso (ex: mexer em outro profissional). */
export class ErroDeAcesso extends ErroDaAplicacao {
  public readonly status = 403;
}
