import type { UsuarioLogado } from "../services/types";

/**
 * O que o usuário logado pode ver e fazer no painel. Sem profissional vinculado, tem acesso
 * total à clínica; ligado a um profissional, só enxerga e altera o que é daquele profissional.
 *
 * Um profissional pode também ser administrador da clínica (ex: o dono): continua vendo só os
 * próprios agendamentos (Kanban, agenda, clientes, avisos), mas na gestão (tratamentos,
 * profissionais, horários, folgas, relatórios, configurações e personalização) age como
 * acesso total — para essas telas, use `naGestao()`.
 *
 * O servidor confere as mesmas regras: aqui elas só decidem o que aparece na tela.
 */
export class PerfilDeAcesso {
  // Áreas da clínica inteira: só para quem administra a clínica.
  private static readonly AREAS_DE_ADMINISTRACAO = [
    "/admin/tratamentos",
    "/admin/configuracoes",
    "/admin/personalizacao",
  ];

  private readonly profissionalId: number | null;
  private readonly administrador: boolean;

  constructor(usuario: Pick<UsuarioLogado, "profissionalId"> & { administrador?: boolean }) {
    this.profissionalId = usuario.profissionalId;
    this.administrador = usuario.profissionalId !== null && usuario.administrador === true;
  }

  /** Vê os agendamentos de todos os profissionais (conta sem profissional). */
  public temAcessoTotal(): boolean {
    return this.profissionalId === null;
  }

  /** Pode entrar nas áreas de administração (acesso total ou profissional administrador). */
  public administraClinica(): boolean {
    return this.temAcessoTotal() || this.administrador;
  }

  /** Profissional que também administra a clínica. */
  public ehProfissionalAdministrador(): boolean {
    return this.administrador;
  }

  /**
   * O perfil a usar nas telas de gestão: o profissional administrador age como acesso total.
   * As telas de agendamentos NÃO usam este perfil.
   */
  public naGestao(): PerfilDeAcesso {
    return this.administrador ? new PerfilDeAcesso({ profissionalId: null }) : this;
  }

  /** Profissional do usuário; null = acesso total. */
  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  /** true se o usuário pode abrir a página do painel (caminho da URL). */
  public podeAbrir(caminho: string): boolean {
    return (
      this.administraClinica() ||
      !PerfilDeAcesso.AREAS_DE_ADMINISTRACAO.some((area) => caminho.startsWith(area))
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

  /**
   * true se `usuario` é a única conta que administra a clínica (acesso total ou profissional
   * administrador): ela não pode ser excluída, senão ninguém mais administraria.
   */
  public static ehUnicoAdministrador<T extends Pick<UsuarioLogado, "profissionalId" | "administrador">>(
    usuario: T,
    usuarios: T[]
  ): boolean {
    const administra = (conta: T) => new PerfilDeAcesso(conta).administraClinica();
    return administra(usuario) && usuarios.filter(administra).length <= 1;
  }

  /** Como o papel do usuário aparece no rodapé da barra lateral. */
  public descreverPapel(profissionalNome: string | null): string {
    if (this.temAcessoTotal()) {
      return "Administrador";
    }
    return this.administrador ? `${profissionalNome ?? "Profissional"} · Admin` : profissionalNome ?? "";
  }
}
