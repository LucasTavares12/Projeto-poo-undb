/**
 * Regras da senha das contas do painel. Mesma regra do servidor
 * (Administrador.TAMANHO_MINIMO_SENHA); aqui só para avisar antes de enviar.
 */
export class Senha {
  public static readonly TAMANHO_MINIMO = 6;

  /** Confere a senha nova e a confirmação; devolve a mensagem de erro, ou null se estiver certo. */
  public static validarNova(senha: string, confirmacao: string): string | null {
    if (senha.length < Senha.TAMANHO_MINIMO) {
      return `A senha precisa ter pelo menos ${Senha.TAMANHO_MINIMO} caracteres.`;
    }
    if (senha !== confirmacao) {
      return "As senhas não são iguais.";
    }
    return null;
  }
}
