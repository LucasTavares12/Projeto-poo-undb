import { RelatorioMensal } from "../module/RelatorioMensal";
import { PerfilDeAcesso } from "../module/PerfilDeAcesso";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";
import { AgendamentoService } from "./AgendamentoService";

/** Monta os relatórios da aba "Relatórios" do painel a partir dos agendamentos. */
export class RelatorioService {
  private readonly agendamentoRepo = new AgendamentoRepository();
  private readonly agendamentoService = new AgendamentoService();

  /**
   * `filtroProfissional` null = todos os profissionais juntos. Conta ligada a um profissional
   * recebe sempre só o relatório dele, qualquer que seja o filtro pedido.
   */
  public async gerarMensal(
    mes: string,
    filtroProfissional: number | null,
    profissionalDoUsuario: number | null = null
  ): Promise<RelatorioMensal> {
    const perfil = new PerfilDeAcesso(profissionalDoUsuario);
    const profissionalId = perfil.temAcessoTotal() ? filtroProfissional : perfil.getProfissionalId();

    const { inicio, fim } = RelatorioMensal.periodo(mes);
    // O relatório conta os finalizados: finaliza antes os que ficaram esquecidos no Kanban.
    await this.agendamentoService.finalizarAtrasados();
    const agendamentos = await this.agendamentoRepo.listarPorPeriodo(inicio, fim);
    return new RelatorioMensal(mes, agendamentos, profissionalId);
  }
}
