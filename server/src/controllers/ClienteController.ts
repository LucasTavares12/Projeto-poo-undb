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

  /**
   * Ficha do cliente com todo o histórico. Telefone (só números) + `?nome=` identificam a
   * pessoa: um mesmo telefone pode ter várias (ex.: a mãe e a filha que ela agendou).
   */
  public async ficha(req: Request, res: Response): Promise<void> {
    try {
      const doTelefone = await this.servico.buscarDoTelefone(
        String(req.params.telefone),
        SessaoDaRequisicao.profissionalId(res)
      );
      const historico = doTelefone.pessoa(String(req.query.nome ?? ""));
      res.json(
        historico.paraFicha(RelogioClinica.hoje(), doTelefone.outrasPessoasAlemDe(historico))
      );
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }
}
