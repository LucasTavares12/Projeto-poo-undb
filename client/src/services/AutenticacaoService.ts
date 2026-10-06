import { ApiClient } from "./ApiClient";
import { SessaoAdmin } from "./SessaoAdmin";
import type { UsuarioLogado } from "./types";

export class AutenticacaoService extends ApiClient {
  public async cadastrar(email: string, senha: string): Promise<void> {
    await this.post<{ id: number; email: string }>("/cadastro", { email, senha });
  }

  public async entrar(email: string, senha: string): Promise<void> {
    const { token } = await this.post<{ token: string }>("/login", { email, senha });
    SessaoAdmin.salvar(token);
  }

  /** Dados de quem está logado (inclusive o profissional vinculado, se houver). */
  public usuarioLogado(): Promise<UsuarioLogado> {
    return this.get<UsuarioLogado>("/sessao");
  }

  public sair(): void {
    SessaoAdmin.encerrar();
  }
}
