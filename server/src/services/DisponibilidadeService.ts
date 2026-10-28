import { HorarioDisponivelRepository } from "../repositories/HorarioDisponivelRepository";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";
import { BloqueioAgendaRepository } from "../repositories/BloqueioAgendaRepository";
import { Horario } from "../module/Horario";
import { DiaSemana } from "../module/DiaSemana";
import { RelogioClinica } from "../module/RelogioClinica";
import { DataAgenda } from "../module/DataAgenda";
import { AntecedenciaMinima } from "../module/AntecedenciaMinima";

/**
 * Calcula, para um profissional e uma data específica, quais horários
 * (slots de 30min) estão realmente disponíveis para o cliente escolher —
 * cruzando o que o admin liberou (HorarioDisponivel) com o que já está
 * ocupado por outros agendamentos naquele dia. Dias com folga do profissional
 * ou feriado da clínica (BloqueioAgenda) não têm nenhum horário livre, e
 * horários que já passaram (dias anteriores ou mais cedo hoje) nunca aparecem.
 */
export interface OpcoesDeDisponibilidade {
  /** Agendamento que está sendo remarcado: os horários dele contam como livres. */
  ignorarAgendamentoId?: number;
  /** Página do cliente: só horários com a antecedência mínima. */
  exigirAntecedencia?: boolean;
}

export class DisponibilidadeService {
  private readonly horarioRepo = new HorarioDisponivelRepository();
  private readonly agendamentoRepo = new AgendamentoRepository();
  private readonly bloqueioRepo = new BloqueioAgendaRepository();

  /**
   * Retorna os horários em que o profissional pode COMEÇAR um atendimento
   * que ocupa `quantidadeSlotsNecessarios` slots consecutivos (a soma dos
   * tratamentos escolhidos pelo cliente).
   *
   * Ao remarcar, `ignorarAgendamentoId` é o próprio agendamento: os horários que ele ocupa hoje
   * contam como livres (dá para empurrar o atendimento 30min sem "esbarrar" nele mesmo).
   * Com `exigirAntecedencia` (página do cliente), só entram horários que começam daqui a
   * `AntecedenciaMinima.HORAS` horas ou mais; sem ela (painel), basta não ter passado.
   */
  public async listarHorariosDisponiveis(
    profissionalId: number,
    data: Date,
    quantidadeSlotsNecessarios: number,
    opcoes: OpcoesDeDisponibilidade = {}
  ): Promise<Horario[]> {
    const dia = DataAgenda.paraTexto(data);
    const hoje = RelogioClinica.hoje();
    if (dia < hoje || (await this.estaBloqueado(profissionalId, data))) {
      return [];
    }

    const diaSemana = data.getUTCDay() as DiaSemana;

    const horariosLiberados = await this.horarioRepo.listarPorProfissional(profissionalId);
    const horariosDoDiaSemana = horariosLiberados
      .filter((horario) => horario.getDiaSemana() === diaSemana)
      .map((horario) => horario.getHoraInicio());

    const conjuntoLiberados = new Set(horariosDoDiaSemana.map((horario) => horario.toString()));

    const conjuntoOcupados = await this.horariosOcupados(
      profissionalId,
      data,
      opcoes.ignorarAgendamentoId
    );

    // Hoje, só dá para começar um atendimento num horário que ainda não chegou.
    const ehHoje = dia === hoje;
    const aindaDaTempo = (candidato: Horario) =>
      opcoes.exigirAntecedencia
        ? AntecedenciaMinima.permite(data, candidato)
        : !(ehHoje && RelogioClinica.jaPassouHoje(candidato));
    return horariosDoDiaSemana.filter(
      (candidato) =>
        aindaDaTempo(candidato) &&
        this.todosOsSlotsCabem(
          candidato,
          quantidadeSlotsNecessarios,
          conjuntoLiberados,
          conjuntoOcupados
        )
    );
  }

  /** true se a agenda do profissional está fechada nesse dia (folga, férias ou feriado). */
  public estaBloqueado(profissionalId: number, data: Date): Promise<boolean> {
    return this.bloqueioRepo.existeNaData(profissionalId, data);
  }

  /** Todos os slots de 30min já ocupados por agendamentos do profissional nesse dia. */
  private async horariosOcupados(
    profissionalId: number,
    data: Date,
    ignorarAgendamentoId?: number
  ): Promise<Set<string>> {
    const agendamentosDoDia = await this.agendamentoRepo.listarPorProfissionalEData(
      profissionalId,
      data
    );
    return new Set(
      agendamentosDoDia
        .filter((agendamento) => agendamento.getId() !== ignorarAgendamentoId)
        .flatMap((agendamento) =>
          agendamento.getHorariosOcupados().map((horario) => horario.toString())
        )
    );
  }

  private todosOsSlotsCabem(
    inicio: Horario,
    quantidadeSlots: number,
    liberados: Set<string>,
    ocupados: Set<string>
  ): boolean {
    for (let i = 0; i < quantidadeSlots; i++) {
      const slot = inicio.somarSlots(i).toString();
      if (!liberados.has(slot) || ocupados.has(slot)) {
        return false;
      }
    }
    return true;
  }
}
