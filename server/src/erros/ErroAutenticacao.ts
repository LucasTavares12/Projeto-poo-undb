import { ErroDaAplicacao } from "./ErroDaAplicacao";

/**
 * Erro esperado do fluxo de login/cadastro (senha errada, cadastro desativado...).
 * Cada caso tem um status diferente (401, 403, 400), por isso ele vem no construtor.
 */
export class ErroAutenticacao extends ErroDaAplicacao {
  public readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}
