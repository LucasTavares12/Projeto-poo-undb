import { PerfilDeAcesso } from "../module/PerfilDeAcesso";
import { NotificacaoRepository } from "../repositories/NotificacaoRepository";

/** O sino do painel: só os avisos que a conta ainda não fechou (os já fechados saem dele). */
export class NotificacaoService {
  public static readonly LIMITE_PADRAO = 20;
  /** Quantos avisos dá para fechar de uma vez (o painel nunca mostra mais que isso). */
  private static readonly MAXIMO_POR_VEZ = 100;

  private readonly repositorio = new NotificacaoRepository();

  public async listar(
    adminId: number,
    profissionalDoUsuario: number | null,
    limite: number = NotificacaoService.LIMITE_PADRAO
  ) {
    const perfil = new PerfilDeAcesso(profissionalDoUsuario);
    const profissional = perfil.getProfissionalId();
    const [notificacoes, naoLidas] = await Promise.all([
      this.repositorio.listarPendentes(profissional, adminId, Math.min(Math.max(limite, 1), 50)),
      this.repositorio.contarPendentes(profissional, adminId),
    ]);
    return {
      naoLidas,
      notificacoes: notificacoes
        // Mesma regra do filtro do banco, conferida também pela entidade.
        .filter((notificacao) => notificacao.podeSerVistaPor(perfil, adminId)),
    };
  }

  /** Fechou o modal ou o sino: estes avisos saem do sino da conta. */
  public async fechar(adminId: number, ids: unknown): Promise<void> {
    const validos = Array.isArray(ids)
      ? ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
      : [];
    await this.repositorio.fechar(adminId, validos.slice(0, NotificacaoService.MAXIMO_POR_VEZ));
  }
}
