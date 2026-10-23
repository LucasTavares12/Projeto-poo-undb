import { HistoricoCliente } from "../module/HistoricoCliente";
import { Pessoa } from "../module/Pessoa";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";
import { ErroNaoEncontrado } from "./ErroNaoEncontrado";

/**
 * Aba "Clientes" do painel: lista e ficha com o histórico de cada cliente.
 * Conta ligada a profissional só vê os clientes que ela atendeu (ou tem marcados),
 * e no histórico só os agendamentos com ela.
 */
export class ClienteService {
  private readonly agendamentoRepo = new AgendamentoRepository();

  /** Clientes em ordem alfabética, filtrados pelo nome ou telefone (`busca`). */
  public async listar(
    busca: string,
    profissionalDoUsuario: number | null
  ): Promise<HistoricoCliente[]> {
    const agendamentos = await this.agendamentoRepo.listarHistorico(profissionalDoUsuario, null);
    return HistoricoCliente.agrupar(agendamentos)
      .filter((historico) => historico.combinaCom(busca))
      .sort((a, b) => a.getNome().localeCompare(b.getNome(), "pt-BR"));
  }

  public async buscar(
    telefone: string,
    profissionalDoUsuario: number | null
  ): Promise<HistoricoCliente> {
    const digitos = this.lerTelefone(telefone);
    const agendamentos = await this.agendamentoRepo.listarHistorico(profissionalDoUsuario, digitos);
    if (agendamentos.length === 0) {
      throw new ErroNaoEncontrado("Cliente não encontrado.");
    }
    return new HistoricoCliente(digitos, agendamentos);
  }

  private lerTelefone(telefone: string): string {
    const digitos = Pessoa.somenteDigitos(telefone);
    if (digitos.length < 10 || digitos.length > 11) {
      throw new ErroNaoEncontrado("Cliente não encontrado.");
    }
    return digitos;
  }
}
