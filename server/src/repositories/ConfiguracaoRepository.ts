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

  private static readonly CHAVE_ACESSO_PUBLICO = "acesso_publico_liberado";

  /** Opções que nunca foram salvas ficam com o valor padrão da classe. */
  public async carregar(): Promise<ConfiguracoesClinica> {
    await this.garantirTabela(ConfiguracaoRepository.CRIAR_TABELA);
    const [linhas] = await this.pool.query<LinhaConfiguracao[]>(
      "SELECT chave, valor FROM configuracoes"
    );
    const valores = new Map(linhas.map((linha) => [linha.chave, linha.valor]));

    const configuracoes = new ConfiguracoesClinica();
    const acessoPublico = valores.get(ConfiguracaoRepository.CHAVE_ACESSO_PUBLICO);
    if (acessoPublico !== undefined) {
      configuracoes.setAcessoPublicoLiberado(acessoPublico === "true");
    }
    return configuracoes;
  }

  public async salvar(configuracoes: ConfiguracoesClinica): Promise<void> {
    await this.garantirTabela(ConfiguracaoRepository.CRIAR_TABELA);
    const valores = [
      [
        ConfiguracaoRepository.CHAVE_ACESSO_PUBLICO,
        String(configuracoes.getAcessoPublicoLiberado()),
      ],
    ];
    await this.pool.query(
      "INSERT INTO configuracoes (chave, valor) VALUES ? ON DUPLICATE KEY UPDATE valor = VALUES(valor)",
      [valores]
    );
  }
}
