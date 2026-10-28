import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { TratamentoService } from "../services/TratamentoService";
import type { DadosTratamento } from "../services/TratamentoService";

export class TratamentoController extends Controlador {
  private readonly servico = new TratamentoService();

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
      res.json(await this.servico.atualizar(Number(req.params.id), this.lerDados(req)));
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

  private lerDados(req: Request): DadosTratamento {
    const { nome, descricao, valor, duracaoMinutos, profissionalId } = req.body ?? {};
    return {
      nome,
      descricao,
      valor: Number(valor),
      duracaoMinutos: Number(duracaoMinutos),
      // Vazio/null = tratamento de todos os profissionais.
      profissionalId:
        profissionalId === undefined || profissionalId === null || profissionalId === ""
          ? null
          : Number(profissionalId),
    };
  }
}
