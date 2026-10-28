import { Cliente } from "./Cliente";
import { Profissional } from "./Profissional";
import { Tratamento } from "./Tratamento";
import { StatusAgendamento } from "./StatusAgendamento";
import { Horario } from "./Horario";
import { DataAgenda } from "./DataAgenda";
import { TipoMensagem } from "./TipoMensagem";
import { AntecedenciaMinima } from "./AntecedenciaMinima";

export class Agendamento {
  /**
   * Quantos dias depois da data marcada um agendamento que ficou esquecido em
   * "Agendado" ou "Em atendimento" passa sozinho para "Finalizado".
   */
  public static readonly DIAS_PARA_FINALIZAR_SOZINHO = 2;

  /**
   * Quantos dias um atendimento fica na coluna "Finalizados" do Kanban antes de sair
   * sozinho para os ocultos (continua nos relatórios e no histórico do cliente).
   */
  public static readonly DIAS_PARA_OCULTAR_FINALIZADO = 2;

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
  /** Quando a clínica mandou cada mensagem de WhatsApp (null = ainda não mandou). */
  private lembreteEnviadoEm: Date | null;
  private agradecimentoEnviadoEm: Date | null;
  /**
   * Desde quando o atendimento está em "Finalizados" no quadro: quando foi finalizado ou,
   * se foi trazido de volta dos ocultos, quando voltou. null = não está finalizado (ou foi
   * finalizado antes de o sistema guardar essa data; aí vale a data do agendamento).
   */
  private finalizadoEm: Date | null;

  constructor(
    cliente: Cliente,
    profissional: Profissional,
    tratamentos: Tratamento[],
    data: Date,
    horarioInicio: Horario,
    status: StatusAgendamento = StatusAgendamento.AGENDADO,
    id?: number,
    arquivado = false,
    lembreteEnviadoEm: Date | null = null,
    agradecimentoEnviadoEm: Date | null = null,
    finalizadoEm: Date | null = null
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
    this.lembreteEnviadoEm = lembreteEnviadoEm;
    this.agradecimentoEnviadoEm = agradecimentoEnviadoEm;
    this.finalizadoEm = finalizadoEm;
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
      this.moverPara(StatusAgendamento.EM_ATENDIMENTO);
    } else if (this.status === StatusAgendamento.EM_ATENDIMENTO) {
      this.moverPara(StatusAgendamento.FINALIZADO);
    }
  }

  /** Só dá para cancelar o que ainda não começou a ser atendido. */
  public podeSerCancelado(): boolean {
    return this.status === StatusAgendamento.AGENDADO;
  }

  /**
   * Pela página do cliente, remarcar e cancelar só valem até `AntecedenciaMinima.HORAS`
   * horas antes do horário (a equipe, pelo painel, pode a qualquer momento).
   */
  public podeSerAlteradoPeloCliente(agora: Date = new Date()): boolean {
    return (
      this.podeSerCancelado() &&
      AntecedenciaMinima.permite(this.data, this.horarioInicio, agora)
    );
  }

  /** Remarcar segue a mesma regra do cancelamento: só o que ainda não começou a ser atendido. */
  public podeSerRemarcado(): boolean {
    return this.status === StatusAgendamento.AGENDADO;
  }

  /** true se o agendamento já está exatamente nesse dia e horário. */
  public estaMarcadoEm(data: Date, horario: Horario): boolean {
    return DataAgenda.mesmoDia(this.data, data) && this.horarioInicio.equals(horario);
  }

  /**
   * Muda o dia e o horário mantendo todo o resto (cliente, profissional, tratamentos e valor).
   * Quem chama confere antes se o novo horário está livre na agenda do profissional.
   */
  public remarcar(data: Date, horario: Horario): void {
    if (!this.podeSerRemarcado()) {
      throw new Error(
        "Só é possível remarcar agendamentos que ainda não começaram a ser atendidos."
      );
    }
    if (this.estaMarcadoEm(data, horario)) {
      throw new Error("O agendamento já está marcado nesse dia e horário.");
    }
    this.data = data;
    this.horarioInicio = horario;
    // O lembrete enviado falava do horário antigo: precisa mandar de novo.
    this.lembreteEnviadoEm = null;
  }

  /**
   * Anota que a mensagem foi mandada ao cliente. Lembrete só faz sentido antes do
   * atendimento; agradecimento, só depois dele.
   */
  public registrarMensagem(tipo: TipoMensagem, quando: Date = new Date()): void {
    if (tipo === TipoMensagem.LEMBRETE) {
      if (this.status !== StatusAgendamento.AGENDADO) {
        throw new Error("O lembrete é só para agendamentos que ainda não foram atendidos.");
      }
      this.lembreteEnviadoEm = quando;
    } else if (tipo === TipoMensagem.AGRADECIMENTO) {
      if (this.status !== StatusAgendamento.FINALIZADO) {
        throw new Error("O agradecimento é só para atendimentos finalizados.");
      }
      this.agradecimentoEnviadoEm = quando;
    } else {
      throw new Error(`Tipo de mensagem inválido: ${tipo}.`);
    }
  }

  public getLembreteEnviadoEm(): Date | null {
    return this.lembreteEnviadoEm;
  }

  public getAgradecimentoEnviadoEm(): Date | null {
    return this.agradecimentoEnviadoEm;
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
    // Trazido de volta: fica mais DIAS_PARA_OCULTAR_FINALIZADO dias no quadro antes de sair de novo.
    this.finalizadoEm = new Date();
  }

  public getFinalizadoEm(): Date | null {
    return this.finalizadoEm;
  }

  /** Usado quando o admin arrasta o card diretamente para outra coluna do Kanban. */
  public moverPara(novoStatus: StatusAgendamento): void {
    if (!Object.values(StatusAgendamento).includes(novoStatus)) {
      throw new Error(`Status de agendamento inválido: ${novoStatus}.`);
    }
    if (novoStatus === this.status) {
      return;
    }
    this.status = novoStatus;
    // Começa (ou zera) a contagem para sair sozinho da coluna "Finalizados".
    this.finalizadoEm = novoStatus === StatusAgendamento.FINALIZADO ? new Date() : null;
  }

  public toJSON() {
    return {
      id: this.id,
      data: DataAgenda.paraTexto(this.data),
      horarioInicio: this.horarioInicio,
      status: this.status,
      cliente: this.cliente,
      profissional: this.profissional,
      tratamentos: this.tratamentos,
      valorTotal: this.getValorTotal(),
      duracaoTotalMinutos: this.getDuracaoTotalMinutos(),
      lembreteEnviadoEm: this.lembreteEnviadoEm?.toISOString() ?? null,
      agradecimentoEnviadoEm: this.agradecimentoEnviadoEm?.toISOString() ?? null,
    };
  }
}
