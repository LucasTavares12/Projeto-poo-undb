import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Administrador } from "../module/Administrador";
import { AdministradorRepository } from "../repositories/AdministradorRepository";
import { ConfiguracaoRepository } from "../repositories/ConfiguracaoRepository";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { ErroAutenticacao } from "./ErroAutenticacao";

interface ConteudoToken {
  adminId: number;
  email: string;
  expiraEm: number; // timestamp em milissegundos
}

/**
 * Cadastro e login dos administradores da clínica. As contas ficam na
 * tabela "administradores" e o login devolve um token assinado com HMAC:
 * o servidor não precisa guardar sessão, só conferir a assinatura e a
 * validade do token em cada requisição.
 */
export class AutenticacaoService {
  private static readonly DURACAO_TOKEN_MS = 8 * 60 * 60 * 1000; // 8 horas

  private readonly repositorio = new AdministradorRepository();
  private readonly configuracaoRepo = new ConfiguracaoRepository();
  private readonly profissionalRepo = new ProfissionalRepository();
  private readonly segredo: string;

  constructor() {
    // Sem segredo configurado, gera um a cada inicialização (os logins expiram ao reiniciar).
    this.segredo = process.env.ADMIN_TOKEN_SEGREDO || randomBytes(32).toString("hex");
  }

  public async cadastrar(email: string, senha: string): Promise<Administrador> {
    const configuracoes = await this.configuracaoRepo.carregar();
    if (!configuracoes.getAcessoPublicoLiberado()) {
      throw new ErroAutenticacao("O cadastro de novas contas está desativado.", 403);
    }

    const novo = await Administrador.comSenha(email, senha);

    if (await this.repositorio.buscarPorEmail(novo.getEmail())) {
      throw new ErroAutenticacao("Já existe uma conta com este e-mail.", 409);
    }

    return this.repositorio.salvar(novo);
  }

  /** Confere e-mail e senha e, se estiverem corretos, devolve um token novo. */
  public async entrar(email: string, senha: string): Promise<string> {
    const administrador = await this.repositorio.buscarPorEmail(String(email ?? ""));

    // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails têm conta.
    if (!administrador || !(await administrador.senhaConfere(senha))) {
      throw new ErroAutenticacao("E-mail ou senha inválidos.", 401);
    }

    return this.gerarToken({
      adminId: administrador.getId() as number,
      email: administrador.getEmail(),
      expiraEm: Date.now() + AutenticacaoService.DURACAO_TOKEN_MS,
    });
  }

  /**
   * Confere o token de uma requisição do painel e devolve a conta logada, ou null se o
   * token for inválido, tiver expirado ou a conta tiver sido excluída. A conta vem do banco
   * a cada requisição, então mudanças de vínculo com profissional valem na hora.
   */
  public async usuarioDaSessao(token: string): Promise<Administrador | null> {
    const conteudo = this.lerToken(token);
    return conteudo ? this.repositorio.buscarPorId(conteudo.adminId) : null;
  }

  /** Quem está logado, para o painel decidir o que mostrar (menu, filtros, etc.). */
  public async dadosDaSessao(adminId: number) {
    const usuario = await this.repositorio.buscarPorId(adminId);
    if (!usuario) {
      throw new ErroAutenticacao("Faça login como administrador para continuar.", 401);
    }
    const profissionalId = usuario.getProfissionalId();
    const profissional =
      profissionalId === null ? null : await this.profissionalRepo.buscarPorId(profissionalId);
    return {
      id: usuario.getId(),
      email: usuario.getEmail(),
      profissionalId,
      profissionalNome: profissional?.getNome() ?? null,
    };
  }

  /** Conteúdo do token, se ele foi emitido por este servidor e ainda não expirou. */
  private lerToken(token: string): ConteudoToken | null {
    const [conteudoCodificado, assinatura] = token.split(".");
    if (!conteudoCodificado || !assinatura) {
      return null;
    }

    const assinaturaRecebida = Buffer.from(assinatura);
    const assinaturaEsperada = Buffer.from(this.assinar(conteudoCodificado));
    if (
      assinaturaRecebida.length !== assinaturaEsperada.length ||
      !timingSafeEqual(assinaturaRecebida, assinaturaEsperada)
    ) {
      return null;
    }

    try {
      const conteudo = JSON.parse(
        Buffer.from(conteudoCodificado, "base64url").toString("utf8")
      ) as ConteudoToken;
      const valido =
        typeof conteudo.adminId === "number" &&
        typeof conteudo.expiraEm === "number" &&
        conteudo.expiraEm > Date.now();
      return valido ? conteudo : null;
    } catch {
      return null;
    }
  }

  private gerarToken(conteudo: ConteudoToken): string {
    const conteudoCodificado = Buffer.from(JSON.stringify(conteudo)).toString("base64url");
    return `${conteudoCodificado}.${this.assinar(conteudoCodificado)}`;
  }

  private assinar(texto: string): string {
    return createHmac("sha256", this.segredo).update(texto).digest("base64url");
  }
}
