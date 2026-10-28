import { ErroDeAcesso } from "../erros/ErroDeAcesso";

/**
 * O que uma conta do painel pode ver e alterar. Sem profissional vinculado, tem acesso total
 * à clínica; ligada a um profissional, só ao que é daquele profissional. Os serviços usam
 * esta classe para aplicar a regra em todo lugar do mesmo jeito.
 */
export class PerfilDeAcesso {
  /** Profissional da conta; null = acesso total. */
  private readonly profissionalId: number | null;

  constructor(profissionalId: number | null) {
    this.profissionalId = profissionalId;
  }

  public temAcessoTotal(): boolean {
    return this.profissionalId === null;
  }

  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  /**
   * true se a conta pode mexer nas coisas deste profissional. `profissionalId` null = algo da
   * clínica inteira (ex: feriado), que só quem tem acesso total pode alterar.
   */
  public podeGerenciar(profissionalId: number | null): boolean {
    return this.temAcessoTotal() || profissionalId === this.profissionalId;
  }

  /** Lança `ErroDeAcesso` com a mensagem se a conta não puder mexer neste profissional. */
  public exigir(profissionalId: number | null, mensagem: string): void {
    if (!this.podeGerenciar(profissionalId)) {
      throw new ErroDeAcesso(mensagem);
    }
  }

  /** Só exige acesso total (áreas da clínica inteira). */
  public exigirAcessoTotal(mensagem: string): void {
    if (!this.temAcessoTotal()) {
      throw new ErroDeAcesso(mensagem);
    }
  }
}
