import { Agendamento } from "./Agendamento";
import { DataAgenda } from "./DataAgenda";
import { Horario } from "./Horario";
import { PerfilDeAcesso } from "./PerfilDeAcesso";
import { TipoNotificacao } from "./TipoNotificacao";
import { OrigemDaAcao } from "./OrigemDaAcao";

/**
 * Aviso que aparece no sino do painel quando um agendamento é criado, remarcado ou
 * cancelado. Fica guardado com o texto pronto (o agendamento cancelado deixa de existir,
 * mas o aviso continua fazendo sentido). Vale para o profissional do agendamento e para
 * quem tem acesso total. Agendamento novo avisa todo mundo; remarcação e cancelamento não
 * avisam quem fez a ação.
 */
export class Notificacao {
  private readonly id?: number;
  private readonly tipo: TipoNotificacao;
  private readonly profissionalId: number;
  private readonly agendamentoId: number | null;
  private readonly titulo: string;
  private readonly mensagem: string;
  private readonly origem: OrigemDaAcao;
  /** Conta do painel que fez a ação (null = cliente pelo site). */
  private readonly autorId: number | null;
  private readonly criadaEm: Date;

  constructor(
    tipo: TipoNotificacao,
    profissionalId: number,
    agendamentoId: number | null,
    titulo: string,
    mensagem: string,
    origem: OrigemDaAcao,
    autorId: number | null,
    criadaEm: Date = new Date(),
    id?: number
  ) {
    this.tipo = tipo;
    this.profissionalId = profissionalId;
    this.agendamentoId = agendamentoId;
    this.titulo = titulo;
    this.mensagem = mensagem;
    this.origem = origem;
    this.autorId = autorId;
    this.criadaEm = criadaEm;
    this.id = id;
  }

  /** "Ana Souza agendou Limpeza de pele em qui, 05/11 às 10:00 com Mariana (pelo site)." */
  public static novoAgendamento(
    agendamento: Agendamento,
    origem: OrigemDaAcao,
    autorId: number | null
  ): Notificacao {
    return Notificacao.sobre(
      agendamento,
      TipoNotificacao.NOVO_AGENDAMENTO,
      "Novo agendamento",
      (origem === OrigemDaAcao.CLIENTE
        ? `${agendamento.getCliente().getNome()} agendou `
        : `Agendado para ${agendamento.getCliente().getNome()}: `) +
        `${Notificacao.servicos(agendamento)} em ` +
        `${Notificacao.quando(agendamento.getData(), agendamento.getHorarioInicio())}`,
      origem,
      autorId
    );
  }

  public static remarcado(
    agendamento: Agendamento,
    dataAnterior: Date,
    horarioAnterior: Horario,
    origem: OrigemDaAcao,
    autorId: number | null
  ): Notificacao {
    return Notificacao.sobre(
      agendamento,
      TipoNotificacao.AGENDAMENTO_REMARCADO,
      "Agendamento remarcado",
      `${agendamento.getCliente().getNome()}: de ${Notificacao.quando(dataAnterior, horarioAnterior)} ` +
        `para ${Notificacao.quando(agendamento.getData(), agendamento.getHorarioInicio())}`,
      origem,
      autorId
    );
  }

  public static cancelado(
    agendamento: Agendamento,
    origem: OrigemDaAcao,
    autorId: number | null
  ): Notificacao {
    return Notificacao.sobre(
      agendamento,
      TipoNotificacao.AGENDAMENTO_CANCELADO,
      "Agendamento cancelado",
      (origem === OrigemDaAcao.CLIENTE
        ? `${agendamento.getCliente().getNome()} cancelou `
        : `Cancelado o agendamento de ${agendamento.getCliente().getNome()}: `) +
        `${Notificacao.servicos(agendamento)} de ` +
        `${Notificacao.quando(agendamento.getData(), agendamento.getHorarioInicio())}`,
      origem,
      autorId,
      // O agendamento cancelado é apagado: o aviso não aponta mais para ele.
      false
    );
  }

  private static sobre(
    agendamento: Agendamento,
    tipo: TipoNotificacao,
    titulo: string,
    inicioDaMensagem: string,
    origem: OrigemDaAcao,
    autorId: number | null,
    ligarAoAgendamento = true
  ): Notificacao {
    const profissional = agendamento.getProfissional();
    const comQuem = `com ${profissional.getNome()}`;
    const deOnde = origem === OrigemDaAcao.CLIENTE ? "pelo site" : "pelo painel";
    return new Notificacao(
      tipo,
      profissional.getId()!,
      ligarAoAgendamento ? (agendamento.getId() ?? null) : null,
      titulo,
      `${inicioDaMensagem} ${comQuem} (${deOnde}).`,
      origem,
      autorId
    );
  }

  /** "qui, 05/11 às 10:00" */
  private static quando(data: Date, horario: Horario): string {
    const diaDaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
      .format(data)
      .replace(".", "");
    const [, mes, dia] = DataAgenda.paraTexto(data).split("-");
    return `${diaDaSemana}, ${dia}/${mes} às ${horario}`;
  }

  /** "Limpeza de pele" ou "Limpeza de pele e Massagem". */
  private static servicos(agendamento: Agendamento): string {
    const nomes = agendamento.getTratamentos().map((tratamento) => tratamento.getNome());
    return nomes.length <= 1
      ? nomes.join("")
      : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getTipo(): TipoNotificacao {
    return this.tipo;
  }

  public getProfissionalId(): number {
    return this.profissionalId;
  }

  public getAgendamentoId(): number | null {
    return this.agendamentoId;
  }

  public getTitulo(): string {
    return this.titulo;
  }

  public getMensagem(): string {
    return this.mensagem;
  }

  public getOrigem(): OrigemDaAcao {
    return this.origem;
  }

  public getAutorId(): number | null {
    return this.autorId;
  }

  public getCriadaEm(): Date {
    return this.criadaEm;
  }

  /**
   * Aparece para a conta se for do profissional dela (ou acesso total). Agendamento novo avisa
   * sempre; remarcação e cancelamento feitos pela própria conta não viram aviso para ela.
   */
  public podeSerVistaPor(perfil: PerfilDeAcesso, adminId: number): boolean {
    return (
      perfil.podeGerenciar(this.profissionalId) &&
      (this.tipo === TipoNotificacao.NOVO_AGENDAMENTO || this.autorId !== adminId)
    );
  }

  public toJSON() {
    return {
      id: this.id,
      tipo: this.tipo,
      profissionalId: this.profissionalId,
      agendamentoId: this.agendamentoId,
      titulo: this.titulo,
      mensagem: this.mensagem,
      origem: this.origem,
      criadaEm: this.criadaEm.toISOString(),
    };
  }
}
