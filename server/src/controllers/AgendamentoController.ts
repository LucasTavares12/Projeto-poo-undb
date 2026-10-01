import { Request, Response } from "express";
import { AgendamentoService } from "../services/AgendamentoService";
import { Horario } from "../module/Horario";
import { StatusAgendamento } from "../module/StatusAgendamento";

export class AgendamentoController {
  private readonly servico = new AgendamentoService();

  /** Painel Kanban do admin: lista todos os agendamentos. */
  public async listar(req: Request, res: Response): Promise<void> {
    const agendamentos = await this.servico.listarTodos();
    res.json(agendamentos);
  }

  /** Tela do cliente: quais horários aparecem como clicáveis para a data/tratamentos escolhidos. */
  public async disponibilidade(req: Request, res: Response): Promise<void> {
    try {
      const profissionalId = Number(req.query.profissionalId);
      const data = new Date(String(req.query.data));
      const tratamentoIds = String(req.query.tratamentoIds || "")
        .split(",")
        .filter((valor) => valor.length > 0)
        .map(Number);

      const horarios = await this.servico.listarHorariosDisponiveis(
        profissionalId,
        data,
        tratamentoIds
      );
      res.json(horarios);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  /** Cliente finaliza o agendamento (escolheu profissional, tratamentos, data, horário, nome e telefone). */
  public async criar(req: Request, res: Response): Promise<void> {
    try {
      const { clienteNome, clienteTelefone, profissionalId, tratamentoIds, data, horarioInicio } =
        req.body;

      const agendamento = await this.servico.criar({
        clienteNome,
        clienteTelefone,
        profissionalId: Number(profissionalId),
        tratamentoIds: (tratamentoIds as unknown[]).map(Number),
        data: new Date(data),
        horarioInicio: new Horario(horarioInicio),
      });

      res.status(201).json(agendamento);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  /** Admin arrasta o card no Kanban para outra coluna. */
  public async atualizarStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const status = req.body.status as StatusAgendamento;
      const agendamento = await this.servico.moverStatus(id, status);
      res.json(agendamento);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
}
