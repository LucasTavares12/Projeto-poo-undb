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
      valor MEDIUMTEXT NOT NULL
    )
  `;

  /**
   * Bancos criados quando o valor era TEXT (até 64 KB): a logo da clínica, em base64, pode
   * passar disso. Alterar para o mesmo tipo não muda nada, então pode rodar sempre.
   */
  private static readonly AMPLIAR_VALOR =
    "ALTER TABLE configuracoes MODIFY valor MEDIUMTEXT NOT NULL";

  private static readonly CHAVE_BOTAO_ENTRAR = "botao_entrar_visivel";
  private static readonly CHAVE_CADASTRO = "cadastro_liberado";
  private static readonly CHAVE_NOME_CLINICA = "nome_clinica";
  private static readonly CHAVE_COR_PRINCIPAL = "cor_principal";
  private static readonly CHAVE_COR_LATERAL = "cor_lateral";
  private static readonly CHAVE_LOGO = "logo";
  private static readonly CHAVE_ENDERECO = "endereco";
  private static readonly CHAVE_LINK_MAPA = "link_mapa";
  private static readonly CHAVE_INSTAGRAM = "instagram";
  private static readonly CHAVE_WHATSAPP = "whatsapp";
  /** Guardado como JSON: { dias: [{ diaSemana, abertura, fechamento }] }. */
  private static readonly CHAVE_HORARIO_FUNCIONAMENTO = "horario_funcionamento";
  /** Opção antiga que ligava "Entrar" e "Cadastrar" juntos: vale até as novas serem salvas. */
  private static readonly CHAVE_ACESSO_PUBLICO_ANTIGA = "acesso_publico_liberado";

  /** Opções que nunca foram salvas ficam com o valor padrão da classe. */
  public async carregar(): Promise<ConfiguracoesClinica> {
    await this.garantirEstrutura();
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

    this.carregarVisual(configuracoes, valores);
    return configuracoes;
  }

  /**
   * Nome, cores e logo. Um valor gravado que não passe mais na validação é ignorado (fica o
   * padrão), para uma configuração estragada nunca derrubar a página.
   */
  private carregarVisual(configuracoes: ConfiguracoesClinica, valores: Map<string, string>): void {
    const visual: [string, (valor: string) => void][] = [
      [ConfiguracaoRepository.CHAVE_NOME_CLINICA, (valor) => configuracoes.setNomeClinica(valor)],
      [ConfiguracaoRepository.CHAVE_COR_PRINCIPAL, (valor) => configuracoes.setCorPrincipal(valor)],
      [ConfiguracaoRepository.CHAVE_COR_LATERAL, (valor) => configuracoes.setCorLateral(valor)],
      [ConfiguracaoRepository.CHAVE_LOGO, (valor) => configuracoes.setLogo(valor)],
      [ConfiguracaoRepository.CHAVE_ENDERECO, (valor) => configuracoes.setEndereco(valor)],
      [ConfiguracaoRepository.CHAVE_LINK_MAPA, (valor) => configuracoes.setLinkMapa(valor)],
      [ConfiguracaoRepository.CHAVE_INSTAGRAM, (valor) => configuracoes.setInstagram(valor)],
      [ConfiguracaoRepository.CHAVE_WHATSAPP, (valor) => configuracoes.setWhatsapp(valor)],
      [
        ConfiguracaoRepository.CHAVE_HORARIO_FUNCIONAMENTO,
        (valor) => configuracoes.setHorarioFuncionamento(JSON.parse(valor)),
      ],
    ];
    for (const [chave, aplicar] of visual) {
      const valor = valores.get(chave);
      if (valor === undefined || valor === "") {
        continue;
      }
      try {
        aplicar(valor);
      } catch {
        // mantém o padrão
      }
    }
  }

  public async salvar(configuracoes: ConfiguracoesClinica): Promise<void> {
    await this.garantirEstrutura();
    // Cor e logo vazias ("") significam "padrão do sistema".
    const valores = [
      [ConfiguracaoRepository.CHAVE_BOTAO_ENTRAR, String(configuracoes.getBotaoEntrarVisivel())],
      [ConfiguracaoRepository.CHAVE_CADASTRO, String(configuracoes.getCadastroLiberado())],
      [ConfiguracaoRepository.CHAVE_NOME_CLINICA, configuracoes.getNomeClinica()],
      [ConfiguracaoRepository.CHAVE_COR_PRINCIPAL, configuracoes.getCorPrincipal() ?? ""],
      [ConfiguracaoRepository.CHAVE_COR_LATERAL, configuracoes.getCorLateral() ?? ""],
      [ConfiguracaoRepository.CHAVE_LOGO, configuracoes.getLogo() ?? ""],
      [ConfiguracaoRepository.CHAVE_ENDERECO, configuracoes.getEndereco() ?? ""],
      [ConfiguracaoRepository.CHAVE_LINK_MAPA, configuracoes.getLinkMapa() ?? ""],
      [ConfiguracaoRepository.CHAVE_INSTAGRAM, configuracoes.getInstagram() ?? ""],
      [ConfiguracaoRepository.CHAVE_WHATSAPP, configuracoes.getWhatsapp() ?? ""],
      [
        ConfiguracaoRepository.CHAVE_HORARIO_FUNCIONAMENTO,
        configuracoes.getHorarioFuncionamento()
          ? JSON.stringify(configuracoes.getHorarioFuncionamento())
          : "",
      ],
    ];
    await this.pool.query(
      "INSERT INTO configuracoes (chave, valor) VALUES ? ON DUPLICATE KEY UPDATE valor = VALUES(valor)",
      [valores]
    );
    // As opções novas já estão gravadas: a antiga não tem mais o que dizer.
    await this.pool.query("DELETE FROM configuracoes WHERE chave = ?", [
      ConfiguracaoRepository.CHAVE_ACESSO_PUBLICO_ANTIGA,
    ]);
  }

  private async garantirEstrutura(): Promise<void> {
    await this.garantirTabela(ConfiguracaoRepository.CRIAR_TABELA);
    // garantirTabela roda cada comando uma única vez por execução do servidor.
    await this.garantirTabela(ConfiguracaoRepository.AMPLIAR_VALOR);
  }
}
