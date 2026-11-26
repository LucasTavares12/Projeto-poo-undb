import { Tratamento } from "../module/Tratamento";
import { OrdemDosTratamentos } from "../module/OrdemDosTratamentos";
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
  /** Valor no cartão de crédito; null = o mesmo valor das outras formas. */
  valorCartaoCredito: number | null;
  /** Foto que demonstra o tratamento (data URL); null = sem foto. */
  foto: string | null;
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
    const tratamento = new Tratamento(
      dados.nome,
      dados.descricao,
      dados.valor,
      dados.duracaoMinutos,
      undefined,
      dados.profissionalId
    );
    tratamento.setValorCartaoCredito(dados.valorCartaoCredito);
    tratamento.setFoto(dados.foto);
    return this.repositorio.salvar(tratamento);
  }

  public async atualizar(id: number, dados: DadosTratamento): Promise<Tratamento> {
    const tratamento = await this.repositorio.buscarPorId(id);
    if (!tratamento) {
      throw new ErroNaoEncontrado("Tratamento não encontrado.");
    }
    await this.garantirProfissional(dados.profissionalId);
    // Mudou de profissional: entra no fim da lista do novo grupo.
    if (!tratamento.ehDoMesmoGrupoQue(dados.profissionalId)) {
      tratamento.definirOrdem(await this.repositorio.proximaOrdem(dados.profissionalId));
    }
    tratamento.atualizarDados(
      dados.nome,
      dados.descricao,
      dados.valor,
      dados.duracaoMinutos,
      dados.profissionalId
    );
    tratamento.setValorCartaoCredito(dados.valorCartaoCredito);
    tratamento.setFoto(dados.foto);
    await this.repositorio.atualizar(tratamento);
    return tratamento;
  }

  /**
   * Nova ordem dos tratamentos de um grupo (de um profissional, ou null = de todos), como
   * ficou depois de arrastar as linhas. Devolve o grupo já na nova ordem.
   */
  public async reordenar(profissionalId: number | null, ids: unknown): Promise<Tratamento[]> {
    const ordem = new OrdemDosTratamentos(ids);
    await this.garantirProfissional(profissionalId);
    const reordenados = ordem.aplicar(await this.repositorio.listarDoGrupo(profissionalId));
    await this.repositorio.salvarOrdem(reordenados);
    return reordenados;
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
