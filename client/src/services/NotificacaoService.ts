import { ApiClient } from "./ApiClient";
import type { ResumoDeNotificacoes } from "./types";

export class NotificacaoService extends ApiClient {
  /** Avisos que a conta logada ainda não fechou (o que fica no sino). */
  public listar(): Promise<ResumoDeNotificacoes> {
    return this.get<ResumoDeNotificacoes>("/notificacoes");
  }

  /** Modal ou sino fechado: estes avisos saem do sino. */
  public fechar(ids: number[]): Promise<void> {
    return this.post<void>("/notificacoes/lidas", { ids });
  }
}
