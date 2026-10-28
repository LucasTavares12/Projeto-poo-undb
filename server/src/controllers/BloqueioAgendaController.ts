import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { BloqueioAgendaService } from "../services/BloqueioAgendaService";
import type { DadosNovoBloqueio } from "../services/BloqueioAgendaService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";
import { DataAgenda } from "../module/DataAgenda";

export class BloqueioAgendaController extends Controlador {
  private readonly servico = new BloqueioAgendaService();

  /** Painel: folgas e feriados (?incluirPassados=true traz também os que já terminaram). */
  public async listar(req: Request, res: Response): Promise<void> {
    const bloqueios = await this.servico.listar(
      SessaoDaRequisicao.profissionalId(res),
      req.query.incluirPassados === "true"
    );
    res.json(bloqueios);
  }

  /** Página do cliente: dias fechados na agenda do profissional (sem o motivo). */
  public async listarPublico(req: Request, res: Response): Promise<void> {
    try {
      const bloqueios = await this.servico.listarDoProfissional(Number(req.query.profissionalId));
      res.json(bloqueios.map((bloqueio) => bloqueio.paraPublico()));
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  public async criar(req: Request, res: Response): Promise<void> {
    try {
      const { bloqueio, agendamentosAfetados } = await this.servico.criar(
        this.lerDadosNovoBloqueio(req),
        SessaoDaRequisicao.profissionalId(res)
      );
      res.status(201).json({ bloqueio, agendamentosAfetados });
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  public async deletar(req: Request, res: Response): Promise<void> {
    try {
      await this.servico.remover(Number(req.params.id), SessaoDaRequisicao.profissionalId(res));
      res.status(204).send();
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  private lerDadosNovoBloqueio(req: Request): DadosNovoBloqueio {
    const { profissionalId, dataInicio, dataFim, motivo } = req.body ?? {};

    const inicio = DataAgenda.ler(dataInicio, "Informe a data de início do bloqueio.");
    // Sem data final: bloqueio de um dia só.
    const fim = dataFim ? DataAgenda.ler(dataFim, "Data final inválida.") : inicio;

    return {
      profissionalId:
        profissionalId === null || profissionalId === undefined || profissionalId === ""
          ? null
          : Number(profissionalId),
      dataInicio: inicio,
      dataFim: fim,
      motivo: String(motivo ?? ""),
    };
  }
}
