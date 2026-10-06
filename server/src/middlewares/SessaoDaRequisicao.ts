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

  /** Profissional do usuário logado; null = acesso total (vê tudo da clínica). */
  public static profissionalId(res: Response): number | null {
    const valor = res.locals.profissionalId;
    return typeof valor === "number" ? valor : null;
  }

  /** true se o usuário logado pode ver/alterar dados deste profissional. */
  public static podeAcessarProfissional(res: Response, profissionalId: number): boolean {
    const proprio = SessaoDaRequisicao.profissionalId(res);
    return proprio === null || proprio === profissionalId;
  }
}
