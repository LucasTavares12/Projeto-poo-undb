import { Request, Response } from "express";

/**
 * Controller simples só para confirmar que a API está de pé.
 * Cada controller novo (Profissional, Tratamento, Agendamento...) vai
 * seguir este mesmo formato: uma classe com um método por rota.
 */
export class HealthController {
  public check(req: Request, res: Response): void {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  }
}
