import { Cliente } from "./Cliente";
import { Profissional } from "./Profissional";
import { Tratamento } from "./Tratamento";
import { StatusAgendamento } from "./StatusAgendamento";
import { Horario } from "./Horario";

export class Agendamento {
  private id?: number;
  private cliente: Cliente;
  private profissional: Profissional;
  private tratamento: Tratamento;
  private data: Date;
  private horarioInicio: Horario; // primeiro slot ocupado
  private status: StatusAgendamento;

  constructor(
    cliente: Cliente,
    profissional: Profissional,
    tratamento: Tratamento,
    data: Date,
    horarioInicio: Horario,
    status: StatusAgendamento = StatusAgendamento.AGENDADO,
    id?: number
  ) {
    this.cliente = cliente;
    this.profissional = profissional;
    this.tratamento = tratamento;
    this.data = data;
    this.horarioInicio = horarioInicio;
    this.status = status;
    this.id = id;
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getCliente(): Cliente {
    return this.cliente;
  }

  public getProfissional(): Profissional {
    return this.profissional;
  }

  public getTratamento(): Tratamento {
    return this.tratamento;
  }

  public getData(): Date {
    return this.data;
  }

  public getHorarioInicio(): Horario {
    return this.horarioInicio;
  }

  public getStatus(): StatusAgendamento {
    return this.status;
  }

  /**
   * Lista de horários (slots de 30min) ocupados por este agendamento,
   * a partir de `horarioInicio`, de acordo com a duração do tratamento.
   * Ex: tratamento de 1h iniciando às 09:00 ocupa [Horario("09:00"), Horario("09:30")].
   */
  public getHorariosOcupados(): Horario[] {
    const quantidadeSlots = this.tratamento.getQuantidadeSlots();

    const slots: Horario[] = [];
    for (let i = 0; i < quantidadeSlots; i++) {
      slots.push(this.horarioInicio.somarSlots(i));
    }
    return slots;
  }

  /** Move o agendamento para a próxima etapa do Kanban (Agendado -> Em atendimento -> Finalizado). */
  public avancarStatus(): void {
    if (this.status === StatusAgendamento.AGENDADO) {
      this.status = StatusAgendamento.EM_ATENDIMENTO;
    } else if (this.status === StatusAgendamento.EM_ATENDIMENTO) {
      this.status = StatusAgendamento.FINALIZADO;
    }
  }

  /** Usado quando o admin arrasta o card diretamente para outra coluna do Kanban. */
  public moverPara(novoStatus: StatusAgendamento): void {
    this.status = novoStatus;
  }
}
