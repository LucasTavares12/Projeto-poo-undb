import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { RelatorioService } from "../services/RelatorioService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

export class RelatorioController extends Controlador {
  private readonly servico = new RelatorioService();

  /**
   * Aba "Relatórios": faturamento e tratamentos de um mês (?mes=AAAA-MM).
   * Com ?profissionalId=N, só os atendimentos daquele profissional.
   */
  public async mensal(req: Request, res: Response): Promise<void> {
    try {
      const relatorio = await this.servico.gerarMensal(
        String(req.query.mes ?? ""),
        this.lerIdOpcional(req.query.profissionalId, "Profissional inválido."),
        SessaoDaRequisicao.profissionalId(res)
      );
      res.json(relatorio);
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }
}
