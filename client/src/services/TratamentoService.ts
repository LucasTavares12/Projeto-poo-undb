import { ApiClient } from "./ApiClient";
import type { Tratamento } from "./types";

export interface DadosTratamento {
  nome: string;
  descricao: string;
  valor: number;
  duracaoMinutos: number;
  /** null = tratamento realizado por todos os profissionais. */
  profissionalId: number | null;
  /** Valor no cartão de crédito; null = o mesmo valor das outras formas. */
  valorCartaoCredito: number | null;
  /** Foto que demonstra o tratamento (data URL); null = sem foto. */
  foto: string | null;
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

  /**
   * Nova ordem dos tratamentos de um profissional (null = os de todos): os ids na ordem em
   * que devem aparecer. Devolve o grupo já reordenado.
   */
  public reordenar(profissionalId: number | null, ids: number[]): Promise<Tratamento[]> {
    return this.put<Tratamento[]>("/tratamentos/ordem", { profissionalId, ids });
  }

  public remover(id: number): Promise<void> {
    return this.excluir(`/tratamentos/${id}`);
  }
}
