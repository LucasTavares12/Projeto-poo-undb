import { ApiClient } from "./ApiClient";
import { SessaoAdmin } from "./SessaoAdmin";

export class AutenticacaoService extends ApiClient {
  public async cadastrar(email: string, senha: string): Promise<void> {
    await this.post<{ id: number; email: string }>("/cadastro", { email, senha });
  }

  public async entrar(email: string, senha: string): Promise<void> {
    const { token } = await this.post<{ token: string }>("/login", { email, senha });
    SessaoAdmin.salvar(token);
  }

  public sair(): void {
    SessaoAdmin.encerrar();
  }
}
