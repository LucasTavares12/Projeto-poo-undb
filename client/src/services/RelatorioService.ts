import { ApiClient } from "./ApiClient";
import type { RelatorioMensal } from "./types";
import { DataAgenda } from "../models/DataAgenda";

export class RelatorioService extends ApiClient {
  /** `mes` no formato "AAAA-MM"; `profissionalId` null = todos os profissionais juntos. */
  public mensal(mes: string, profissionalId: number | null = null): Promise<RelatorioMensal> {
    const parametros = new URLSearchParams({ mes });
    if (profissionalId !== null) {
      parametros.set("profissionalId", String(profissionalId));
    }
    return this.get<RelatorioMensal>(`/relatorios/mensal?${parametros.toString()}`);
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
