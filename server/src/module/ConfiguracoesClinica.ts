import { ErroDeValidacao } from "../erros/ErroDeValidacao";
import { HorarioDeFuncionamento } from "./HorarioDeFuncionamento";
import { Telefone } from "./Telefone";

/** O que o admin pediu para mudar. undefined = não mexe nessa opção. */
export interface AlteracaoDeConfiguracoes {
  botaoEntrarVisivel?: boolean;
  cadastroLiberado?: boolean;
  nomeClinica?: string;
  /** null = volta para a cor padrão. */
  corPrincipal?: string | null;
  corLateral?: string | null;
  /** null = tira a logo (volta o ícone padrão). */
  logo?: string | null;
  /** Contatos mostrados na página do cliente. null ou "" = não mostra. */
  endereco?: string | null;
  linkMapa?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  /** `{ dias: [{ diaSemana, abertura, fechamento }] }`; null = sem horário definido. */
  horarioFuncionamento?: unknown;
}

/**
 * Preferências gerais do sistema, ajustadas pelo admin nas abas "Configurações" e
 * "Personalização". Cada opção nova entra aqui como um atributo com valor padrão, getter e setter.
 */
export class ConfiguracoesClinica {
  public static readonly NOME_PADRAO = "Clínica de Estética";
  private static readonly TAMANHO_MAXIMO_NOME = 60;
  private static readonly FORMATO_COR = /^#[0-9a-f]{6}$/;
  /** Só imagens comuns, já em base64 (o painel reduz a imagem antes de enviar). */
  private static readonly FORMATO_LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
  /** ~1,5 MB de texto: bem acima de uma logo reduzida, bem abaixo do limite da coluna. */
  private static readonly TAMANHO_MAXIMO_LOGO = 1_500_000;
  private static readonly TAMANHO_MAXIMO_ENDERECO = 200;
  private static readonly TAMANHO_MAXIMO_LINK = 500;
  /** Nome de usuário do Instagram: letras, números, ponto e sublinhado (até 30). */
  private static readonly FORMATO_INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

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

  /** Nome da clínica: barra lateral do painel, página de agendamento e mensagens. */
  private nomeClinica = ConfiguracoesClinica.NOME_PADRAO;

  /** Cor principal (botões, destaques). null = cor padrão do sistema. Formato "#rrggbb". */
  private corPrincipal: string | null = null;

  /** Cor da barra lateral do painel. null = cor padrão do sistema. Formato "#rrggbb". */
  private corLateral: string | null = null;

  /** Logo da clínica como imagem base64 (data URL). null = ícone padrão. */
  private logo: string | null = null;

  /** Endereço por extenso, mostrado na página do cliente (null = não mostra). */
  private endereco: string | null = null;

  /** Link do Google Maps (null = monta a busca pelo endereço, se houver). */
  private linkMapa: string | null = null;

  /** Usuário do Instagram, sem "@" (null = não mostra). */
  private instagram: string | null = null;

  /** WhatsApp da clínica, só os números com DDD (null = não mostra). */
  private whatsapp: string | null = null;

  /**
   * Dias e horários em que a clínica funciona. null = ainda não definido: nenhum limite na
   * grade de horários e a página do cliente não mostra "aberto/fechado".
   */
  private horarioFuncionamento: HorarioDeFuncionamento | null = null;

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

  public getNomeClinica(): string {
    return this.nomeClinica;
  }

  public setNomeClinica(nome: string): void {
    if (typeof nome !== "string") {
      throw new ErroDeValidacao("Informe o nome da clínica.");
    }
    const limpo = nome.trim().replace(/\s+/g, " ");
    if (!limpo) {
      throw new ErroDeValidacao("Informe o nome da clínica.");
    }
    if (limpo.length > ConfiguracoesClinica.TAMANHO_MAXIMO_NOME) {
      throw new ErroDeValidacao(
        `O nome da clínica pode ter até ${ConfiguracoesClinica.TAMANHO_MAXIMO_NOME} caracteres.`
      );
    }
    this.nomeClinica = limpo;
  }

