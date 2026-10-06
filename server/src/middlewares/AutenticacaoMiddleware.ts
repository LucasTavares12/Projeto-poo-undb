import { Request, Response, NextFunction } from "express";
import { AutenticacaoService } from "../services/AutenticacaoService";
import { SessaoDaRequisicao } from "./SessaoDaRequisicao";

/**
 * Protege as rotas do painel admin: só deixa a requisição seguir se vier
 * com um token válido no cabeçalho "Authorization: Bearer <token>" de uma
 * conta que ainda existe. Deixa em `res.locals` quem está logado (adminId) e,
 * se a conta for de um profissional, qual (profissionalId).
 */
export class AutenticacaoMiddleware {
  constructor(private readonly servico: AutenticacaoService) {}

  public async verificar(req: Request, res: Response, next: NextFunction): Promise<void> {
    const cabecalho = req.headers.authorization ?? "";
    const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice("Bearer ".length) : "";

    try {
      const usuario = token ? await this.servico.usuarioDaSessao(token) : null;
      if (!usuario) {
        res.status(401).json({ erro: "Faça login como administrador para continuar." });
        return;
      }

      res.locals.adminId = usuario.getId();
      res.locals.profissionalId = usuario.getProfissionalId();
      next();
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * Depois de `verificar`: só deixa passar quem tem acesso total (conta sem profissional).
   * Usado no que é da clínica inteira: usuários, configurações, tratamentos, cadastro de profissionais.
   */
  public exigirAcessoTotal(req: Request, res: Response, next: NextFunction): void {
    if (SessaoDaRequisicao.profissionalId(res) !== null) {
      res.status(403).json({ erro: "Esta área é só para usuários com acesso total." });
      return;
    }
    next();
  }
}
