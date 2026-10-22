import { Request, Response } from "express";
import { BloqueioAgendaService } from "../services/BloqueioAgendaService";
import type { DadosNovoBloqueio } from "../services/BloqueioAgendaService";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

export class BloqueioAgendaController {
  private readonly servico = new BloqueioAgendaService();

  /** Painel: folgas e feriados (?incluirPassados=true traz também os que já terminaram). */
  public async listar(req: Request, res: Response): Promise<void> {
    const bloqueios = await this.servico.listar(
      SessaoDaRequisicao.profissionalId(res),
      req.query.incluirPassados === "true"
    );
    res.json(bloqueios);
  }

  /** Página do cliente: dias fechados na agenda do profissional (sem o motivo). */
  public async listarPublico(req: Request, res: Response): Promise<void> {
    try {
      const bloqueios = await this.servico.listarDoProfissional(Number(req.query.profissionalId));
      res.json(bloqueios.map((bloqueio) => bloqueio.paraPublico()));
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  public async criar(req: Request, res: Response): Promise<void> {
    try {
      const dados = this.lerDadosNovoBloqueio(req);

      // Conta ligada a profissional: só fecha a própria agenda (feriado da clínica é do acesso total).
      const proprio = SessaoDaRequisicao.profissionalId(res);
      if (proprio !== null && dados.profissionalId !== proprio) {
        res.status(403).json({ erro: "Você só pode bloquear a agenda do seu profissional." });
        return;
      }

      const { bloqueio, agendamentosAfetados } = await this.servico.criar(dados);
      res.status(201).json({ bloqueio, agendamentosAfetados });
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }

  public async deletar(req: Request, res: Response): Promise<void> {
    const bloqueio = await this.servico.buscarPorId(Number(req.params.id));
    if (!bloqueio) {
      res.status(404).json({ erro: "Bloqueio não encontrado." });
      return;
    }

    const proprio = SessaoDaRequisicao.profissionalId(res);
    if (proprio !== null && bloqueio.getProfissionalId() !== proprio) {
      res.status(403).json({
        erro: bloqueio.ehDaClinicaInteira()
          ? "Só quem tem acesso total pode remover um bloqueio da clínica inteira."
          : "Você só pode remover os bloqueios do seu profissional.",
      });
      return;
    }

    await this.servico.remover(Number(req.params.id));
    res.status(204).send();
  }

  private lerDadosNovoBloqueio(req: Request): DadosNovoBloqueio {
    const { profissionalId, dataInicio, dataFim, motivo } = req.body ?? {};

    const inicio = this.lerData(dataInicio, "Informe a data de início do bloqueio.");
    // Sem data final: bloqueio de um dia só.
    const fim = dataFim ? this.lerData(dataFim, "Data final inválida.") : inicio;

    return {
      profissionalId:
        profissionalId === null || profissionalId === undefined || profissionalId === ""
          ? null
          : Number(profissionalId),
      dataInicio: inicio,
      dataFim: fim,
      motivo: String(motivo ?? ""),
    };
  }

  /** "YYYY-MM-DD" → meia-noite UTC, como as outras datas da agenda. */
  private lerData(valor: unknown, mensagemDeErro: string): Date {
    const texto = String(valor ?? "");
    const data = new Date(`${texto}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto) || Number.isNaN(data.getTime())) {
      throw new Error(mensagemDeErro);
    }
    return data;
  }
}