  public getCorPrincipal(): string | null {
    return this.corPrincipal;
  }

  public setCorPrincipal(cor: string | null): void {
    this.corPrincipal = ConfiguracoesClinica.lerCor(cor, "principal");
  }

  public getCorLateral(): string | null {
    return this.corLateral;
  }

  public setCorLateral(cor: string | null): void {
    this.corLateral = ConfiguracoesClinica.lerCor(cor, "da barra lateral");
  }

  public getLogo(): string | null {
    return this.logo;
  }

  /** null tira a logo (volta o ícone padrão). */
  public setLogo(logo: string | null): void {
    if (logo === null || logo === "") {
      this.logo = null;
      return;
    }
    if (typeof logo !== "string" || !ConfiguracoesClinica.FORMATO_LOGO.test(logo)) {
      throw new ErroDeValidacao("A logo precisa ser uma imagem PNG, JPG ou WebP.");
    }
    if (logo.length > ConfiguracoesClinica.TAMANHO_MAXIMO_LOGO) {
      throw new ErroDeValidacao("A imagem da logo é grande demais. Use uma imagem menor.");
    }
    this.logo = logo;
  }

  public getEndereco(): string | null {
    return this.endereco;
  }

  public setEndereco(endereco: string | null): void {
    this.endereco = ConfiguracoesClinica.lerTextoOpcional(
      endereco,
      ConfiguracoesClinica.TAMANHO_MAXIMO_ENDERECO,
      "O endereço"
    );
  }

  public getLinkMapa(): string | null {
    return this.linkMapa;
  }

  /** Só links http(s): nada de "javascript:" escondido num botão da página. */
  public setLinkMapa(link: string | null): void {
    const texto = ConfiguracoesClinica.lerTextoOpcional(
      link,
      ConfiguracoesClinica.TAMANHO_MAXIMO_LINK,
      "O link do mapa"
    );
    if (texto !== null) {
      let endereco: URL;
      try {
        endereco = new URL(texto);
      } catch {
        throw new ErroDeValidacao("O link do mapa precisa ser um endereço completo (https://...).");
      }
      if (endereco.protocol !== "https:" && endereco.protocol !== "http:") {
        throw new ErroDeValidacao("O link do mapa precisa começar com https://.");
      }
    }
    this.linkMapa = texto;
  }

  public getInstagram(): string | null {
    return this.instagram;
  }

