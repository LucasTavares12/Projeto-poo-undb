import { Cliente } from "./Cliente";
import { Pessoa } from "./Pessoa";
import { Responsavel } from "./Responsavel";
import { Profissional } from "./Profissional";
import { Tratamento } from "./Tratamento";
import { StatusAgendamento } from "./StatusAgendamento";
import { Horario } from "./Horario";
import { DataAgenda } from "./DataAgenda";
import { TipoMensagem } from "./TipoMensagem";
import { AntecedenciaMinima } from "./AntecedenciaMinima";
import { FormaDePagamento } from "./FormaDePagamento";
import { RelogioClinica } from "./RelogioClinica";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/** Dados do agendamento que vieram depois (todos opcionais, para não mexer nos construtores antigos). */
export interface DetalhesDoAgendamento {
  /** Como o cliente pretende pagar (null = não informou). */
  formaDePagamento?: FormaDePagamento | null;
}

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
  /**
   * Quem marcou, quando o atendimento é para outra pessoa (ex.: a mãe que agenda para a
   * filha com o próprio telefone). null = a própria pessoa atendida marcou. O cliente do
   * agendamento é sempre quem vai ser atendido; o telefone dele é o contato de quem marcou.
   */
  private responsavel: Responsavel | null;
  private formaDePagamento: FormaDePagamento | null;

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
    finalizadoEm: Date | null = null,
    responsavel: Responsavel | null = null,
    detalhes: DetalhesDoAgendamento = {}
  ) {
    if (tratamentos.length === 0) {
      throw new ErroDeValidacao("O agendamento precisa ter ao menos um tratamento.");
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
    this.responsavel = responsavel;
    this.formaDePagamento = detalhes.formaDePagamento ?? null;
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getCliente(): Cliente {
    return this.cliente;
  }

  /** Quem marcou para outra pessoa; null = a própria pessoa atendida marcou. */
  public getResponsavel(): Responsavel | null {
    return this.responsavel;
  }

  public getResponsavelNome(): string | null {
    return this.responsavel?.getNome() ?? null;
  }

  public foiMarcadoPorOutraPessoa(): boolean {
    return this.responsavel !== null;
  }

  /**
   * Com quem a clínica fala sobre este horário: o dono do telefone. É quem marcou para
   * outra pessoa ou, se a própria pessoa marcou, o cliente atendido.
   */
  public getContato(): Pessoa {
    return this.responsavel ?? this.cliente;
  }

  /**
   * Agendamento novo feito para outra pessoa: guarda quem marcou.
   * Vazio ou igual ao nome de quem vai ser atendido = a própria pessoa marcou (fica null).
   */
  public definirResponsavel(nome: string | null | undefined): void {
    this.responsavel = Responsavel.para(nome, this.cliente);
  }

  /**
   * Pela página do cliente, ver, remarcar e cancelar valem para quem tem o telefone do
   * agendamento: a própria pessoa ou quem marcou para ela (a mãe gerencia o da filha).
   */
  public pertenceAoTelefone(telefone: string): boolean {
    return this.getContato().temTelefone(telefone);
  }

  public getProfissional(): Profissional {
    return this.profissional;
  }

  public getTratamentos(): Tratamento[] {
    return this.tratamentos;
  }

  /**
   * Soma os valores de todos os tratamentos escolhidos neste agendamento, na forma de
   * pagamento escolhida (no cartão de crédito vale o valor do crédito de cada tratamento).
   */
  public getValorTotal(): number {
    return this.tratamentos.reduce((total, tratamento) => total + this.getValorDo(tratamento), 0);
  }

  /** Quanto este tratamento custa neste agendamento (depende da forma de pagamento). */
  public getValorDo(tratamento: Tratamento): number {
    return tratamento.getValorPara(this.formaDePagamento);
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

  /** true se o horário marcado já começou (ou passou). */
  public jaComecou(agora: Date = new Date()): boolean {
    return RelogioClinica.momento(this.data, this.horarioInicio).getTime() <= agora.getTime();
  }

  // ---------- Forma de pagamento ----------

  public getFormaDePagamento(): FormaDePagamento | null {
    return this.formaDePagamento;
  }

  /**
   * Muda a forma de pagamento (null = não informada). Vale a qualquer momento: o cliente
   * pode mudar de ideia na hora de pagar.
   */
  public definirFormaDePagamento(forma: FormaDePagamento | null): void {
    this.formaDePagamento = forma;
  }

  // ---------- Faltas ----------

  public faltou(): boolean {
    return this.status === StatusAgendamento.FALTOU;
  }

  /** Atendimento encerrado: foi finalizado ou o cliente faltou. */
  public estaEncerrado(): boolean {
    return this.status === StatusAgendamento.FINALIZADO || this.faltou();
  }

  /**
   * A equipe marca que o cliente não veio. Só para quem ainda estava "Agendado" e depois
   * que o horário começou (antes disso ele ainda pode chegar).
   */
  public registrarFalta(agora: Date = new Date()): void {
    if (this.status !== StatusAgendamento.AGENDADO) {
      throw new ErroDeValidacao("Só dá para marcar falta em agendamentos que aguardam atendimento.");
    }
    if (!this.jaComecou(agora)) {
      throw new ErroDeValidacao(
        "Só dá para marcar falta depois que o horário começar. Antes disso, o cliente ainda pode vir."
      );
    }
    this.status = StatusAgendamento.FALTOU;
    // Igual aos finalizados: sai sozinho do quadro depois de alguns dias.
    this.finalizadoEm = agora;
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
      throw new ErroDeValidacao(
        "Só é possível remarcar agendamentos que ainda não começaram a ser atendidos."
      );
    }
    if (this.estaMarcadoEm(data, horario)) {
      throw new ErroDeValidacao("O agendamento já está marcado nesse dia e horário.");
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
        throw new ErroDeValidacao("O lembrete é só para agendamentos que ainda não foram atendidos.");
      }
      this.lembreteEnviadoEm = quando;
    } else if (tipo === TipoMensagem.AGRADECIMENTO) {
      if (this.status !== StatusAgendamento.FINALIZADO) {
        throw new ErroDeValidacao("O agradecimento é só para atendimentos finalizados.");
      }
      this.agradecimentoEnviadoEm = quando;
    } else {
      throw new ErroDeValidacao(`Tipo de mensagem inválido: ${tipo}.`);
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

  /** Só sai do Kanban o que já foi encerrado (atendido ou falta): o resto ainda precisa ser acompanhado. */
  public podeSerArquivado(): boolean {
    return this.estaEncerrado() && !this.arquivado;
  }

  /** Tira o agendamento do Kanban sem apagar nada dele. */
  public arquivar(): void {
    if (!this.podeSerArquivado()) {
      throw new ErroDeValidacao("Só é possível limpar do quadro agendamentos finalizados.");
    }
    this.arquivado = true;
  }

  /** Devolve ao Kanban um agendamento que tinha sido limpo da tela. */
  public desarquivar(): void {
    if (!this.arquivado) {
      throw new ErroDeValidacao("Este agendamento já está no quadro.");
    }
    this.arquivado = false;
    // Trazido de volta: fica mais DIAS_PARA_OCULTAR_FINALIZADO dias no quadro antes de sair de novo.
    this.finalizadoEm = new Date();
  }

  public getFinalizadoEm(): Date | null {
    return this.finalizadoEm;
  }

  /**
   * Usado quando o admin arrasta o card diretamente para outra coluna do Kanban (ou usa os
   * botões). Ir para "Não compareceu" segue as regras de `registrarFalta`; sair dele desfaz a falta.
   */
  public moverPara(novoStatus: StatusAgendamento, agora: Date = new Date()): void {
    if (!Object.values(StatusAgendamento).includes(novoStatus)) {
      throw new ErroDeValidacao(`Status de agendamento inválido: ${novoStatus}.`);
    }
    if (novoStatus === this.status) {
      return;
    }
    if (novoStatus === StatusAgendamento.FALTOU) {
      this.registrarFalta(agora);
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
      responsavelNome: this.getResponsavelNome(),
      profissional: this.profissional,
      tratamentos: this.tratamentos,
      valorTotal: this.getValorTotal(),
      duracaoTotalMinutos: this.getDuracaoTotalMinutos(),
      lembreteEnviadoEm: this.lembreteEnviadoEm?.toISOString() ?? null,
      agradecimentoEnviadoEm: this.agradecimentoEnviadoEm?.toISOString() ?? null,
      formaDePagamento: this.formaDePagamento,
    };
  }
}
