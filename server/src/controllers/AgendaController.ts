import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { AgendaService } from "../services/AgendaService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";
import { AgendaSemanal } from "../module/AgendaSemanal";
import { DataAgenda } from "../module/DataAgenda";

export class AgendaController extends Controlador {
  private readonly servico = new AgendaService();

  /** Agenda de um profissional (?profissionalId=&inicio=YYYY-MM-DD&dias=7). */
  public async semana(req: Request, res: Response): Promise<void> {
    try {
      const agenda = await this.servico.montar(
        Number(req.query.profissionalId),
        DataAgenda.ler(req.query.inicio, "Informe a data de início da agenda."),
        req.query.dias ? Number(req.query.dias) : AgendaSemanal.DIAS_PADRAO,
        SessaoDaRequisicao.profissionalId(res)
      );
      res.json(agenda);
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }
}
