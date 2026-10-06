import { Request, Response } from "express";
import { RelatorioService } from "../services/RelatorioService";

export class RelatorioController {
  private readonly servico = new RelatorioService();

  /**
   * Aba "Relatórios": faturamento e tratamentos de um mês (?mes=AAAA-MM).
   * Com ?profissionalId=N, só os atendimentos daquele profissional.
   */
  public async mensal(req: Request, res: Response): Promise<void> {
    try {
      const filtro = req.query.profissionalId;
      const profissionalId = filtro === undefined || filtro === "" ? null : Number(filtro);
      const relatorio = await this.servico.gerarMensal(String(req.query.mes ?? ""), profissionalId);
      res.json(relatorio);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
}
