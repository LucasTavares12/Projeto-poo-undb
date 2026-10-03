import { Request, Response, NextFunction } from "express";
import { AutenticacaoService } from "../services/AutenticacaoService";

/**
 * Protege as rotas do painel admin: só deixa a requisição seguir se vier
 * com um token válido no cabeçalho "Authorization: Bearer <token>".
 */
export class AutenticacaoMiddleware {
  constructor(private readonly servico: AutenticacaoService) {}

  public verificar(req: Request, res: Response, next: NextFunction): void {
    const cabecalho = req.headers.authorization ?? "";
    const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice("Bearer ".length) : "";

    if (!token || !this.servico.tokenEhValido(token)) {
      res.status(401).json({ erro: "Faça login como administrador para continuar." });
      return;
    }

    next();
  }
}
