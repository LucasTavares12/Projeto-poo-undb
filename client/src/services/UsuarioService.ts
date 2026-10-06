import { ApiClient } from "./ApiClient";
import type { Usuario } from "./types";

/** Aba "Configurações" > "Usuários do sistema". */
export class UsuarioService extends ApiClient {
  public listar(): Promise<Usuario[]> {
    return this.get<Usuario[]>("/usuarios");
  }

  /** `profissionalId` null = conta com acesso total. */
  public criar(email: string, senha: string, profissionalId: number | null): Promise<Usuario> {
    return this.post<Usuario>("/usuarios", { email, senha, profissionalId });
  }

  /** Liga a conta a um profissional, ou desliga (null) devolvendo o acesso total. */
  public vincularProfissional(id: number, profissionalId: number | null): Promise<Usuario> {
    return this.put<Usuario>(`/usuarios/${id}/profissional`, { profissionalId });
  }

  public alterarEmail(id: number, email: string): Promise<Usuario> {
    return this.put<Usuario>(`/usuarios/${id}/email`, { email });
  }

  /** `senhaAtual` só é exigida quando o usuário troca a própria senha. */
  public async alterarSenha(id: number, senha: string, senhaAtual?: string): Promise<void> {
    await this.put<void>(`/usuarios/${id}/senha`, { senha, senhaAtual });
  }

  public remover(id: number): Promise<void> {
    return this.excluir(`/usuarios/${id}`);
  }
}
