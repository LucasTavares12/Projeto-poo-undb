import { ApiClient } from "./ApiClient";
import type { HorarioDisponivel } from "./types";

export interface DadosHorarioDisponivel {
  profissionalId: number;
  diaSemana: number;
  horaInicio: string;
}

export class HorarioDisponivelService extends ApiClient {
  public listarPorProfissional(profissionalId: number): Promise<HorarioDisponivel[]> {
    return this.get<HorarioDisponivel[]>(`/profissionais/${profissionalId}/horarios`);
  }

  public criar(dados: DadosHorarioDisponivel): Promise<HorarioDisponivel> {
    return this.post<HorarioDisponivel>("/horarios", dados);
  }

  public remover(id: number): Promise<void> {
    return this.excluir(`/horarios/${id}`);
  }
}
