import { Request, Response, NextFunction } from "express";
import { ErroDaAplicacao } from "../erros/ErroDaAplicacao";

/**
 * Middleware de último recurso: captura qualquer erro não tratado por um
 * controller e responde em JSON, em vez de deixar o Express devolver uma
 * página HTML com stack trace ao cliente.
 *  - Erro da aplicação (validação, não encontrado...): usa o status e a mensagem dele.
 *  - Erro da própria requisição (ex: corpo com JSON malformado): 4xx com mensagem clara.
 *  - Qualquer outro (ex: banco fora do ar): 500, e o detalhe fica só no log.
 */
export class ErrorHandlerMiddleware {
  private static readonly MENSAGENS_DA_REQUISICAO: Record<string, string> = {
    "entity.parse.failed": "O corpo da requisição não é um JSON válido.",
    "entity.too.large": "O corpo da requisição é grande demais.",
  };

  public tratar(erro: Error, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
      next(erro);
      return;
    }

    if (erro instanceof ErroDaAplicacao) {
      res.status(erro.status).json({ erro: erro.message });
      return;
    }

    const status = ErrorHandlerMiddleware.statusDaRequisicao(erro);
    if (status !== null) {
      const tipo = String((erro as { type?: unknown }).type ?? "");
      res.status(status).json({
        erro: ErrorHandlerMiddleware.MENSAGENS_DA_REQUISICAO[tipo] ?? "Requisição inválida.",
      });
      return;
    }

    console.error(erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }

  /** Status 4xx que o próprio Express/body-parser anexa ao erro (ex: 400 para JSON quebrado). */
  private static statusDaRequisicao(erro: Error): number | null {
    const status = Number((erro as { status?: unknown; statusCode?: unknown }).status ??
      (erro as { statusCode?: unknown }).statusCode);
    return Number.isInteger(status) && status >= 400 && status < 500 ? status : null;
  }
}
