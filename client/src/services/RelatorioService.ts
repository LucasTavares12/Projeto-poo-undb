import { ApiClient } from "./ApiClient";
import type { LucroMensal, RelatorioMensal } from "./types";
import { DataAgenda } from "../models/DataAgenda";

export class RelatorioService extends ApiClient {
  /** `mes` no formato "AAAA-MM"; `profissionalId` null = todos os profissionais juntos. */
  public mensal(mes: string, profissionalId: number | null = null): Promise<RelatorioMensal> {
    return this.get<RelatorioMensal>(`/relatorios/mensal?${this.parametros(mes, profissionalId)}`);
  }

  /**
   * Lucro do mês. `profissionalId` null = clínica inteira (só acesso total); com valor, o
   * daquele profissional. Conta de profissional recebe sempre o dela.
   */
  public lucro(mes: string, profissionalId: number | null): Promise<LucroMensal> {
    return this.get<LucroMensal>(`/relatorios/lucro?${this.parametros(mes, profissionalId)}`);
  }

  /** Informa (ou corrige) o gasto do mês e recebe o lucro recalculado. */
  public informarGasto(
    mes: string,
    profissionalId: number | null,
    valor: number
  ): Promise<LucroMensal> {
    return this.put<LucroMensal>(`/relatorios/gastos/${mes}`, { valor, profissionalId });
  }

  /** Apaga o gasto do mês (informado errado) e recebe o lucro, que volta a ficar pendente. */
  public apagarGasto(mes: string, profissionalId: number | null): Promise<LucroMensal> {
    const query = profissionalId === null ? "" : `?profissionalId=${profissionalId}`;
    return this.excluir<LucroMensal>(`/relatorios/gastos/${mes}${query}`);
  }

  private parametros(mes: string, profissionalId: number | null): string {
    const parametros = new URLSearchParams({ mes });
    if (profissionalId !== null) {
      parametros.set("profissionalId", String(profissionalId));
    }
    return parametros.toString();
  }

  /**
   * Soma dos atendimentos finalizados num dia. Vem do relatório do mês (e não dos cards do
   * Kanban) para continuar contando os finalizados que foram limpos do quadro.
   */
  public async faturadoNoDia(dia: DataAgenda): Promise<number> {
    const relatorio = await this.mensal(dia.getMes());
    return relatorio.faturamentoPorDia.find((item) => item.data === dia.toString())?.valor ?? 0;
  }
}
