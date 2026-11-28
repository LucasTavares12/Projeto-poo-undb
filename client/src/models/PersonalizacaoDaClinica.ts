import type { Configuracoes } from "../services/types";
import { TemaDaClinica } from "./TemaDaClinica";

/** Uma combinação pronta de cores (ver TemaDaClinica.SUGESTOES). */
export interface SugestaoDeCores {
  nome: string;
  principal: string;
  lateral: string;
}

/** Campos da aba "Personalização": visual (nome, cores, logo) e contatos da clínica. */
type DadosDaPersonalizacao = Pick<
  Configuracoes,
  "nomeClinica" | "corPrincipal" | "corLateral" | "logo" | "endereco" | "linkMapa" | "instagram" | "whatsapp"
>;

/** Campos de texto livre dos contatos (vazio = não mostra). */
export type CampoDeContato = "endereco" | "linkMapa" | "instagram" | "whatsapp";

/**
 * O que a aba "Personalização" edita: nome, cores, logo e contatos da clínica. Objeto
 * imutável — cada alteração devolve um novo (bom para o estado do React) — que sabe dizer o
 * que mudou em relação ao que está salvo, para enviar ao servidor só as opções alteradas.
 * Cor null = cor padrão do sistema; logo null = ícone padrão; contato null = não mostra.
 */
export class PersonalizacaoDaClinica {
  private static readonly CAMPOS: (keyof DadosDaPersonalizacao)[] = [
    "nomeClinica",
    "corPrincipal",
    "corLateral",
    "logo",
    "endereco",
    "linkMapa",
    "instagram",
    "whatsapp",
  ];

  private readonly dados: DadosDaPersonalizacao;

  constructor(dados: DadosDaPersonalizacao) {
    this.dados = { ...dados };
  }

  public static de(configuracoes: Configuracoes): PersonalizacaoDaClinica {
    const { nomeClinica, corPrincipal, corLateral, logo, endereco, linkMapa, instagram, whatsapp } =
      configuracoes;
    return new PersonalizacaoDaClinica({
      nomeClinica,
      corPrincipal,
      corLateral,
      logo,
      endereco,
      linkMapa,
      instagram,
      whatsapp,
    });
  }

  private com(mudanca: Partial<DadosDaPersonalizacao>): PersonalizacaoDaClinica {
    return new PersonalizacaoDaClinica({ ...this.dados, ...mudanca });
  }

  public get nomeClinica(): string {
    return this.dados.nomeClinica;
  }

  public get corPrincipal(): string | null {
    return this.dados.corPrincipal;
  }

  public get corLateral(): string | null {
    return this.dados.corLateral;
  }

  public get logo(): string | null {
    return this.dados.logo;
  }

  /** Texto do campo de contato como a pessoa digitou ("" quando vazio). */
  public contato(campo: CampoDeContato): string {
    return this.dados[campo] ?? "";
  }

  public comNome(nomeClinica: string): PersonalizacaoDaClinica {
    return this.com({ nomeClinica });
  }

  /** Cor igual à padrão vira null (assim "padrão" continua acompanhando o sistema). */
  public comCorPrincipal(cor: string | null): PersonalizacaoDaClinica {
    return this.com({ corPrincipal: TemaDaClinica.paraEscolha(cor, TemaDaClinica.COR_PRINCIPAL_PADRAO) });
  }

  public comCorLateral(cor: string | null): PersonalizacaoDaClinica {
    return this.com({ corLateral: TemaDaClinica.paraEscolha(cor, TemaDaClinica.COR_LATERAL_PADRAO) });
  }

  public comSugestao(sugestao: SugestaoDeCores): PersonalizacaoDaClinica {
    return this.comCorPrincipal(sugestao.principal).comCorLateral(sugestao.lateral);
  }

  public comLogo(logo: string | null): PersonalizacaoDaClinica {
    return this.com({ logo });
  }

  /** Vazio = tira o contato. */
  public comContato(campo: CampoDeContato, valor: string): PersonalizacaoDaClinica {
    return this.com({ [campo]: valor === "" ? null : valor });
  }

  /** Nome como vai ser salvo (sem espaços nas pontas). */
  public nomeLimpo(): string {
    return this.dados.nomeClinica.trim();
  }

  /** Cor principal em uso (a escolhida ou a padrão). */
  public corPrincipalEmUso(): string {
    return this.dados.corPrincipal ?? TemaDaClinica.COR_PRINCIPAL_PADRAO;
  }

  /** Cor da barra lateral em uso (a escolhida ou a padrão). */
  public corLateralEmUso(): string {
    return this.dados.corLateral ?? TemaDaClinica.COR_LATERAL_PADRAO;
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

  /** O valor de cada campo como vai para o servidor (textos sem espaços nas pontas). */
  private paraEnvio(): DadosDaPersonalizacao {
    const limpo = (texto: string | null) => (texto?.trim() ? texto.trim() : null);
    return {
      ...this.dados,
      nomeClinica: this.nomeLimpo(),
      endereco: limpo(this.dados.endereco),
      linkMapa: limpo(this.dados.linkMapa),
      instagram: limpo(this.dados.instagram),
      whatsapp: limpo(this.dados.whatsapp),
    };
  }

  /** Só as opções diferentes de `salva`, prontas para enviar ao servidor. */
  public alteracoesDesde(salva: PersonalizacaoDaClinica): Partial<Configuracoes> {
    const atual = this.paraEnvio();
    const alteracoes: Partial<Record<keyof DadosDaPersonalizacao, string | null>> = {};
    for (const campo of PersonalizacaoDaClinica.CAMPOS) {
      if (atual[campo] !== salva.dados[campo]) {
        alteracoes[campo] = atual[campo];
      }
    }
    return alteracoes as Partial<Configuracoes>;
  }

  public foiAlteradaDesde(salva: PersonalizacaoDaClinica): boolean {
    return Object.keys(this.alteracoesDesde(salva)).length > 0;
  }
}
