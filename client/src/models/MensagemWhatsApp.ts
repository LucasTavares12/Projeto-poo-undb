import type { Agendamento } from "../services/types";
import { Clinica } from "./Clinica";
import { DataAgenda } from "./DataAgenda";
import { Duracao } from "./Duracao";
import { Telefone } from "./Telefone";
import { PessoasDoAgendamento } from "./PessoasDoAgendamento";

export type TipoMensagem = "LEMBRETE" | "AGRADECIMENTO";

/**
 * Mensagem pronta para o cliente no WhatsApp: lembrete do horário (antes do atendimento)
 * ou agradecimento (depois). Se o horário foi marcado para outra pessoa (a mãe para a filha),
 * a mensagem vai para quem marcou, que é o dono do telefone, e cita quem vai ser atendido. Abre a conversa no WhatsApp Web/app já com o texto escrito;
 * quem manda de fato é a pessoa da clínica, conferindo antes de enviar.
 */
export class MensagemWhatsApp {
  private static readonly HORA = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Linha que separa os detalhes do horário do resto da mensagem.
  private static readonly SEPARADOR = "━━━━━━━━━━━━━━━";

  private readonly tipo: TipoMensagem;
  private readonly agendamento: Agendamento;
  /** Quem vai ser atendido e quem recebe a mensagem (o dono do telefone). */
  private readonly pessoas: PessoasDoAgendamento;

  constructor(tipo: TipoMensagem, agendamento: Agendamento) {
    this.tipo = tipo;
    this.agendamento = agendamento;
    this.pessoas = new PessoasDoAgendamento(agendamento);
  }

  /** "hoje às 10:32", "ontem às 18:05" ou "21/10 às 09:00": quando a mensagem foi mandada. */
  public static descreverEnvio(instante: string): string {
    const enviado = new Date(instante);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    const hora = MensagemWhatsApp.HORA.format(enviado);
    if (enviado.toDateString() === hoje.toDateString()) {
      return `hoje às ${hora}`;
    }
    if (enviado.toDateString() === ontem.toDateString()) {
      return `ontem às ${hora}`;
    }
    const dia = String(enviado.getDate()).padStart(2, "0");
    const mes = String(enviado.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes} às ${hora}`;
  }

  /** Quando esta mensagem já foi mandada para este agendamento (null = ainda não). */
  public getEnviadaEm(): string | null {
    return this.tipo === "LEMBRETE"
      ? this.agendamento.lembreteEnviadoEm
      : this.agendamento.agradecimentoEnviadoEm;
  }

  public getTexto(): string {
    return this.tipo === "LEMBRETE" ? this.textoDoLembrete() : this.textoDoAgradecimento();
  }

  /** Link do WhatsApp para o telefone do cliente, com o texto já preenchido. */
  public getLink(): string {
    const telefone = new Telefone(this.agendamento.cliente.telefone);
    return `${telefone.linkWhatsApp()}?text=${encodeURIComponent(this.getTexto())}`;
  }

  /** Primeiro nome de quem recebe a mensagem: o dono do telefone (quem marcou). */
  private primeiroNome(): string {
    return this.pessoas.contato().primeiroNome();
  }

  /** "do seu horário" ou "do horário de *Ana*", quando foi marcado para outra pessoa. */
  private doHorarioDeQuem(): string {
    return this.pessoas.foiMarcadoPorOutraPessoa()
      ? `do horário de *${this.pessoas.atendido()}*`
      : "do seu horário";
  }

  /** "você" ou "*Ana*", quando foi marcado para outra pessoa. */
  private quemFoiAtendido(): string {
    return this.pessoas.foiMarcadoPorOutraPessoa() ? `*${this.pessoas.atendido()}*` : "você";
  }

  /** "Limpeza de pele", "Limpeza de pele e Massagem" ou "A, B e C". */
  private tratamentos(): string {
    const nomes = this.agendamento.tratamentos.map((tratamento) => tratamento.nome);
    return nomes.length <= 1
      ? nomes.join("")
      : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
  }

  // No WhatsApp, *texto* fica em negrito e _texto_ em itálico.
  private textoDoLembrete(): string {
    const data = new DataAgenda(this.agendamento.data);
    return [
      `Olá, *${this.primeiroNome()}*! 🌸`,
      "",
      `Tudo bem? Passando para lembrar ${this.doHorarioDeQuem()} na *${Clinica.nome()}* ✨`,
      "",
      MensagemWhatsApp.SEPARADOR,
      `📅 *Data:* ${this.capitalizar(data.formatarPorExtenso())}`,
      `⏰ *Horário:* ${this.agendamento.horarioInicio}`,
      `💆 *${this.agendamento.tratamentos.length === 1 ? "Serviço" : "Serviços"}:* ${this.tratamentos()}`,
      `⏳ *Duração:* ${new Duracao(this.agendamento.duracaoTotalMinutos).formatar()}`,
      `👤 *Profissional:* ${this.agendamento.profissional.nome}`,
      MensagemWhatsApp.SEPARADOR,
      "",
      "💡 Chegue alguns minutinhos antes para aproveitar o atendimento com tranquilidade.",
      "",
      "Precisa *remarcar* ou *cancelar*? 🔄",
      `É só acessar 👉 ${Clinica.enderecoDeAgendamento()}`,
      `e informar o seu telefone (até ${Clinica.ANTECEDENCIA_MINIMA_HORAS}h antes do horário).`,
      "",
      "Te esperamos! 💕",
      `_${Clinica.nome()}_`,
    ].join("\n");
  }

  private textoDoAgradecimento(): string {
    return [
      `Olá, *${this.primeiroNome()}*! 💖`,
      "",
      `Muito obrigado por escolher a *${Clinica.nome()}* ✨`,
      "",
      `Foi um prazer cuidar de ${this.quemFoiAtendido()} ${this.quandoFoiAtendido()} ` +
        `com *${this.tratamentos()}*. ` +
        "Esperamos que tenha amado o resultado! 🌸",
      "",
      "💬 Sua opinião é muito importante para nós. Se quiser, responda esta mensagem " +
        "contando como foi a sua experiência.",
      "",
      "📅 Quando quiser voltar, é só agendar por aqui:",
      `👉 ${Clinica.enderecoDeAgendamento()}`,
      "",
      "Até a próxima! 🤗",
      `_Equipe ${Clinica.nome()}_`,
    ].join("\n");
  }

  /** "hoje", "ontem" ou "no dia 21/10". */
  private quandoFoiAtendido(): string {
    const hoje = DataAgenda.hoje();
    const data = this.agendamento.data.slice(0, 10);
    if (data === hoje.toString()) {
      return "hoje";
    }
    if (data === hoje.somarDias(-1).toString()) {
      return "ontem";
    }
    return `no dia ${new DataAgenda(data).formatarDiaMes()}`;
  }

  private capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
