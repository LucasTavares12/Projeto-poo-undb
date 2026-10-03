import { randomBytes, scrypt, timingSafeEqual } from "crypto";

/**
 * Conta de acesso ao painel da clínica. A senha nunca é guardada em texto:
 * o objeto só conhece o hash (scrypt + salt aleatório) e sabe conferir se
 * uma senha digitada bate com ele.
 */
export class Administrador {
  private static readonly TAMANHO_MINIMO_SENHA = 6;
  private static readonly TAMANHO_HASH = 64;
  private static readonly FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private id?: number;
  private email: string;
  private senhaHash: string; // formato "salt:hash", ambos em hexadecimal

  constructor(email: string, senhaHash: string, id?: number) {
    const emailNormalizado = Administrador.normalizarEmail(email);
    if (!Administrador.FORMATO_EMAIL.test(emailNormalizado)) {
      throw new Error("Informe um e-mail válido.");
    }

    this.email = emailNormalizado;
    this.senhaHash = senhaHash;
    this.id = id;
  }

  /** Cria um administrador novo a partir da senha digitada no cadastro. */
  public static async comSenha(email: string, senha: string): Promise<Administrador> {
    if (typeof senha !== "string" || senha.length < Administrador.TAMANHO_MINIMO_SENHA) {
      throw new Error(
        `A senha precisa ter pelo menos ${Administrador.TAMANHO_MINIMO_SENHA} caracteres.`
      );
    }

    const salt = randomBytes(16).toString("hex");
    const hash = await Administrador.gerarHash(senha, salt);
    return new Administrador(email, `${salt}:${hash.toString("hex")}`);
  }

  /** E-mails são comparados sem diferenciar maiúsculas e sem espaços nas pontas. */
  public static normalizarEmail(email: string): string {
    return String(email ?? "").trim().toLowerCase();
  }

  private static gerarHash(senha: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(senha, salt, Administrador.TAMANHO_HASH, (erro, chave) =>
        erro ? reject(erro) : resolve(chave)
      );
    });
  }

  public async senhaConfere(senha: string): Promise<boolean> {
    const [salt, hashGuardado] = this.senhaHash.split(":");
    if (!salt || !hashGuardado) {
      return false;
    }

    const hashDigitado = await Administrador.gerarHash(String(senha ?? ""), salt);
    const esperado = Buffer.from(hashGuardado, "hex");
    return esperado.length === hashDigitado.length && timingSafeEqual(esperado, hashDigitado);
  }

  public getId(): number | undefined {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }

  public getSenhaHash(): string {
    return this.senhaHash;
  }

  /** Nunca expõe o hash da senha nas respostas da API. */
  public toJSON() {
    return {
      id: this.id,
      email: this.email,
    };
  }
}
