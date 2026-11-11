import { ConfiguracoesClinica } from "../module/ConfiguracoesClinica";
import { ConfiguracaoRepository } from "../repositories/ConfiguracaoRepository";

export interface AlteracaoDeConfiguracoes {
  /** undefined = não mexe nessa opção. */
  botaoEntrarVisivel?: boolean;
  cadastroLiberado?: boolean;
}

/** Preferências gerais da clínica (aba "Configurações"). */
export class ConfiguracaoService {
  private readonly repositorio = new ConfiguracaoRepository();

  public obter(): Promise<ConfiguracoesClinica> {
    return this.repositorio.carregar();
  }

  /** Altera só as opções informadas; o resto continua como estava. */
  public async atualizar(alteracao: AlteracaoDeConfiguracoes): Promise<ConfiguracoesClinica> {
    const configuracoes = await this.repositorio.carregar();
    if (alteracao.botaoEntrarVisivel !== undefined) {
      configuracoes.setBotaoEntrarVisivel(alteracao.botaoEntrarVisivel);
    }
    if (alteracao.cadastroLiberado !== undefined) {
      configuracoes.setCadastroLiberado(alteracao.cadastroLiberado);
    }
    await this.repositorio.salvar(configuracoes);
    return configuracoes;
  }
}
