import { ConfiguracaoService } from "../services/ConfiguracaoService";
import type { Configuracoes } from "../services/types";

type Ouvinte = () => void;

/**
 * Configurações da clínica compartilhadas por todas as telas (uma única instância).
 * Carrega do servidor uma vez e, quando o admin salva algo (ex: na Personalização),
 * `publicar` avisa todas as telas inscritas: a barra lateral, o nome e as cores mudam na
 * hora, sem recarregar a página.
 */
export class ConfiguracoesCompartilhadas {
  private static readonly unica = new ConfiguracoesCompartilhadas(new ConfiguracaoService());

  private atuais: Configuracoes | null = null;
  private carregando: Promise<void> | null = null;
  private readonly ouvintes = new Set<Ouvinte>();
  private readonly servico: ConfiguracaoService;

  private constructor(servico: ConfiguracaoService) {
    this.servico = servico;
  }

  public static instancia(): ConfiguracoesCompartilhadas {
    return ConfiguracoesCompartilhadas.unica;
  }

  /** Configurações atuais; null enquanto carrega ou se o servidor não respondeu. */
  public readonly obter = (): Configuracoes | null => this.atuais;

  /** Inscreve uma tela para ser avisada de mudanças; devolve a função que cancela. */
  public readonly inscrever = (ouvinte: Ouvinte): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => {
      this.ouvintes.delete(ouvinte);
    };
  };

  /** Busca no servidor, se ainda não buscou (ou se a última tentativa falhou). */
  public carregar(): void {
    if (this.atuais || this.carregando) {
      return;
    }
    this.carregando = this.servico
      .obter()
      .then((resultado) => this.publicar(resultado))
      .catch(() => {
        // Sem resposta, cada tela usa o comportamento mais seguro (ex: esconder os botões).
        // Libera para tentar de novo na próxima tela que pedir.
        this.carregando = null;
      });
  }

  /** Depois de salvar no servidor: todas as telas passam a usar as configurações novas. */
  public publicar(configuracoes: Configuracoes): void {
    this.atuais = configuracoes;
    this.ouvintes.forEach((ouvinte) => ouvinte());
  }
}
