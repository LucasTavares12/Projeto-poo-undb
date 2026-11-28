import { Pessoa } from "./Pessoa";
import type { Cliente } from "./Cliente";

/**
 * Quem marcou o horário para outra pessoa usando o próprio telefone (ex.: a mãe que agenda
 * para a filha). É o dono do telefone do agendamento: recebe os avisos pelo WhatsApp e pode
 * remarcar ou cancelar informando esse número. O cliente do agendamento continua sendo quem
 * vai ser atendido.
 */
export class Responsavel extends Pessoa {
  /** Carrega do banco (sem validar): o telefone é sempre o do cliente atendido. */
  constructor(nome: string, cliente: Cliente) {
    super(nome, cliente.getTelefone());
  }

  /**
   * Responsável de um agendamento novo. Nome vazio ou igual ao de quem vai ser atendido
   * quer dizer que a própria pessoa marcou: aí não há responsável (null).
   */
  public static para(nome: string | null | undefined, cliente: Cliente): Responsavel | null {
    const texto = String(nome ?? "").replace(/\s+/g, " ").trim();
    if (texto === "" || cliente.temNome(texto)) {
      return null;
    }
    const responsavel = new Responsavel(texto, cliente);
    responsavel.setNome(texto); // valida o tamanho máximo
    return responsavel;
  }

  protected papel(): string {
    return "de quem está agendando";
  }

  public apresentar(): string {
    return `Responsável: ${this.nome} (contato: ${this.telefone})`;
  }
}
