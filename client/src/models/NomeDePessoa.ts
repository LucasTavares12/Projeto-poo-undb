/**
 * Nome de uma pessoa, comparado como o servidor compara: sem acentos, sem diferença de
 * maiúsculas e com espaços repetidos juntados ("Mônica  Silva" e "monica silva" são iguais).
 */
export class NomeDePessoa {
  private readonly texto: string;

  constructor(texto: string) {
    this.texto = texto.replace(/\s+/g, " ").trim();
  }

  public estaVazio(): boolean {
    return this.texto === "";
  }

  /** Como a pessoa escreveu, sem espaços a mais. */
  public toString(): string {
    return this.texto;
  }

  /** "Maria Souza" → "Maria". */
  public primeiroNome(): string {
    return this.texto.split(" ")[0];
  }

  public ehIgualA(outro: NomeDePessoa): boolean {
    return !this.estaVazio() && this.normalizado() === outro.normalizado();
  }

  private normalizado(): string {
    return this.texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }
}
