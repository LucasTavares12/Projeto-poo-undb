import { ApiClient } from "./ApiClient";
import type { ClienteResumo, FichaDoCliente } from "./types";

export class ClienteService extends ApiClient {
  /** Clientes em ordem alfabética; `busca` filtra pelo nome ou telefone. */
  public listar(busca = ""): Promise<ClienteResumo[]> {
    const query = new URLSearchParams({ busca });
    return this.get<ClienteResumo[]>(`/clientes?${query.toString()}`);
  }

  /** Ficha com todo o histórico; `telefone` só com os números. */
  public ficha(telefone: string): Promise<FichaDoCliente> {
    return this.get<FichaDoCliente>(`/clientes/${telefone}`);
  }
}
