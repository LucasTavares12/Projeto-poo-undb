import { DataAgenda } from "./DataAgenda";

/**
 * Intervalo de dias inteiros, do primeiro ao último inclusive ("YYYY-MM-DD").
 * Usado pelas folgas e feriados: saber se um dia está dentro, se já terminou
 * e como mostrar o período para o usuário.
 */
export class PeriodoDeDatas {
  private readonly inicio: string;
  private readonly fim: string;

  constructor(inicio: string, fim: string) {
    this.inicio = inicio.slice(0, 10);
    this.fim = fim.slice(0, 10);
  }

  /** true se o dia ("YYYY-MM-DD") está dentro do período. O texto nesse formato compara certo. */
  public contem(dia: string): boolean {
    return this.inicio <= dia && dia <= this.fim;
  }

  public jaTerminou(hoje: string): boolean {
    return this.fim < hoje;
  }

  public estaEmAndamento(hoje: string): boolean {
    return this.contem(hoje);
  }

  /** "21/10/2026" para um dia só; "21/10 a 25/10/2026" no mesmo ano; com os dois anos se mudar. */
  public formatar(): string {
    const inicio = new DataAgenda(this.inicio);
    const fim = new DataAgenda(this.fim);
    if (this.inicio === this.fim) {
      return inicio.formatar();
    }
    return this.inicio.slice(0, 4) === this.fim.slice(0, 4)
      ? `${inicio.formatarDiaMes()} a ${fim.formatar()}`
      : `${inicio.formatar()} a ${fim.formatar()}`;
  }

  /** Para ordenar uma lista de períodos pelo começo. */
  public compararCom(outro: PeriodoDeDatas): number {
    return this.inicio.localeCompare(outro.inicio);
  }
}
