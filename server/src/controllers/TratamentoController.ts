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
      res.json(await this.servico.atualizar(this.lerId(req.params.id), this.lerDados(req)));
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** Aba "Tratamentos": nova ordem de um grupo ({ profissionalId: número | null, ids: [...] }). */
  public async reordenar(req: Request, res: Response): Promise<void> {
    try {
      const { profissionalId, ids } = req.body ?? {};
      res.json(
        await this.servico.reordenar(
          this.lerIdOpcional(profissionalId, "Profissional inválido."),
          ids
        )
      );
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  public async deletar(req: Request, res: Response): Promise<void> {
    try {
      await this.servico.remover(this.lerId(req.params.id));
      res.status(204).send();
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  private lerDados(req: Request): DadosTratamento {
    const { nome, descricao, valor, valorCartaoCredito, duracaoMinutos, profissionalId, foto } =
      req.body ?? {};
    return {
      nome,
      descricao,
      valor: Number(valor),
      // Vazio/null = no cartão de crédito vale o mesmo valor.
      valorCartaoCredito:
        valorCartaoCredito === undefined || valorCartaoCredito === null || valorCartaoCredito === ""
          ? null
          : Number(valorCartaoCredito),
      duracaoMinutos: Number(duracaoMinutos),
      // Vazio/null = tratamento de todos os profissionais.
      profissionalId: this.lerIdOpcional(profissionalId, "Profissional inválido."),
      // Sem foto (ou vazia) = o tratamento aparece para o cliente sem imagem.
      foto: foto ?? null,
    };
  }
}
