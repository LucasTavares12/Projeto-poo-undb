import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { ProfissionalService } from "../services/ProfissionalService";
import type { DadosProfissional } from "../services/ProfissionalService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

export class ProfissionalController extends Controlador {
  private readonly servico = new ProfissionalService();

  public async listar(req: Request, res: Response): Promise<void> {
    res.json(await this.servico.listar());
  }

  public async criar(req: Request, res: Response): Promise<void> {
    try {
      res.status(201).json(await this.servico.criar(this.lerDados(req)));
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  public async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const profissional = await this.servico.atualizar(
        Number(req.params.id),
        this.lerDados(req),
        SessaoDaRequisicao.profissionalId(res)
      );
      res.json(profissional);
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  public async deletar(req: Request, res: Response): Promise<void> {
    try {
      await this.servico.remover(Number(req.params.id));
      res.status(204).send();
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  private lerDados(req: Request): DadosProfissional {
    const { nome, telefone, especialidade } = req.body ?? {};
    return { nome, telefone, especialidade };
  }
}
