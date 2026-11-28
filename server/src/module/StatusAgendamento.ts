export enum StatusAgendamento {
  AGENDADO = "AGENDADO",
  EM_ATENDIMENTO = "EM_ATENDIMENTO",
  FINALIZADO = "FINALIZADO",
  /** O cliente não veio (marcado pela equipe depois que o horário começou). */
  FALTOU = "FALTOU",
}
