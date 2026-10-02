const URL_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Classe base para os serviços de acesso à API. Cada serviço de recurso
 * (ProfissionalService, TratamentoService...) estende esta classe e ganha
 * os verbos HTTP já prontos, sem repetir a lógica de fetch/erro.
 */
export class ApiClient {
  protected async get<T>(caminho: string): Promise<T> {
    return this.requisitar<T>(caminho, { method: "GET" });
  }

  protected async post<T>(caminho: string, corpo: unknown): Promise<T> {
    return this.requisitar<T>(caminho, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
  }

  protected async put<T>(caminho: string, corpo: unknown): Promise<T> {
    return this.requisitar<T>(caminho, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
  }

  protected async patch<T>(caminho: string, corpo: unknown): Promise<T> {
    return this.requisitar<T>(caminho, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
  }

  protected async excluir(caminho: string): Promise<void> {
    await this.requisitar<void>(caminho, { method: "DELETE" });
  }

  private async requisitar<T>(caminho: string, opcoes: RequestInit): Promise<T> {
    const resposta = await fetch(`${URL_BASE}${caminho}`, opcoes);

    if (resposta.status === 204) {
      return undefined as T;
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao comunicar com o servidor.");
    }

    return dados as T;
  }
}
