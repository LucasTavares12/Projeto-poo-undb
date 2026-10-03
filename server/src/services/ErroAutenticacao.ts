/**
 * Erro esperado do fluxo de login/cadastro (senha errada, e-mail repetido...).
 * Carrega o status HTTP certo, para o controller diferenciar de uma falha
 * inesperada do servidor (ex: banco fora do ar).
 */
export class ErroAutenticacao extends Error {
  public readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = "ErroAutenticacao";
    this.status = status;
  }
}
