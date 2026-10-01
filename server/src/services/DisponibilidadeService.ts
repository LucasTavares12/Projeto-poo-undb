import { HorarioDisponivelRepository } from "../repositories/HorarioDisponivelRepository";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";
import { Horario } from "../module/Horario";
import { DiaSemana } from "../module/DiaSemana";

/**
 * Calcula, para um profissional e uma data específica, quais horários
 * (slots de 30min) estão realmente disponíveis para o cliente escolher —
 * cruzando o que o admin liberou (HorarioDisponivel) com o que já está
 * ocupado por outros agendamentos naquele dia.
 */
export class DisponibilidadeService {
  private readonly horarioRepo = new HorarioDisponivelRepository();
  private readonly agendamentoRepo = new AgendamentoRepository();

  /**
   * Retorna os horários em que o profissional pode COMEÇAR um atendimento
   * que ocupa `quantidadeSlotsNecessarios` slots consecutivos (a soma dos
   * tratamentos escolhidos pelo cliente).
   */
  public async listarHorariosDisponiveis(
    profissionalId: number,
    data: Date,
    quantidadeSlotsNecessarios: number
  ): Promise<Horario[]> {
    const diaSemana = data.getUTCDay() as DiaSemana;

    const horariosLiberados = await this.horarioRepo.listarPorProfissional(profissionalId);
    const horariosDoDiaSemana = horariosLiberados
      .filter((horario) => horario.getDiaSemana() === diaSemana)
      .map((horario) => horario.getHoraInicio());

    const conjuntoLiberados = new Set(horariosDoDiaSemana.map((horario) => horario.toString()));

    const agendamentosDoDia = await this.agendamentoRepo.listarPorProfissionalEData(
      profissionalId,
      data
    );
    const conjuntoOcupados = new Set(
      agendamentosDoDia.flatMap((agendamento) =>
        agendamento.getHorariosOcupados().map((horario) => horario.toString())
      )
    );

    return horariosDoDiaSemana.filter((candidato) =>
      this.todosOsSlotsCabem(candidato, quantidadeSlotsNecessarios, conjuntoLiberados, conjuntoOcupados)
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
