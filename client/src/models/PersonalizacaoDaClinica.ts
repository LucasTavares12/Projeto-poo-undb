import type { Configuracoes } from "../services/types";
import { TemaDaClinica } from "./TemaDaClinica";

/** Uma combinação pronta de cores (ver TemaDaClinica.SUGESTOES). */
export interface SugestaoDeCores {
  nome: string;
  principal: string;
  lateral: string;
}

/**
 * O que a aba "Personalização" edita: nome, cores e logo da clínica. Objeto imutável —
 * cada alteração devolve um novo (bom para o estado do React) — que sabe dizer o que mudou
 * em relação ao que está salvo, para enviar ao servidor só as opções alteradas.
 * Cor null = cor padrão do sistema; logo null = ícone padrão.
 */
export class PersonalizacaoDaClinica {
  public readonly nomeClinica: string;
  public readonly corPrincipal: string | null;
  public readonly corLateral: string | null;
  public readonly logo: string | null;

  constructor(
    nomeClinica: string,
    corPrincipal: string | null,
    corLateral: string | null,
    logo: string | null
  ) {
    this.nomeClinica = nomeClinica;
    this.corPrincipal = corPrincipal;
    this.corLateral = corLateral;
    this.logo = logo;
  }

  public static de(configuracoes: Configuracoes): PersonalizacaoDaClinica {
    return new PersonalizacaoDaClinica(
      configuracoes.nomeClinica,
      configuracoes.corPrincipal,
      configuracoes.corLateral,
      configuracoes.logo
    );
  }

  public comNome(nomeClinica: string): PersonalizacaoDaClinica {
    return new PersonalizacaoDaClinica(nomeClinica, this.corPrincipal, this.corLateral, this.logo);
  }

  /** Cor igual à padrão vira null (assim "padrão" continua acompanhando o sistema). */
  public comCorPrincipal(cor: string | null): PersonalizacaoDaClinica {
    const corPrincipal = TemaDaClinica.paraEscolha(cor, TemaDaClinica.COR_PRINCIPAL_PADRAO);
    return new PersonalizacaoDaClinica(this.nomeClinica, corPrincipal, this.corLateral, this.logo);
  }

  public comCorLateral(cor: string | null): PersonalizacaoDaClinica {
    const corLateral = TemaDaClinica.paraEscolha(cor, TemaDaClinica.COR_LATERAL_PADRAO);
    return new PersonalizacaoDaClinica(this.nomeClinica, this.corPrincipal, corLateral, this.logo);
  }

  public comSugestao(sugestao: SugestaoDeCores): PersonalizacaoDaClinica {
    return this.comCorPrincipal(sugestao.principal).comCorLateral(sugestao.lateral);
  }

  public comLogo(logo: string | null): PersonalizacaoDaClinica {
    return new PersonalizacaoDaClinica(this.nomeClinica, this.corPrincipal, this.corLateral, logo);
  }

  /** Nome como vai ser salvo (sem espaços nas pontas). */
  public nomeLimpo(): string {
    return this.nomeClinica.trim();
  }

  /** Cor principal em uso (a escolhida ou a padrão). */
  public corPrincipalEmUso(): string {
    return this.corPrincipal ?? TemaDaClinica.COR_PRINCIPAL_PADRAO;
  }

  /** Cor da barra lateral em uso (a escolhida ou a padrão). */
  public corLateralEmUso(): string {
    return this.corLateral ?? TemaDaClinica.COR_LATERAL_PADRAO;
  }

  public usaSugestao(sugestao: SugestaoDeCores): boolean {
    return (
      sugestao.principal === this.corPrincipalEmUso() && sugestao.lateral === this.corLateralEmUso()
    );
  }

  /**
   * Tema para a prévia: sempre com as cores explícitas (padrão inclusive), porque a página
   * em volta pode estar usando outras cores (as salvas).
   */
  public temaDaPrevia(): TemaDaClinica {
    return new TemaDaClinica(this.corPrincipalEmUso(), this.corLateralEmUso());
  }

  /** Só as opções diferentes de `salva`, prontas para enviar ao servidor. */
  public alteracoesDesde(salva: PersonalizacaoDaClinica): Partial<Configuracoes> {
    const alteracoes: Partial<Configuracoes> = {};
    if (this.nomeLimpo() !== salva.nomeClinica) alteracoes.nomeClinica = this.nomeLimpo();
    if (this.corPrincipal !== salva.corPrincipal) alteracoes.corPrincipal = this.corPrincipal;
    if (this.corLateral !== salva.corLateral) alteracoes.corLateral = this.corLateral;
    if (this.logo !== salva.logo) alteracoes.logo = this.logo;
    return alteracoes;
  }

  public foiAlteradaDesde(salva: PersonalizacaoDaClinica): boolean {
    return Object.keys(this.alteracoesDesde(salva)).length > 0;
  }
}
