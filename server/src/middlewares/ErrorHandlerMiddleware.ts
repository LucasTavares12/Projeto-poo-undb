import { Request, Response, NextFunction } from "express";

/**
 * Middleware de último recurso: captura qualquer erro não tratado por um
 * controller (ex: falha de conexão com o banco) e responde em JSON, em vez
 * de deixar o Express devolver uma página HTML com stack trace ao cliente.
 */
export class ErrorHandlerMiddleware {
  public tratar(erro: Error, req: Request, res: Response, next: NextFunction): void {
    console.error(erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
}
