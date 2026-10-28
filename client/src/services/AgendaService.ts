import { ApiClient } from "./ApiClient";
import type { AgendaSemanal } from "./types";

export class AgendaService extends ApiClient {
  /** Agenda do profissional a partir de `inicio` ("YYYY-MM-DD"), por `dias` dias. */
  public semana(profissionalId: number, inicio: string, dias = 7): Promise<AgendaSemanal> {
    const query = new URLSearchParams({
      profissionalId: String(profissionalId),
      inicio,
      dias: String(dias),
    });
    return this.get<AgendaSemanal>(`/agenda?${query.toString()}`);
  }
}
