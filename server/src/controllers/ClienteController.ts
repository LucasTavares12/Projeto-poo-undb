import { Request, Response } from "express";
import { ClienteService } from "../services/ClienteService";
import { ErroNaoEncontrado } from "../services/ErroNaoEncontrado";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";
import { RelogioClinica } from "../module/RelogioClinica";

export class ClienteController {
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
      this.responderErro(res, erro as Error);
    }
  }

  private responderErro(res: Response, erro: Error): void {
    res.status(erro instanceof ErroNaoEncontrado ? 404 : 400).json({ erro: erro.message });
  }
}
