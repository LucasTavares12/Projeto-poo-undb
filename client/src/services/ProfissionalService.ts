import { ApiClient } from "./ApiClient";
import type { Profissional } from "./types";

export type DadosProfissional = Omit<Profissional, "id">;

export class ProfissionalService extends ApiClient {
  public listar(): Promise<Profissional[]> {
    return this.get<Profissional[]>("/profissionais");
  }

  public criar(dados: DadosProfissional): Promise<Profissional> {
    return this.post<Profissional>("/profissionais", dados);
  }

  public atualizar(id: number, dados: DadosProfissional): Promise<Profissional> {
    return this.put<Profissional>(`/profissionais/${id}`, dados);
  }

  public remover(id: number): Promise<void> {
    return this.excluir(`/profissionais/${id}`);
  }
}
