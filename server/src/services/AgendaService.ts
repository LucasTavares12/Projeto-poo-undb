import { AgendaSemanal } from "../module/AgendaSemanal";
import { DataAgenda } from "../module/DataAgenda";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";
import { BloqueioAgendaRepository } from "../repositories/BloqueioAgendaRepository";
import { HorarioDisponivelRepository } from "../repositories/HorarioDisponivelRepository";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { ErroNaoEncontrado } from "./ErroNaoEncontrado";

/** Visão de agenda do painel: a semana de um profissional, horário a horário. */
export class AgendaService {
  private readonly profissionalRepo = new ProfissionalRepository();
  private readonly horarioRepo = new HorarioDisponivelRepository();
  private readonly agendamentoRepo = new AgendamentoRepository();
  private readonly bloqueioRepo = new BloqueioAgendaRepository();

  public async montar(
    profissionalId: number,
    inicio: Date,
    quantidadeDias: number = AgendaSemanal.DIAS_PADRAO
  ): Promise<AgendaSemanal> {
    const profissional = await this.profissionalRepo.buscarPorId(profissionalId);
    if (!profissional) {
      throw new ErroNaoEncontrado("Profissional não encontrado.");
    }

    const fim = new Date(inicio);
    fim.setUTCDate(fim.getUTCDate() + quantidadeDias - 1);
    const [grade, agendamentos, bloqueios] = await Promise.all([
      this.horarioRepo.listarPorProfissional(profissionalId),
      this.agendamentoRepo.listarPorProfissionalEPeriodo(
        profissionalId,
        DataAgenda.paraTexto(inicio),
        DataAgenda.paraTexto(fim)
      ),
      // Folgas do profissional e feriados da clínica que terminam a partir do início do período.
      this.bloqueioRepo.listar(profissionalId, DataAgenda.paraTexto(inicio)),
    ]);

    return new AgendaSemanal(profissional, inicio, quantidadeDias, grade, agendamentos, bloqueios);
  }
}
