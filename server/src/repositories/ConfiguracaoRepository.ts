import { RowDataPacket } from "mysql2";
import { Repositorio } from "./Repositorio";
import { ConfiguracoesClinica } from "../module/ConfiguracoesClinica";

interface LinhaConfiguracao extends RowDataPacket {
  chave: string;
  valor: string;
}

/**
 * Guarda as configurações como pares chave/valor: uma opção nova não exige
 * mudar a tabela, só ler e gravar uma chave a mais aqui.
 */
export class ConfiguracaoRepository extends Repositorio {
  private static readonly CRIAR_TABELA = `
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave VARCHAR(100) PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `;

  private static readonly CHAVE_BOTAO_ENTRAR = "botao_entrar_visivel";
  private static readonly CHAVE_CADASTRO = "cadastro_liberado";
  /** Opção antiga que ligava "Entrar" e "Cadastrar" juntos: vale até as novas serem salvas. */
  private static readonly CHAVE_ACESSO_PUBLICO_ANTIGA = "acesso_publico_liberado";

  /** Opções que nunca foram salvas ficam com o valor padrão da classe. */
  public async carregar(): Promise<ConfiguracoesClinica> {
    await this.garantirTabela(ConfiguracaoRepository.CRIAR_TABELA);
    const [linhas] = await this.pool.query<LinhaConfiguracao[]>(
      "SELECT chave, valor FROM configuracoes"
    );
    const valores = new Map(linhas.map((linha) => [linha.chave, linha.valor]));

    const configuracoes = new ConfiguracoesClinica();
    const antiga = valores.get(ConfiguracaoRepository.CHAVE_ACESSO_PUBLICO_ANTIGA);
    const botaoEntrar = valores.get(ConfiguracaoRepository.CHAVE_BOTAO_ENTRAR) ?? antiga;
    const cadastro = valores.get(ConfiguracaoRepository.CHAVE_CADASTRO) ?? antiga;
    if (botaoEntrar !== undefined) {
      configuracoes.setBotaoEntrarVisivel(botaoEntrar === "true");
    }
    if (cadastro !== undefined) {
      configuracoes.setCadastroLiberado(cadastro === "true");
    }
    return configuracoes;
  }

  public async salvar(configuracoes: ConfiguracoesClinica): Promise<void> {
    await this.garantirTabela(ConfiguracaoRepository.CRIAR_TABELA);
    const valores = [
      [ConfiguracaoRepository.CHAVE_BOTAO_ENTRAR, String(configuracoes.getBotaoEntrarVisivel())],
      [ConfiguracaoRepository.CHAVE_CADASTRO, String(configuracoes.getCadastroLiberado())],
    ];
    await this.pool.query(
      "INSERT INTO configuracoes (chave, valor) VALUES ? ON DUPLICATE KEY UPDATE valor = VALUES(valor)",
      [valores]
    );
  }
}
