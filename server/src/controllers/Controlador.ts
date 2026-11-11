import { Response } from "express";
import { ErroDaAplicacao } from "../erros/ErroDaAplicacao";

/**
 * Base de todos os controllers: o jeito de responder um erro fica num lugar só.
 * Erro esperado da aplicação (validação, não encontrado, sem acesso, conflito...) usa o
 * status dele e a mensagem vai para a tela. Qualquer outro erro é falha inesperada
 * (ex: banco fora do ar): fica no log e a tela recebe só uma mensagem genérica.
 */
export abstract class Controlador {
  protected responderErro(res: Response, erro: unknown): void {
    if (erro instanceof ErroDaAplicacao) {
      res.status(erro.status).json({ erro: erro.message });
      return;
    }
    console.error(erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
}
