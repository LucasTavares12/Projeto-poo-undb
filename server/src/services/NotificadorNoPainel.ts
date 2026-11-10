import { Notificacao } from "../module/Notificacao";
import { NotificacaoRepository } from "../repositories/NotificacaoRepository";
import { Notificador } from "./Notificador";

/** Guarda o aviso para aparecer no sino do painel de quem pode vê-lo. */
export class NotificadorNoPainel implements Notificador {
  private readonly repositorio = new NotificacaoRepository();

  public async notificar(notificacao: Notificacao): Promise<void> {
    await this.repositorio.salvar(notificacao);
  }
}
