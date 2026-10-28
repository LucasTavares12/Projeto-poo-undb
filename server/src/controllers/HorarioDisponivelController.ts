import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { HorarioDisponivelService } from "../services/HorarioDisponivelService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

export class HorarioDisponivelController extends Controlador {
  private readonly servico = new HorarioDisponivelService();

  public async listarPorProfissional(req: Request, res: Response): Promise<void> {
    try {
      const horarios = await this.servico.listarDoProfissional(
        Number(req.params.profissionalId),
        SessaoDaRequisicao.profissionalId(res)
      );
      res.json(horarios);
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** Libera um horário da grade semanal ({ profissionalId, diaSemana, horaInicio }). */
  public async criar(req: Request, res: Response): Promise<void> {
    try {
      const { profissionalId, diaSemana, horaInicio } = req.body ?? {};
      const horario = await this.servico.liberar(
        Number(profissionalId),
        Number(diaSemana),
        String(horaInicio ?? ""),
        SessaoDaRequisicao.profissionalId(res)
      );
      res.status(201).json(horario);
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** Bloqueia de novo um horário da grade. */
  public async deletar(req: Request, res: Response): Promise<void> {
    try {
      await this.servico.bloquear(Number(req.params.id), SessaoDaRequisicao.profissionalId(res));
      res.status(204).send();
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }
}
