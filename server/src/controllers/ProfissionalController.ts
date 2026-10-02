import { Request, Response } from "express";
import { Profissional } from "../module/Profissional";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";

export class ProfissionalController {
  private readonly repositorio = new ProfissionalRepository();

  public async listar(req: Request, res: Response): Promise<void> {
    const profissionais = await this.repositorio.listarTodos();
    res.json(profissionais);
  }

  public async criar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, telefone, especialidade } = req.body;
      const profissional = await this.repositorio.salvar(
        new Profissional(nome, telefone, especialidade)
      );
      res.status(201).json(profissional);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  public async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { nome, telefone, especialidade } = req.body;
      const profissional = await this.repositorio.buscarPorId(id);
      if (!profissional) {
        res.status(404).json({ erro: "Profissional não encontrado." });
        return;
      }

      profissional.setNome(nome);
      profissional.setTelefone(telefone);
      profissional.setEspecialidade(especialidade);
      await this.repositorio.atualizar(profissional);
      res.json(profissional);
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
        erro: "Não é possível excluir este profissional: existem agendamentos ou horários vinculados a ele.",
      });
    }
  }
}
