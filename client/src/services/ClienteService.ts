import { ApiClient } from "./ApiClient";
import type { ClienteResumo, FichaDoCliente } from "./types";

export class ClienteService extends ApiClient {
  /** Clientes em ordem alfabética; `busca` filtra pelo nome ou telefone. */
  public listar(busca = ""): Promise<ClienteResumo[]> {
    const query = new URLSearchParams({ busca });
    return this.get<ClienteResumo[]>(`/clientes?${query.toString()}`);
  }

  /**
   * Ficha com todo o histórico; `telefone` só com os números. O `nome` diz qual pessoa do
   * telefone (um número pode ter várias: a mãe e a filha que ela agendou).
   */
  public ficha(telefone: string, nome: string): Promise<FichaDoCliente> {
    const query = new URLSearchParams({ nome });
    return this.get<FichaDoCliente>(`/clientes/${telefone}?${query.toString()}`);
  }
}
