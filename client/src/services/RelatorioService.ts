import { ApiClient } from "./ApiClient";
import type { RelatorioMensal } from "./types";

export class RelatorioService extends ApiClient {
  /** `mes` no formato "AAAA-MM"; `profissionalId` null = todos os profissionais juntos. */
  public mensal(mes: string, profissionalId: number | null = null): Promise<RelatorioMensal> {
    const parametros = new URLSearchParams({ mes });
    if (profissionalId !== null) {
      parametros.set("profissionalId", String(profissionalId));
    }
    return this.get<RelatorioMensal>(`/relatorios/mensal?${parametros.toString()}`);
  }
}
