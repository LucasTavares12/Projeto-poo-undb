/** Dados da clínica usados nas telas e nas mensagens aos clientes. */
export class Clinica {
  public static readonly NOME = "Clínica de Estética";

  /**
   * Pela página do cliente, agendar, remarcar e cancelar só com essa antecedência (em horas).
   * Mesma regra do servidor (AntecedenciaMinima.HORAS), que é quem garante.
   */
  public static readonly ANTECEDENCIA_MINIMA_HORAS = 2;

  /** Endereço da página de agendamento (onde o cliente agenda, remarca e cancela). */
  public static enderecoDeAgendamento(): string {
    return `${window.location.origin}/`;
  }
}
