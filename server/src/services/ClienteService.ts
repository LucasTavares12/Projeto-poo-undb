import { HistoricoCliente } from "../module/HistoricoCliente";
import { ClientesDoTelefone } from "../module/ClientesDoTelefone";
import { Telefone } from "../module/Telefone";
import { AgendamentoRepository } from "../repositories/AgendamentoRepository";
import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";

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

  /**
   * As pessoas atendidas com um telefone, cada uma com a sua ficha (a ficha certa sai
   * de `ClientesDoTelefone.pessoa(nome)`).
   */
  public async buscarDoTelefone(
    telefone: string,
    profissionalDoUsuario: number | null
  ): Promise<ClientesDoTelefone> {
    const digitos = this.lerTelefone(telefone);
    // Vêm do mais recente para o mais antigo: a primeira pessoa é a atendida mais recentemente.
    const agendamentos = await this.agendamentoRepo.listarHistorico(profissionalDoUsuario, digitos);
    return new ClientesDoTelefone(agendamentos);
  }

  /** Telefone inválido na URL = cliente que não existe. */
  private lerTelefone(telefone: string): string {
    if (!Telefone.ehValido(telefone)) {
      throw new ErroNaoEncontrado("Cliente não encontrado.");
    }
    return Telefone.somenteDigitos(telefone);
  }
}
