import { RelatorioMensal } from "../module/RelatorioMensal";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";

/** Monta os relatórios da aba "Relatórios" do painel a partir dos agendamentos. */
export class RelatorioService {
  private readonly agendamentoRepo = new AgendamentoRepository();

  /** `profissionalId` null = todos os profissionais juntos. */
  public async gerarMensal(mes: string, profissionalId: number | null): Promise<RelatorioMensal> {
    const { inicio, fim } = RelatorioMensal.periodo(mes);
    const agendamentos = await this.agendamentoRepo.listarPorPeriodo(inicio, fim);
    return new RelatorioMensal(mes, agendamentos, profissionalId);
  }
}
