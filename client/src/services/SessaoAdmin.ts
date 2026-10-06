interface ConteudoToken {
  email?: string;
  expiraEm?: number;
}

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
    const expiraEm = SessaoAdmin.lerConteudo()?.expiraEm;
    if (typeof expiraEm === "number" && expiraEm > Date.now()) {
      return true;
    }

    SessaoAdmin.encerrar();
    return false;
  }

  /** E-mail de quem está logado, para exibir no painel. */
  public static getEmail(): string {
    return SessaoAdmin.lerConteudo()?.email ?? "";
  }

  private static lerConteudo(): ConteudoToken | null {
    const token = SessaoAdmin.getToken();
    if (!token) {
      return null;
    }

    try {
      const base64 = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64)) as ConteudoToken;
    } catch {
      return null; // token malformado
    }
  }
}
