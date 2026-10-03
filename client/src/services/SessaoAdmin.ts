/**
 * Guarda o token de login do administrador no navegador. É a única classe
 * que conhece onde o token fica salvo; o restante do sistema só pergunta
 * se a sessão está ativa ou pede o token para enviar à API.
 */
export class SessaoAdmin {
  private static readonly CHAVE = "token-admin";

  public static salvar(token: string): void {
    localStorage.setItem(SessaoAdmin.CHAVE, token);
  }

  public static getToken(): string | null {
    return localStorage.getItem(SessaoAdmin.CHAVE);
  }

  public static encerrar(): void {
    localStorage.removeItem(SessaoAdmin.CHAVE);
  }

  /** Confere só a validade (a assinatura quem confere é o servidor). */
  public static estaAtiva(): boolean {
    const token = SessaoAdmin.getToken();
    if (!token) {
      return false;
    }

    try {
      const conteudoCodificado = token.split(".")[0];
      const base64 = conteudoCodificado.replace(/-/g, "+").replace(/_/g, "/");
      const conteudo = JSON.parse(atob(base64)) as { expiraEm?: number };
      if (typeof conteudo.expiraEm === "number" && conteudo.expiraEm > Date.now()) {
        return true;
      }
    } catch {
      // Token malformado: trata como sessão encerrada.
    }

    SessaoAdmin.encerrar();
    return false;
  }
}
