import type { UsuarioLogado } from "../services/types";

/**
 * O que o usuário logado pode ver e fazer no painel. Sem profissional vinculado, tem acesso
 * total à clínica; ligado a um profissional, só enxerga e altera o que é daquele profissional.
 * O servidor confere as mesmas regras: aqui elas só decidem o que aparece na tela.
 */
export class PerfilDeAcesso {
  // Áreas da clínica inteira: só para quem tem acesso total.
  private static readonly AREAS_DE_ACESSO_TOTAL = ["/admin/tratamentos", "/admin/configuracoes"];

  private readonly profissionalId: number | null;

  constructor(usuario: Pick<UsuarioLogado, "profissionalId">) {
    this.profissionalId = usuario.profissionalId;
  }

  public temAcessoTotal(): boolean {
    return this.profissionalId === null;
  }

  /** Profissional do usuário; null = acesso total. */
  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  /** true se o usuário pode abrir a página do painel (caminho da URL). */
  public podeAbrir(caminho: string): boolean {
    return (
      this.temAcessoTotal() ||
      !PerfilDeAcesso.AREAS_DE_ACESSO_TOTAL.some((area) => caminho.startsWith(area))
    );
  }

  /** true se o usuário pode alterar a agenda deste profissional (null = clínica inteira). */
  public podeGerenciar(profissionalId: number | null): boolean {
    return this.temAcessoTotal() || profissionalId === this.profissionalId;
  }

  /** Todos os profissionais para quem tem acesso total; senão, só o do próprio usuário. */
  public filtrarProfissionais<T extends { id: number }>(profissionais: T[]): T[] {
    return this.temAcessoTotal()
      ? profissionais
      : profissionais.filter((profissional) => profissional.id === this.profissionalId);
  }
}
