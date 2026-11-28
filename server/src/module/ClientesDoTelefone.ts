import { Agendamento } from "./Agendamento";
import { HistoricoCliente } from "./HistoricoCliente";
import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";

/**
 * As pessoas atendidas com um mesmo telefone (ex.: a mãe, que marca para ela, e a filha,
 * que a mãe agenda com o próprio número). Cada uma tem o seu histórico (a sua ficha).
 */
export class ClientesDoTelefone {
  /** Da pessoa atendida mais recentemente para a mais antiga. */
  private readonly pessoas: HistoricoCliente[];

  /** `agendamentos` = todos os do telefone, do mais recente para o mais antigo. */
  constructor(agendamentos: Agendamento[]) {
    this.pessoas = HistoricoCliente.agrupar(agendamentos);
  }

  /**
   * Ficha de uma pessoa do telefone pelo nome (sem ligar para acentos e maiúsculas).
   * Sem nome (links antigos), a pessoa atendida mais recentemente.
   */
  public pessoa(nome: string): HistoricoCliente {
    const encontrada =
      nome.trim() === "" ? this.pessoas[0] : this.pessoas.find((pessoa) => pessoa.ehDe(nome));
    if (!encontrada) {
      throw new ErroNaoEncontrado("Cliente não encontrado.");
    }
    return encontrada;
  }

  /** Os nomes das outras pessoas do telefone, em ordem alfabética (para a ficha apontar). */
  public outrasPessoasAlemDe(historico: HistoricoCliente): string[] {
    return this.pessoas
      .filter((pessoa) => pessoa !== historico)
      .map((pessoa) => pessoa.getNome())
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }
}