  /** Aceita "@clinica", "clinica" ou o link do perfil; guarda só o nome de usuário. */
  public setInstagram(instagram: string | null): void {
    const texto = ConfiguracoesClinica.lerTextoOpcional(instagram, 200, "O Instagram");
    if (texto === null) {
      this.instagram = null;
      return;
    }
    const usuario = texto
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/[/?#].*$/, "");
    if (!ConfiguracoesClinica.FORMATO_INSTAGRAM.test(usuario)) {
      throw new ErroDeValidacao('Instagram inválido. Use o nome de usuário, ex.: "@suaclinica".');
    }
    this.instagram = usuario;
  }

  public getWhatsapp(): string | null {
    return this.whatsapp;
  }

  /** Telefone com DDD (10 ou 11 dígitos); guarda só os números. */
  public setWhatsapp(whatsapp: string | null): void {
    const texto = ConfiguracoesClinica.lerTextoOpcional(whatsapp, 30, "O WhatsApp");
    if (texto === null) {
      this.whatsapp = null;
      return;
    }
    if (!Telefone.ehValido(texto)) {
      throw new ErroDeValidacao("WhatsApp inválido: informe o DDD e o número.");
    }
    this.whatsapp = new Telefone(texto).getDigitos();
  }

  public getHorarioFuncionamento(): HorarioDeFuncionamento | null {
    return this.horarioFuncionamento;
  }

  /** null tira o horário definido (sem limite na grade). */
  public setHorarioFuncionamento(valor: unknown): void {
    this.horarioFuncionamento =
      valor === null || valor === "" ? null : HorarioDeFuncionamento.ler(valor);
  }

  /** Texto opcional: espaços nas pontas saem; vazio = null. */
  private static lerTextoOpcional(valor: unknown, maximo: number, campo: string): string | null {
    if (valor === null || valor === undefined) {
      return null;
    }
    if (typeof valor !== "string") {
      throw new ErroDeValidacao(`${campo} precisa ser um texto.`);
    }
    const limpo = valor.trim();
    if (limpo.length > maximo) {
      throw new ErroDeValidacao(`${campo} pode ter até ${maximo} caracteres.`);
    }
    return limpo === "" ? null : limpo;
  }

  /**
   * Aplica só as opções informadas (cada uma passa pela validação do seu setter).
   * Lança erro se nenhuma opção conhecida vier na alteração.
   */
  public aplicar(alteracao: AlteracaoDeConfiguracoes): void {
    const setters: { [C in keyof Required<AlteracaoDeConfiguracoes>]: (valor: never) => void } = {
      botaoEntrarVisivel: (valor: boolean) => this.setBotaoEntrarVisivel(valor),
      cadastroLiberado: (valor: boolean) => this.setCadastroLiberado(valor),
      nomeClinica: (valor: string) => this.setNomeClinica(valor),
      corPrincipal: (valor: string | null) => this.setCorPrincipal(valor),
      corLateral: (valor: string | null) => this.setCorLateral(valor),
      logo: (valor: string | null) => this.setLogo(valor),
      endereco: (valor: string | null) => this.setEndereco(valor),
      linkMapa: (valor: string | null) => this.setLinkMapa(valor),
      instagram: (valor: string | null) => this.setInstagram(valor),
      whatsapp: (valor: string | null) => this.setWhatsapp(valor),
      horarioFuncionamento: (valor: unknown) => this.setHorarioFuncionamento(valor),
    };
    const informadas = (Object.keys(setters) as (keyof AlteracaoDeConfiguracoes)[]).filter(
      (opcao) => alteracao[opcao] !== undefined
    );
    if (informadas.length === 0) {
      throw new ErroDeValidacao("Nenhuma configuração conhecida foi enviada.");
    }
    for (const opcao of informadas) {
      setters[opcao](alteracao[opcao] as never);
    }
  }

  /** Volta nome, cores e logo para o visual padrão do sistema. */
  public restaurarVisualPadrao(): void {
    this.nomeClinica = ConfiguracoesClinica.NOME_PADRAO;
    this.corPrincipal = null;
    this.corLateral = null;
    this.logo = null;
  }

  private static lerLigado(valor: unknown, opcao: string): boolean {
    if (typeof valor !== "boolean") {
      throw new ErroDeValidacao(`O valor de ${opcao} deve ser verdadeiro ou falso.`);
    }
    return valor;
  }

  /** "#RRGGBB" (qualquer caixa) vira "#rrggbb"; null/vazio = cor padrão. */
  private static lerCor(valor: unknown, qual: string): string | null {
    if (valor === null || valor === "") {
      return null;
    }
    const cor = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    if (!ConfiguracoesClinica.FORMATO_COR.test(cor)) {
      throw new ErroDeValidacao(`A cor ${qual} precisa estar no formato #rrggbb.`);
    }
    return cor;
  }

  public toJSON() {
    return {
      botaoEntrarVisivel: this.botaoEntrarVisivel,
      cadastroLiberado: this.cadastroLiberado,
      nomeClinica: this.nomeClinica,
      corPrincipal: this.corPrincipal,
      corLateral: this.corLateral,
      logo: this.logo,
      endereco: this.endereco,
      linkMapa: this.linkMapa,
      instagram: this.instagram,
      whatsapp: this.whatsapp,
      horarioFuncionamento: this.horarioFuncionamento,
    };
  }
}
