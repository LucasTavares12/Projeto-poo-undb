import { Request, Response } from "express";
import { AgendaService } from "../services/AgendaService";
import { ErroNaoEncontrado } from "../services/ErroNaoEncontrado";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";
import { AgendaSemanal } from "../module/AgendaSemanal";
import { DataAgenda } from "../module/DataAgenda";

export class AgendaController {
  private readonly servico = new AgendaService();

  /** Agenda de um profissional (?profissionalId=&inicio=YYYY-MM-DD&dias=7). */
  public async semana(req: Request, res: Response): Promise<void> {
    try {
      const profissionalId = Number(req.query.profissionalId);
      if (!SessaoDaRequisicao.podeAcessarProfissional(res, profissionalId)) {
        res.status(403).json({ erro: "Você só pode ver a agenda do seu profissional." });
        return;
      }
      const agenda = await this.servico.montar(
        profissionalId,
        DataAgenda.ler(req.query.inicio, "Informe a data de início da agenda."),
        req.query.dias ? Number(req.query.dias) : AgendaSemanal.DIAS_PADRAO
      );
      res.json(agenda);
    } catch (erro) {
      res
        .status(erro instanceof ErroNaoEncontrado ? 404 : 400)
        .json({ erro: (erro as Error).message });
    }
  }
}
