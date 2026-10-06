import { ApiClient } from "./ApiClient";
import type { Tratamento } from "./types";

export interface DadosTratamento {
  nome: string;
  descricao: string;
  valor: number;
  duracaoMinutos: number;
  /** null = tratamento realizado por todos os profissionais. */
  profissionalId: number | null;
}

export class TratamentoService extends ApiClient {
  public listar(): Promise<Tratamento[]> {
    return this.get<Tratamento[]>("/tratamentos");
  }

  public criar(dados: DadosTratamento): Promise<Tratamento> {
    return this.post<Tratamento>("/tratamentos", dados);
  }

  public atualizar(id: number, dados: DadosTratamento): Promise<Tratamento> {
    return this.put<Tratamento>(`/tratamentos/${id}`, dados);
  }

  public remover(id: number): Promise<void> {
    return this.excluir(`/tratamentos/${id}`);
  }
}
