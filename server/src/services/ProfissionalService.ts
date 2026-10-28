import { Profissional } from "../module/Profissional";
import { PerfilDeAcesso } from "../module/PerfilDeAcesso";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";
import { ErroDeConflito } from "../erros/ErroDeConflito";

export interface DadosProfissional {
  nome: string;
  telefone: string;
  especialidade: string;
}

/** Cadastro de profissionais. Conta ligada a profissional só edita o próprio cadastro. */
export class ProfissionalService {
  private readonly repositorio = new ProfissionalRepository();

  public listar(): Promise<Profissional[]> {
    return this.repositorio.listarTodos();
  }

  public criar(dados: DadosProfissional): Promise<Profissional> {
    return this.repositorio.salvar(
      Profissional.novo(dados.nome, dados.telefone, dados.especialidade)
    );
  }

  public async atualizar(
    id: number,
    dados: DadosProfissional,
    profissionalDoUsuario: number | null
  ): Promise<Profissional> {
    new PerfilDeAcesso(profissionalDoUsuario).exigir(
      id,
      "Você só pode editar o seu próprio cadastro."
    );
    const profissional = await this.buscar(id);
    profissional.atualizarDados(dados.nome, dados.telefone, dados.especialidade);
    await this.repositorio.atualizar(profissional);
    return profissional;
  }

  public async remover(id: number): Promise<void> {
    await this.buscar(id);
    try {
      await this.repositorio.deletar(id);
    } catch {
      // O banco recusa por chave estrangeira: há registros usando este profissional.
      throw new ErroDeConflito(
        "Não é possível excluir este profissional: existem agendamentos, tratamentos ou um " +
          "usuário do sistema vinculados a ele."
      );
    }
  }

  private async buscar(id: number): Promise<Profissional> {
    const profissional = await this.repositorio.buscarPorId(id);
    if (!profissional) {
      throw new ErroNaoEncontrado("Profissional não encontrado.");
    }
    return profissional;
  }
}
