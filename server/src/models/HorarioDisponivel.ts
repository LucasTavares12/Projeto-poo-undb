import { DiaSemana } from "./DiaSemana";
import { Horario } from "./Horario";

/**
 * Um dos horários da grade fixa de 30min (09:00, 09:30, 10:00, ...) que o
 * admin liberou para um profissional em um dia da semana (ex: toda Segunda
 * às 09:00). A disponibilidade real para uma data específica é calculada
 * cruzando estes horários com os agendamentos já existentes.
 */
export class HorarioDisponivel {
  private id?: number;
  private profissionalId: number;
  private diaSemana: DiaSemana;
  private horaInicio: Horario;

  constructor(
    profissionalId: number,
    diaSemana: DiaSemana,
    horaInicio: Horario,
    id?: number
  ) {
    this.profissionalId = profissionalId;
    this.diaSemana = diaSemana;
    this.horaInicio = horaInicio;
    this.id = id;
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getProfissionalId(): number {
    return this.profissionalId;
  }

  public getDiaSemana(): DiaSemana {
    return this.diaSemana;
  }

  public getHoraInicio(): Horario {
    return this.horaInicio;
  }
}
