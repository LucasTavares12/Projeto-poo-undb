/**
 * Preferências gerais do sistema, ajustadas pelo admin na aba "Configurações".
 * Cada opção nova entra aqui como um atributo com valor padrão, getter e setter.
 */
export class ConfiguracoesClinica {
  /**
   * Quando ligado, a página de agendamento mostra os botões "Entrar" e "Cadastrar"
   * e qualquer pessoa pode criar uma conta. Desligado, os botões somem e novos
   * cadastros são recusados (o login continua pelo endereço /admin/login).
   */
  private acessoPublicoLiberado = true;

  public getAcessoPublicoLiberado(): boolean {
    return this.acessoPublicoLiberado;
  }

  public setAcessoPublicoLiberado(liberado: boolean): void {
    if (typeof liberado !== "boolean") {
      throw new Error("O valor de acessoPublicoLiberado deve ser verdadeiro ou falso.");
    }
    this.acessoPublicoLiberado = liberado;
  }

  public toJSON() {
    return {
      acessoPublicoLiberado: this.acessoPublicoLiberado,
    };
  }
}
