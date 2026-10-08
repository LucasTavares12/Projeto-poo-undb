import { Request, Response } from "express";
import { AgendamentoService } from "../services/AgendamentoService";
import type { DadosNovoAgendamento } from "../services/AgendamentoService";
import { Horario } from "../module/Horario";
import { StatusAgendamento } from "../module/StatusAgendamento";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

export class AgendamentoController {
  private readonly servico = new AgendamentoService();

  /** Kanban: todos os agendamentos, ou só os do profissional ligado ao usuário logado. */
  public async listar(req: Request, res: Response): Promise<void> {
    const agendamentos = await this.servico.listarTodos(SessaoDaRequisicao.profissionalId(res));
    res.json(agendamentos);
  }

  /** Tela do cliente: quais horários aparecem como clicáveis para a data/tratamentos escolhidos. */
  public async disponibilidade(req: Request, res: Response): Promise<void> {
    try {
      const { profissionalId, data, tratamentoIds } = this.lerConsultaDeHorarios(req);
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

  private lerConsultaDeHorarios(req: Request) {
    const data = new Date(String(req.query.data));
    if (Number.isNaN(data.getTime())) {
      throw new Error("Data inválida.");
    }
    return {
      profissionalId: Number(req.query.profissionalId),
      data,
      tratamentoIds: String(req.query.tratamentoIds || "")
        .split(",")
        .filter((valor) => valor.length > 0)
        .map(Number),
    };
  }

  /** Cliente finaliza o agendamento (escolheu profissional, tratamentos, data, horário, nome e telefone). */
  public async criar(req: Request, res: Response): Promise<void> {
    try {
      const agendamento = await this.servico.criar(this.lerDadosNovoAgendamento(req));
      res.status(201).json(agendamento);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  private lerDadosNovoAgendamento(req: Request): DadosNovoAgendamento {
    const { clienteNome, clienteTelefone, profissionalId, tratamentoIds, data, horarioInicio } =
      req.body ?? {};

    if (!data) {
      throw new Error("Informe a data do agendamento.");
    }
    if (!horarioInicio) {
      throw new Error("Informe o horário do agendamento.");
    }

    return {
      clienteNome,
      clienteTelefone,
      profissionalId: Number(profissionalId),
      tratamentoIds: Array.isArray(tratamentoIds) ? tratamentoIds.map(Number) : [],
      data: new Date(data),
      horarioInicio: new Horario(String(horarioInicio ?? "")),
    };
  }

  /** Página do cliente: agendamentos em aberto do telefone informado (?telefone=...). */
  public async listarDoCliente(req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.servico.listarDoCliente(String(req.query.telefone ?? "")));
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  /** Página do cliente: a pessoa cancela o próprio agendamento, confirmando pelo telefone. */
  public async cancelarDoCliente(req: Request, res: Response): Promise<void> {
    try {
      await this.servico.cancelarPeloCliente(
        Number(req.params.id),
        String(req.query.telefone ?? "")
      );
      res.status(204).send();
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  /** Botão "Cancelar" dos cards da coluna "Agendados" no Kanban. */
  public async cancelar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await this.servico.cancelar(id, SessaoDaRequisicao.profissionalId(res));
      res.status(204).send();
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  /** Botão "Limpar" da coluna "Finalizados": some do Kanban, mas continua nos relatórios. */
  public async arquivarFinalizados(req: Request, res: Response): Promise<void> {
    const arquivados = await this.servico.arquivarFinalizados(
      SessaoDaRequisicao.profissionalId(res)
    );
    res.json({ arquivados });
  }

  /** Quantos finalizados estão ocultos: o Kanban usa para mostrar o botão "Mostrar ocultos". */
  public async contarArquivados(req: Request, res: Response): Promise<void> {
    const quantidade = await this.servico.contarArquivados(SessaoDaRequisicao.profissionalId(res));
    res.json({ quantidade });
  }

  /** Botão "Mostrar ocultos" da coluna "Finalizados": traz de volta o que foi limpo. */
  public async restaurarArquivados(req: Request, res: Response): Promise<void> {
    const restaurados = await this.servico.restaurarArquivados(
      SessaoDaRequisicao.profissionalId(res)
    );
    res.json({ restaurados });
  }

  /** Admin arrasta o card no Kanban para outra coluna. */
  public async atualizarStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const status = req.body.status as StatusAgendamento;
      const agendamento = await this.servico.moverStatus(
        id,
        status,
        SessaoDaRequisicao.profissionalId(res)
      );
      res.json(agendamento);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
}
