/** Dados da clínica usados nas telas e nas mensagens aos clientes. */
export class Clinica {
  /** Nome usado até a personalização chegar do servidor (ou se nunca foi alterado). */
  public static readonly NOME_PADRAO = "Clínica de Estética";

  private static nomeAtual = Clinica.NOME_PADRAO;

  /** Nome da clínica escolhido na aba "Personalização". */
  public static nome(): string {
    return Clinica.nomeAtual;
  }

  /** Chamado quando as configurações chegam ou mudam (ver VisualDaClinica). */
  public static definirNome(nome: string | null | undefined): void {
    Clinica.nomeAtual = nome?.trim() || Clinica.NOME_PADRAO;
  }

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
