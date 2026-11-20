import type { Agendamento } from "../services/types";
import { NomeDePessoa } from "./NomeDePessoa";

/**
 * Quem está envolvido num agendamento: quem vai ser atendido e quem é o contato (o dono do
 * telefone). Normalmente é a mesma pessoa; quando alguém marca para outra (a mãe para a
 * filha), o contato é quem marcou: recebe o WhatsApp e remarca/cancela com o número dele.
 */
export class PessoasDoAgendamento {
  private readonly agendamento: Agendamento;

  constructor(agendamento: Agendamento) {
    this.agendamento = agendamento;
  }

  public foiMarcadoPorOutraPessoa(): boolean {
    return this.agendamento.responsavelNome !== null;
  }

  /** Quem vai ser atendido. */
  public atendido(): NomeDePessoa {
    return new NomeDePessoa(this.agendamento.cliente.nome);
  }

  /** Com quem a clínica fala: quem marcou para outra pessoa ou a própria pessoa atendida. */
  public contato(): NomeDePessoa {
    return new NomeDePessoa(this.agendamento.responsavelNome ?? this.agendamento.cliente.nome);
  }

  /** "Marcado por Maria" quando foi para outra pessoa; null quando a própria pessoa marcou. */
  public marcadoPor(): string | null {
    return this.foiMarcadoPorOutraPessoa() ? `Marcado por ${this.contato()}` : null;
  }

  /** "Telefone" ou "Telefone de Maria (quem marcou)". */
  public rotuloDoTelefone(): string {
    return this.foiMarcadoPorOutraPessoa()
      ? `Telefone de ${this.contato()} (quem marcou)`
      : "Telefone";
  }

  /** " (para Ana)" quando o horário é de outra pessoa do telefone; vazio quando é do dono. */
  public paraQuem(): string {
    return this.foiMarcadoPorOutraPessoa() ? ` (para ${this.atendido()})` : "";
  }

  /** Para falar com o dono do telefone: "seu horário" ou "o horário de Ana". */
  public horarioDe(): string {
    return this.foiMarcadoPorOutraPessoa() ? `o horário de ${this.atendido()}` : "seu horário";
  }
}
