/**
 * Recado entre telas do painel: "os agendamentos mudaram, busque de novo". O sino dispara
 * quando chega notificação nova; o Kanban e a Agenda escutam e se atualizam sozinhos.
 */
export class AgendamentosAtualizados {
  private static readonly EVENTO = "agendamentos-atualizados";

  public static avisar(): void {
    window.dispatchEvent(new Event(AgendamentosAtualizados.EVENTO));
  }

  /** Devolve a função que para de escutar (para usar no retorno do useEffect). */
  public static escutar(aoAtualizar: () => void): () => void {
    window.addEventListener(AgendamentosAtualizados.EVENTO, aoAtualizar);
    return () => window.removeEventListener(AgendamentosAtualizados.EVENTO, aoAtualizar);
  }
}
