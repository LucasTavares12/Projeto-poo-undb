import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Administrador } from "../module/Administrador";
import { AdministradorRepository } from "../repositories/AdministradorRepository";
import { ConfiguracaoRepository } from "../repositories/ConfiguracaoRepository";
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

  /** true se o token foi emitido por este servidor e ainda não expirou. */
  public tokenEhValido(token: string): boolean {
    const [conteudoCodificado, assinatura] = token.split(".");
    if (!conteudoCodificado || !assinatura) {
      return false;
    }

    const assinaturaRecebida = Buffer.from(assinatura);
    const assinaturaEsperada = Buffer.from(this.assinar(conteudoCodificado));
    if (
      assinaturaRecebida.length !== assinaturaEsperada.length ||
      !timingSafeEqual(assinaturaRecebida, assinaturaEsperada)
    ) {
      return false;
    }

    try {
      const conteudo = JSON.parse(
        Buffer.from(conteudoCodificado, "base64url").toString("utf8")
      ) as ConteudoToken;
      return typeof conteudo.expiraEm === "number" && conteudo.expiraEm > Date.now();
    } catch {
      return false;
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
