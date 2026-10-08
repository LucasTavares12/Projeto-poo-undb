import { Cliente } from "./Cliente";
import { Profissional } from "./Profissional";
import { Tratamento } from "./Tratamento";
import { StatusAgendamento } from "./StatusAgendamento";
import { Horario } from "./Horario";

export class Agendamento {
  private id?: number;
  private cliente: Cliente;
  private profissional: Profissional;
  private tratamentos: Tratamento[];
  private data: Date;
  private horarioInicio: Horario; // primeiro slot ocupado
  private status: StatusAgendamento;
  /**
   * Arquivado = saiu do Kanban para não poluir a tela, mas continua guardado:
   * os relatórios seguem contando o atendimento e o valor dele.
   */
  private arquivado: boolean;

  constructor(
    cliente: Cliente,
    profissional: Profissional,
    tratamentos: Tratamento[],
    data: Date,
    horarioInicio: Horario,
    status: StatusAgendamento = StatusAgendamento.AGENDADO,
    id?: number,
    arquivado = false
  ) {
    if (tratamentos.length === 0) {
      throw new Error("O agendamento precisa ter ao menos um tratamento.");
    }

    this.cliente = cliente;
    this.profissional = profissional;
    this.tratamentos = tratamentos;
    this.data = data;
    this.horarioInicio = horarioInicio;
    this.status = status;
    this.id = id;
    this.arquivado = arquivado;
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

  public getTratamentos(): Tratamento[] {
    return this.tratamentos;
  }

  /** Soma os valores de todos os tratamentos escolhidos neste agendamento. */
  public getValorTotal(): number {
    return this.tratamentos.reduce((total, tratamento) => total + tratamento.getValor(), 0);
  }

  /** Soma a duração (em minutos) de todos os tratamentos escolhidos. */
  public getDuracaoTotalMinutos(): number {
    return this.tratamentos.reduce(
      (total, tratamento) => total + tratamento.getDuracaoMinutos(),
      0
    );
  }

  /** Soma a quantidade de slots de 30min de todos os tratamentos escolhidos. */
  public getQuantidadeSlots(): number {
    return this.tratamentos.reduce(
      (total, tratamento) => total + tratamento.getQuantidadeSlots(),
      0
    );
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
   * a partir de `horarioInicio`, somando a duração de TODOS os tratamentos
   * escolhidos. Ex: dois tratamentos de 30min cada, iniciando às 09:00,
   * ocupam [Horario("09:00"), Horario("09:30")].
   */
  public getHorariosOcupados(): Horario[] {
    const quantidadeSlots = this.getQuantidadeSlots();

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

  /** Só dá para cancelar o que ainda não começou a ser atendido. */
  public podeSerCancelado(): boolean {
    return this.status === StatusAgendamento.AGENDADO;
  }

  public estaArquivado(): boolean {
    return this.arquivado;
  }

  /** Só sai do Kanban o que já foi atendido: o resto ainda precisa ser acompanhado. */
  public podeSerArquivado(): boolean {
    return this.status === StatusAgendamento.FINALIZADO && !this.arquivado;
  }

  /** Tira o agendamento do Kanban sem apagar nada dele. */
  public arquivar(): void {
    if (!this.podeSerArquivado()) {
      throw new Error("Só é possível limpar do quadro agendamentos finalizados.");
    }
    this.arquivado = true;
  }

  /** Devolve ao Kanban um agendamento que tinha sido limpo da tela. */
  public desarquivar(): void {
    if (!this.arquivado) {
      throw new Error("Este agendamento já está no quadro.");
    }
    this.arquivado = false;
  }

  /** Usado quando o admin arrasta o card diretamente para outra coluna do Kanban. */
  public moverPara(novoStatus: StatusAgendamento): void {
    if (!Object.values(StatusAgendamento).includes(novoStatus)) {
      throw new Error(`Status de agendamento inválido: ${novoStatus}.`);
    }
    this.status = novoStatus;
  }

  public toJSON() {
    return {
      id: this.id,
      data: this.data.toISOString().slice(0, 10),
      horarioInicio: this.horarioInicio,
      status: this.status,
      cliente: this.cliente,
      profissional: this.profissional,
      tratamentos: this.tratamentos,
      valorTotal: this.getValorTotal(),
      duracaoTotalMinutos: this.getDuracaoTotalMinutos(),
    };
  }
}
