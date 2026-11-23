import { ConfiguracoesClinica } from "../module/ConfiguracoesClinica";
import type { AlteracaoDeConfiguracoes } from "../module/ConfiguracoesClinica";
import { ConfiguracaoRepository } from "../repositories/ConfiguracaoRepository";

export type { AlteracaoDeConfiguracoes };

/** Preferências gerais da clínica (abas "Configurações" e "Personalização"). */
export class ConfiguracaoService {
  private readonly repositorio = new ConfiguracaoRepository();

  public obter(): Promise<ConfiguracoesClinica> {
    return this.repositorio.carregar();
  }

  /** Altera só as opções informadas; o resto continua como estava. */
  public async atualizar(alteracao: AlteracaoDeConfiguracoes): Promise<ConfiguracoesClinica> {
    const configuracoes = await this.repositorio.carregar();
    configuracoes.aplicar(alteracao);
    await this.repositorio.salvar(configuracoes);
    return configuracoes;
  }

  /** Volta nome, cores e logo para o visual padrão (as outras opções não mudam). */
  public async restaurarVisualPadrao(): Promise<ConfiguracoesClinica> {
    const configuracoes = await this.repositorio.carregar();
    configuracoes.restaurarVisualPadrao();
    await this.repositorio.salvar(configuracoes);
    return configuracoes;
  }
}
