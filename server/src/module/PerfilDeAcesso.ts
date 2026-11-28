import { ErroDeAcesso } from "../erros/ErroDeAcesso";

/**
 * O que uma conta do painel pode ver e alterar. Sem profissional vinculado, tem acesso total
 * à clínica; ligada a um profissional, só ao que é daquele profissional. Os serviços usam
 * esta classe para aplicar a regra em todo lugar do mesmo jeito.
 *
 * Um profissional pode também ser administrador da clínica (ex: o dono): continua vendo só
 * os próprios agendamentos, mas na gestão (cadastros, horários, folgas, relatórios...) age
 * como acesso total. Para essas áreas, use `naGestao()`.
 */
export class PerfilDeAcesso {
  /** Profissional da conta; null = acesso total. */
  private readonly profissionalId: number | null;
  /** Profissional que também administra a clínica. */
  private readonly administrador: boolean;

  constructor(profissionalId: number | null, administrador = false) {
    this.profissionalId = profissionalId;
    this.administrador = profissionalId !== null && administrador;
  }

  /** Pode entrar nas áreas de administração da clínica (acesso total ou profissional admin). */
  public administraClinica(): boolean {
    return this.temAcessoTotal() || this.administrador;
  }

  /**
   * O perfil a usar na gestão da clínica: o profissional administrador age como acesso
   * total; os demais continuam como estão. Agendamentos NÃO usam este perfil.
   */
  public naGestao(): PerfilDeAcesso {
    return this.administrador ? new PerfilDeAcesso(null) : this;
  }

  public temAcessoTotal(): boolean {
    return this.profissionalId === null;
  }

  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  /**
   * O profissional que a conta de fato consulta: com acesso total, o filtro pedido (null =
   * clínica inteira); ligada a um profissional, sempre o dela, qualquer que seja o filtro.
   */
  public aplicarFiltro(filtroProfissional: number | null): number | null {
    return this.temAcessoTotal() ? filtroProfissional : this.profissionalId;
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

  /** Exige que a conta administre a clínica (acesso total ou profissional administrador). */
  public exigirAdministracao(mensagem: string): void {
    if (!this.administraClinica()) {
      throw new ErroDeAcesso(mensagem);
    }
  }
}
