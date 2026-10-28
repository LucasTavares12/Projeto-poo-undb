import { Response } from "express";
import { ErroDaAplicacao } from "../erros/ErroDaAplicacao";

/**
 * Base de todos os controllers: o jeito de responder um erro fica num lugar só.
 * Erro esperado da aplicação (não encontrado, sem acesso, conflito...) usa o status dele;
 * erro de validação dos modelos (ex: "Telefone inválido") vira `statusPadrao` (400).
 */
export abstract class Controlador {
  protected responderErro(res: Response, erro: unknown, statusPadrao = 400): void {
    const status = erro instanceof ErroDaAplicacao ? erro.status : statusPadrao;
    res.status(status).json({ erro: (erro as Error).message });
  }
}
