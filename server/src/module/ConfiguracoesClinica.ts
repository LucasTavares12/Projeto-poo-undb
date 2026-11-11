import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/**
 * Preferências gerais do sistema, ajustadas pelo admin na aba "Configurações".
 * Cada opção nova entra aqui como um atributo com valor padrão, getter e setter.
 */
export class ConfiguracoesClinica {
  /**
   * Mostra o botão "Entrar" na página de agendamento. Só esconde o botão: quem tem conta
   * sempre consegue entrar pelo endereço /admin/login.
   */
  private botaoEntrarVisivel = true;

  /**
   * Mostra o botão "Cadastrar" na página de agendamento e aceita contas novas.
   * Desligado, o botão some e o servidor recusa qualquer cadastro.
   */
  private cadastroLiberado = true;

  public getBotaoEntrarVisivel(): boolean {
    return this.botaoEntrarVisivel;
  }

  public setBotaoEntrarVisivel(visivel: boolean): void {
    this.botaoEntrarVisivel = ConfiguracoesClinica.lerLigado(visivel, "botaoEntrarVisivel");
  }

  public getCadastroLiberado(): boolean {
    return this.cadastroLiberado;
  }

  public setCadastroLiberado(liberado: boolean): void {
    this.cadastroLiberado = ConfiguracoesClinica.lerLigado(liberado, "cadastroLiberado");
  }

  private static lerLigado(valor: unknown, opcao: string): boolean {
    if (typeof valor !== "boolean") {
      throw new ErroDeValidacao(`O valor de ${opcao} deve ser verdadeiro ou falso.`);
    }
    return valor;
  }

  public toJSON() {
    return {
      botaoEntrarVisivel: this.botaoEntrarVisivel,
      cadastroLiberado: this.cadastroLiberado,
    };
  }
}
