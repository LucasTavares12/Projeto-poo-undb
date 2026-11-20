import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { LucroService } from "../services/LucroService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

/**
 * Lucro e gasto do mês. Sem `profissionalId`, os números da clínica inteira; com ele, os
 * daquele profissional. Conta ligada a um profissional recebe sempre os dela.
 */
export class LucroController extends Controlador {
  private readonly servico = new LucroService();

  /** Lucro do mês (?mes=AAAA-MM&profissionalId=N): faturamento, gasto, lucro e margem. */
  public async mensal(req: Request, res: Response): Promise<void> {
    try {
      res.json(
        await this.servico.calcular(
          String(req.query.mes ?? ""),
          this.lerProfissional(req.query.profissionalId),
          SessaoDaRequisicao.profissionalId(res)
        )
      );
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** Informa o gasto do mês (corpo: { valor, profissionalId? }) e devolve o lucro recalculado. */
  public async informarGasto(req: Request, res: Response): Promise<void> {
    try {
      res.json(
        await this.servico.informarGasto(
          String(req.params.mes),
          req.body?.valor,
          this.lerProfissional(req.body?.profissionalId),
          SessaoDaRequisicao.profissionalId(res)
        )
      );
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** Apaga o gasto do mês (?profissionalId=N) e devolve o lucro, que volta a ficar pendente. */
  public async apagarGasto(req: Request, res: Response): Promise<void> {
    try {
      res.json(
        await this.servico.apagarGasto(
          String(req.params.mes),
          this.lerProfissional(req.query.profissionalId),
          SessaoDaRequisicao.profissionalId(res)
        )
      );
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  private lerProfissional(valor: unknown): number | null {
    return this.lerIdOpcional(valor, "Profissional inválido.");
  }
}
