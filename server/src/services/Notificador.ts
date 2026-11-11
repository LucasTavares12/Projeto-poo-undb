import { Notificacao } from "../module/Notificacao";

/**
 * Quem leva os avisos de agendamento até a equipe. O serviço de agendamentos só chama
 * `notificar` e não sabe como o aviso chega: hoje é pelo sino do painel
 * (`NotificadorNoPainel`); outro canal (e-mail, WhatsApp...) seria outra implementação.
 */
export interface Notificador {
  notificar(notificacao: Notificacao): Promise<void>;
}
