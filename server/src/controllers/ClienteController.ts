import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { ClienteService } from "../services/ClienteService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";
import { RelogioClinica } from "../module/RelogioClinica";

export class ClienteController extends Controlador {
  private readonly servico = new ClienteService();

  /** Lista de clientes (?busca= nome ou telefone). */
  public async listar(req: Request, res: Response): Promise<void> {
    const historicos = await this.servico.listar(
      String(req.query.busca ?? ""),
      SessaoDaRequisicao.profissionalId(res)
    );
    const hoje = RelogioClinica.hoje();
    res.json(historicos.map((historico) => historico.paraResumo(hoje)));
  }

  /** Ficha do cliente com todo o histórico (o telefone, só números, identifica o cliente). */
  public async ficha(req: Request, res: Response): Promise<void> {
    try {
      const historico = await this.servico.buscar(
        String(req.params.telefone),
        SessaoDaRequisicao.profissionalId(res)
      );
      res.json(historico.paraFicha(RelogioClinica.hoje()));
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }
}
