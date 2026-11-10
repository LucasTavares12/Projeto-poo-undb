import { Response } from "express";

/**
 * Quem fez a requisição no painel, como o AutenticacaoMiddleware deixou em `res.locals`.
 * Os controllers usam esta classe para aplicar a regra de visibilidade:
 * usuário ligado a um profissional só vê e altera o que é daquele profissional.
 */
export class SessaoDaRequisicao {
  public static adminId(res: Response): number {
    return Number(res.locals.adminId);
  }

  /**
   * true se a requisição veio do painel, com login válido. Nas rotas públicas (usadas
   * pela página do cliente e também pelo painel), só fica true depois de `identificar`.
   */
  public static ehDaEquipe(res: Response): boolean {
    return typeof res.locals.adminId === "number";
  }

  /** Conta do painel que fez a ação; null = cliente pela página pública. */
  public static autor(res: Response): number | null {
    return SessaoDaRequisicao.ehDaEquipe(res) ? SessaoDaRequisicao.adminId(res) : null;
  }

  /** Profissional do usuário logado; null = acesso total (vê tudo da clínica). */
  public static profissionalId(res: Response): number | null {
    const valor = res.locals.profissionalId;
    return typeof valor === "number" ? valor : null;
  }
}
