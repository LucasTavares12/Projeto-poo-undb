import { Request, Response } from "express";
import { Tratamento } from "../module/Tratamento";
import { TratamentoRepository } from "../repositories/TratamentoRepository";

export class TratamentoController {
  private readonly repositorio = new TratamentoRepository();

  public async listar(req: Request, res: Response): Promise<void> {
    const tratamentos = await this.repositorio.listarTodos();
    res.json(tratamentos);
  }

  public async criar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, descricao, valor, duracaoMinutos } = req.body;
      const tratamento = await this.repositorio.salvar(
        new Tratamento(nome, descricao, Number(valor), Number(duracaoMinutos))
      );
      res.status(201).json(tratamento);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  public async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { nome, descricao, valor, duracaoMinutos } = req.body;
      const tratamento = await this.repositorio.buscarPorId(id);
      if (!tratamento) {
        res.status(404).json({ erro: "Tratamento não encontrado." });
        return;
      }

      tratamento.setNome(nome);
      tratamento.setDescricao(descricao);
      tratamento.setValor(Number(valor));
      tratamento.setDuracaoMinutos(Number(duracaoMinutos));
      await this.repositorio.atualizar(tratamento);
      res.json(tratamento);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  public async deletar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await this.repositorio.deletar(id);
      res.status(204).send();
    } catch (erro) {
      res.status(409).json({
        erro: "Não é possível excluir este tratamento: existem agendamentos vinculados a ele.",
      });
    }
  }
}
