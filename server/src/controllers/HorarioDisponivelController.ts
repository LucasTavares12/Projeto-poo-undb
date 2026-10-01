import { Request, Response } from "express";
import { HorarioDisponivel } from "../module/HorarioDisponivel";
import { Horario } from "../module/Horario";
import { DiaSemana } from "../module/DiaSemana";
import { HorarioDisponivelRepository } from "../repositories/HorarioDisponivelRepository";

export class HorarioDisponivelController {
  private readonly repositorio = new HorarioDisponivelRepository();

  public async listarPorProfissional(req: Request, res: Response): Promise<void> {
    const profissionalId = Number(req.params.profissionalId);
    const horarios = await this.repositorio.listarPorProfissional(profissionalId);
    res.json(horarios);
  }

  public async criar(req: Request, res: Response): Promise<void> {
    try {
      const { profissionalId, diaSemana, horaInicio } = req.body;
      const horario = await this.repositorio.salvar(
        new HorarioDisponivel(
          Number(profissionalId),
          Number(diaSemana) as DiaSemana,
          new Horario(horaInicio)
        )
      );
      res.status(201).json(horario);
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
      res.status(409).json({ erro: "Não é possível excluir este horário agora." });
    }
  }
}
