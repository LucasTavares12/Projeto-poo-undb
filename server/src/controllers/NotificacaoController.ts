import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { NotificacaoService } from "../services/NotificacaoService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

export class NotificacaoController extends Controlador {
  private readonly servico = new NotificacaoService();

  /** Sino do painel (?limite=20). */
  public async listar(req: Request, res: Response): Promise<void> {
    try {
      const resultado = await this.servico.listar(
        SessaoDaRequisicao.adminId(res),
        SessaoDaRequisicao.profissionalId(res),
        this.lerInteiro(req.query.limite, NotificacaoService.LIMITE_PADRAO, "Limite inválido.")
      );
      res.json(resultado);
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** Fechou o modal ou o sino ({ ids: avisos que estavam na tela }). */
  public async marcarLidas(req: Request, res: Response): Promise<void> {
    try {
      await this.servico.fechar(SessaoDaRequisicao.adminId(res), req.body?.ids);
      res.status(204).send();
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }
}
