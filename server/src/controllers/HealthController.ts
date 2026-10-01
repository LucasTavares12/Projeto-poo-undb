import { Request, Response } from "express";
import { Database } from "../database/Database";

/**
 * Controller simples só para confirmar que a API (e o banco) estão de pé.
 * Cada controller novo (Profissional, Tratamento, Agendamento...) vai
 * seguir este mesmo formato: uma classe com um método por rota.
 */
export class HealthController {
  public check(req: Request, res: Response): void {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  }

  public async checkDatabase(req: Request, res: Response): Promise<void> {
    try {
      await Database.getInstancia().testarConexao();
      res.json({ status: "ok", database: "conectado" });
    } catch (erro) {
      res.status(500).json({
        status: "erro",
        database: "falha na conexão",
        detalhe: (erro as Error).message,
      });
    }
  }
}
