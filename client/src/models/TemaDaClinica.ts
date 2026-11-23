import type { SugestaoDeCores } from "./PersonalizacaoDaClinica";

/**
 * Visual personalizado da clínica (aba "Personalização"). A partir de duas cores escolhidas
 * pelo admin — a principal (botões, destaques) e a da barra lateral — calcula as variações
 * (mais escura, mais clara, transparente, versão do tema escuro) e as aplica como variáveis
 * CSS `--tema-*` na página. O App.css já usa essas variáveis com as cores padrão do sistema
 * como valor de reserva; então, sem personalização, nada muda.
 */
export class TemaDaClinica {
  /** Cores padrão do sistema (as mesmas que estão no App.css). */
  public static readonly COR_PRINCIPAL_PADRAO = "#a05c68";
  public static readonly COR_LATERAL_PADRAO = "#5c3a47";

  /** Sugestões prontas na tela de personalização (principal + barra lateral). */
  public static readonly SUGESTOES: SugestaoDeCores[] = [
    { nome: "Vinho (padrão)", principal: "#a05c68", lateral: "#5c3a47" },
    { nome: "Rosa", principal: "#c2577a", lateral: "#4a2337" },
    { nome: "Lavanda", principal: "#7c5cbf", lateral: "#2f2547" },
    { nome: "Azul", principal: "#2f6fb0", lateral: "#1d2b45" },
    { nome: "Verde", principal: "#2f8a6b", lateral: "#1c3a31" },
    { nome: "Dourado", principal: "#b0813a", lateral: "#3d3022" },
    { nome: "Grafite", principal: "#4b5563", lateral: "#1f2328" },
  ];

  private static readonly FORMATO_COR = /^#[0-9a-f]{6}$/i;

  // Variáveis que dependem de cada cor (para limpar quando a cor volta ao padrão).
  private static readonly VARIAVEIS_PRINCIPAL = [
    "--tema-principal",
    "--tema-principal-forte",
    "--tema-principal-escuro",
    "--tema-principal-bg",
    "--tema-principal-sombra",
    "--tema-principal-logo",
    "--tema-principal-lucro",
    "--tema-principal-suave",
    "--tema-principal-borda",
    "--tema-fundo-cliente",
    "--tema-noturno",
    "--tema-noturno-forte",
    "--tema-noturno-bg",
    "--tema-grafico",
    "--tema-grafico-noturno",
    "--tema-destaque",
    "--tema-logo-sombra",
    "--tema-lucro-sombra",
  ];
  private static readonly VARIAVEIS_LATERAL = ["--tema-lateral", "--tema-lateral-escuro"];

  private readonly corPrincipal: string | null;
  private readonly corLateral: string | null;

  constructor(corPrincipal: string | null, corLateral: string | null) {
    this.corPrincipal = TemaDaClinica.ehCorValida(corPrincipal) ? corPrincipal.toLowerCase() : null;
    this.corLateral = TemaDaClinica.ehCorValida(corLateral) ? corLateral.toLowerCase() : null;
  }

  public static ehCorValida(cor: string | null | undefined): cor is string {
    return typeof cor === "string" && TemaDaClinica.FORMATO_COR.test(cor);
  }

  /** Código digitado pela pessoa, sempre começando com "#" (ex: "a05c68" → "#a05c68"). */
  public static comCerquilha(digitado: string): string {
    const limpo = digitado.trim();
    return limpo.startsWith("#") ? limpo : `#${limpo}`;
  }

  /**
   * Cor escolhida pronta para guardar: minúscula, e null quando é igual à padrão
   * (assim "padrão" continua acompanhando o sistema).
   */
  public static paraEscolha(cor: string | null, padrao: string): string | null {
    if (!TemaDaClinica.ehCorValida(cor)) {
      return null;
    }
    const normalizada = cor.toLowerCase();
    return normalizada === padrao ? null : normalizada;
  }

