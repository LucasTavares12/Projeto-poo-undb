import { ErroDaAplicacao } from "./ErroDaAplicacao";

/** Dado que não segue as regras do sistema (ex: telefone inválido, horário já ocupado). */
export class ErroDeValidacao extends ErroDaAplicacao {
  public readonly status = 400;
}
