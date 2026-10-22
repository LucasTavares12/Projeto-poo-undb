import { DataAgenda } from "./DataAgenda";

/** Dia + horário de início de um agendamento: como ele é mostrado e como os agendamentos são ordenados. */
export class HorarioMarcado {
  private readonly data: string; // "YYYY-MM-DD"
  private readonly horario: string; // "HH:MM"

  constructor(data: string, horario: string) {
    this.data = data.slice(0, 10);
    this.horario = horario;
  }

  public static de(agendamento: { data: string; horarioInicio: string }): HorarioMarcado {
    return new HorarioMarcado(agendamento.data, agendamento.horarioInicio);
  }

  /** "22/10/2026 às 09:00" */
  public formatar(): string {
    return `${new DataAgenda(this.data).formatar()} às ${this.horario}`;
  }

  /** "quinta-feira, 22 de outubro às 09:00" */
  public formatarPorExtenso(): string {
    return `${new DataAgenda(this.data).formatarPorExtenso()} às ${this.horario}`;
  }

  /** Negativo se este vem antes do outro. "YYYY-MM-DD HH:MM" ordena certo como texto. */
  public compararCom(outro: HorarioMarcado): number {
    return `${this.data} ${this.horario}`.localeCompare(`${outro.data} ${outro.horario}`);
  }
}
