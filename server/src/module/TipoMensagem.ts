/** Mensagens de WhatsApp que a clínica manda sobre um agendamento. */
export enum TipoMensagem {
  /** Lembrete do horário marcado (agendamentos ainda não atendidos). */
  LEMBRETE = "LEMBRETE",
  /** Agradecimento depois do atendimento (agendamentos finalizados). */
  AGRADECIMENTO = "AGRADECIMENTO",
}
