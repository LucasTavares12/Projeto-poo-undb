import { Tratamento } from "../module/Tratamento";
import { TratamentoRepository } from "../repositories/TratamentoRepository";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";
import { ErroDeConflito } from "../erros/ErroDeConflito";

export interface DadosTratamento {
  nome: string;
  descricao: string;
  valor: number;
  duracaoMinutos: number;
  /** null = todos os profissionais realizam. */
  profissionalId: number | null;
}

/** Cadastro de tratamentos (área de acesso total). */
export class TratamentoService {
  private readonly repositorio = new TratamentoRepository();
  private readonly profissionalRepo = new ProfissionalRepository();

  public listar(): Promise<Tratamento[]> {
    return this.repositorio.listarTodos();
  }

  public async criar(dados: DadosTratamento): Promise<Tratamento> {
    await this.garantirProfissional(dados.profissionalId);
    return this.repositorio.salvar(
      new Tratamento(
        dados.nome,
        dados.descricao,
        dados.valor,
        dados.duracaoMinutos,
        undefined,
        dados.profissionalId
      )
    );
  }

  public async atualizar(id: number, dados: DadosTratamento): Promise<Tratamento> {
    const tratamento = await this.repositorio.buscarPorId(id);
    if (!tratamento) {
      throw new ErroNaoEncontrado("Tratamento não encontrado.");
    }
    await this.garantirProfissional(dados.profissionalId);
    tratamento.atualizarDados(
      dados.nome,
      dados.descricao,
      dados.valor,
      dados.duracaoMinutos,
      dados.profissionalId
    );
    await this.repositorio.atualizar(tratamento);
    return tratamento;
  }

  public async remover(id: number): Promise<void> {
    if (!(await this.repositorio.buscarPorId(id))) {
      throw new ErroNaoEncontrado("Tratamento não encontrado.");
    }
    try {
      await this.repositorio.deletar(id);
    } catch {
      throw new ErroDeConflito(
        "Não é possível excluir este tratamento: existem agendamentos vinculados a ele."
      );
    }
  }

  /** Tratamento ligado a um profissional: o profissional precisa existir. */
  private async garantirProfissional(profissionalId: number | null): Promise<void> {
    if (profissionalId !== null && !(await this.profissionalRepo.buscarPorId(profissionalId))) {
      throw new ErroNaoEncontrado("Profissional não encontrado.");
    }
  }
}
