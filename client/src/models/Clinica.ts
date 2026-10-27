/** Dados da clínica usados nas telas e nas mensagens aos clientes. */
export class Clinica {
  public static readonly NOME = "Clínica de Estética";

  /** Endereço da página de agendamento (onde o cliente agenda, remarca e cancela). */
  public static enderecoDeAgendamento(): string {
    return `${window.location.origin}/`;
  }
}