  /**
   * Cor clara demais para texto branco por cima (botões na cor principal, barra lateral).
   * Usa a luminância relativa do WCAG: acima de ~0,4 o branco perde contraste.
   */
  public static ehClaraDemais(cor: string): boolean {
    if (!TemaDaClinica.ehCorValida(cor)) {
      return false;
    }
    const [r, g, b] = TemaDaClinica.paraRgb(cor).map((canal) => {
      const c = canal / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
  }

  /** Cor da barra lateral em uso (a escolhida ou a padrão), para a barra do navegador no celular. */
  public corDaBarra(): string {
    return this.corLateral ?? TemaDaClinica.COR_LATERAL_PADRAO;
  }

  /** As variáveis CSS que este tema define (vazio = tudo padrão). */
  public variaveis(): Record<string, string> {
    const variaveis: Record<string, string> = {};
    const p = this.corPrincipal;
    if (p) {
      const forte = TemaDaClinica.misturar(p, "#000000", 0.14);
      const noturno = TemaDaClinica.misturar(p, "#ffffff", 0.35);
      Object.assign(variaveis, {
        "--tema-principal": p,
        "--tema-principal-forte": forte,
        "--tema-principal-escuro": TemaDaClinica.misturar(p, "#000000", 0.22),
        "--tema-principal-bg": TemaDaClinica.transparente(p, 0.1),
        "--tema-principal-sombra": TemaDaClinica.transparente(p, 0.3),
        "--tema-principal-logo": TemaDaClinica.misturar(p, "#ffffff", 0.3),
        "--tema-principal-lucro": TemaDaClinica.misturar(p, "#ffffff", 0.12),
        "--tema-principal-suave": TemaDaClinica.misturar(p, "#ffffff", 0.85),
        "--tema-principal-borda": TemaDaClinica.misturar(p, "#ffffff", 0.78),
        "--tema-fundo-cliente": TemaDaClinica.misturar(p, "#ffffff", 0.9),
        "--tema-noturno": noturno,
        "--tema-noturno-forte": TemaDaClinica.misturar(p, "#ffffff", 0.5),
        "--tema-noturno-bg": TemaDaClinica.transparente(noturno, 0.14),
        "--tema-grafico": p,
        "--tema-grafico-noturno": TemaDaClinica.misturar(p, "#ffffff", 0.25),
        "--tema-destaque": TemaDaClinica.misturar(p, "#ffffff", 0.45),
        "--tema-logo-sombra": TemaDaClinica.transparente(forte, 0.45),
        "--tema-lucro-sombra": TemaDaClinica.transparente(forte, 0.28),
      });
    }
    const l = this.corLateral;
    if (l) {
      variaveis["--tema-lateral"] = l;
      variaveis["--tema-lateral-escuro"] = TemaDaClinica.misturar(l, "#000000", 0.2);
    }
    return variaveis;
  }

  /** Aplica (ou limpa) as variáveis na raiz da página e a cor da barra do navegador. */
  public aplicar(raiz: HTMLElement = document.documentElement): void {
    const variaveis = this.variaveis();
    for (const nome of [...TemaDaClinica.VARIAVEIS_PRINCIPAL, ...TemaDaClinica.VARIAVEIS_LATERAL]) {
      if (variaveis[nome]) {
        raiz.style.setProperty(nome, variaveis[nome]);
      } else {
        raiz.style.removeProperty(nome);
      }
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", this.corDaBarra());
  }

  private static paraRgb(cor: string): [number, number, number] {
    const numero = parseInt(cor.slice(1), 16);
    return [(numero >> 16) & 255, (numero >> 8) & 255, numero & 255];
  }

  private static paraHex([r, g, b]: number[]): string {
    return `#${[r, g, b].map((canal) => Math.round(canal).toString(16).padStart(2, "0")).join("")}`;
  }

  /** `cor` puxada `quanto` (0 a 1) na direção de `alvo` (ex: branco clareia, preto escurece). */
  private static misturar(cor: string, alvo: string, quanto: number): string {
    const origem = TemaDaClinica.paraRgb(cor);
    const destino = TemaDaClinica.paraRgb(alvo);
    return TemaDaClinica.paraHex(origem.map((canal, i) => canal + (destino[i] - canal) * quanto));
  }

  private static transparente(cor: string, opacidade: number): string {
    const [r, g, b] = TemaDaClinica.paraRgb(cor);
    return `rgba(${r}, ${g}, ${b}, ${opacidade})`;
  }
}
