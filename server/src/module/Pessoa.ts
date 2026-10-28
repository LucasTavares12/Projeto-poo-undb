import { Telefone } from "./Telefone";

/**
 * Base de quem tem nome e telefone na clínica (clientes e profissionais).
 *
 * O construtor não valida porque também é usado para carregar do banco, onde podem existir
 * registros antigos fora da regra. Dados novos ou alterados entram pelos setters (ou pelas
 * fábricas `novo()` das subclasses), que validam.
 */
export abstract class Pessoa {
  public static readonly TAMANHO_MAXIMO_NOME = 150;

  protected nome: string;
  protected telefone: string;

  constructor(nome: string, telefone: string) {
    this.nome = nome;
    this.telefone = telefone;
  }

  public getNome(): string {
    return this.nome;
  }

  public setNome(nome: string): void {
    const texto = String(nome ?? "").trim();
    if (texto === "") {
      throw new Error(`Informe o nome ${this.papel()}.`);
    }
    if (texto.length > Pessoa.TAMANHO_MAXIMO_NOME) {
      throw new Error(
        `O nome ${this.papel()} pode ter no máximo ${Pessoa.TAMANHO_MAXIMO_NOME} caracteres.`
      );
    }
    this.nome = texto;
  }

  public getTelefone(): string {
    return this.telefone;
  }

  public setTelefone(telefone: string): void {
    if (Telefone.somenteDigitos(telefone) === "") {
      throw new Error(`Informe o telefone ${this.papel()}.`);
    }
    // Valida (DDD + número) e guarda no formato de exibição: "(98) 98877-6655".
    this.telefone = new Telefone(telefone).formatar();
  }

  /** Compara só os números: "(98) 98877-6655" e "98988776655" são o mesmo telefone. */
  public temTelefone(telefone: string): boolean {
    const digitos = Telefone.somenteDigitos(telefone);
    return digitos.length > 0 && this.getTelefoneDigitos() === digitos;
  }

  /** Só os números do telefone ("98988776655"): é o que identifica a pessoa. */
  public getTelefoneDigitos(): string {
    return Telefone.somenteDigitos(this.telefone);
  }

  /** Valida nome e telefone de uma pessoa nova (usado pelas fábricas das subclasses). */
  protected validarContato(): void {
    this.setNome(this.nome);
    this.setTelefone(this.telefone);
  }

  /** Como a pessoa aparece nas mensagens de erro: "do cliente", "do profissional". */
  protected abstract papel(): string;

  public abstract apresentar(): string;
}
