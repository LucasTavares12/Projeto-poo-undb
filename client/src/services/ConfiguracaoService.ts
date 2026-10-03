import { ApiClient } from "./ApiClient";
import type { Configuracoes } from "./types";

export class ConfiguracaoService extends ApiClient {
  public obter(): Promise<Configuracoes> {
    return this.get<Configuracoes>("/configuracoes");
  }

  /** Envia só as opções que mudaram; as demais continuam como estão no servidor. */
  public atualizar(dados: Partial<Configuracoes>): Promise<Configuracoes> {
    return this.put<Configuracoes>("/configuracoes", dados);
  }
}
