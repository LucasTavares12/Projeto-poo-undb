import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Profissional } from "../module/Profissional";

interface LinhaProfissional extends RowDataPacket {
  id: number;
  nome: string;
  telefone: string;
  especialidade: string;
}

export class ProfissionalRepository extends Repositorio {
  public async salvar(profissional: Profissional): Promise<Profissional> {
    const [resultado] = await this.pool.query<ResultSetHeader>(
      "INSERT INTO profissionais (nome, telefone, especialidade) VALUES (?, ?, ?)",
      [profissional.getNome(), profissional.getTelefone(), profissional.getEspecialidade()]
    );
    return new Profissional(
      profissional.getNome(),
      profissional.getTelefone(),
      profissional.getEspecialidade(),
      resultado.insertId
    );
  }

  public async buscarPorId(id: number): Promise<Profissional | null> {
    const [linhas] = await this.pool.query<LinhaProfissional[]>(
      "SELECT * FROM profissionais WHERE id = ?",
      [id]
    );
    return linhas.length > 0 ? this.paraProfissional(linhas[0]) : null;
  }

  public async listarTodos(): Promise<Profissional[]> {
    const [linhas] = await this.pool.query<LinhaProfissional[]>(
      "SELECT * FROM profissionais ORDER BY nome"
    );
    return linhas.map((linha) => this.paraProfissional(linha));
  }

  public async atualizar(profissional: Profissional): Promise<void> {
    await this.pool.query(
      "UPDATE profissionais SET nome = ?, telefone = ?, especialidade = ? WHERE id = ?",
      [
        profissional.getNome(),
        profissional.getTelefone(),
        profissional.getEspecialidade(),
        profissional.getId(),
      ]
    );
  }

  public async deletar(id: number): Promise<void> {
    await this.pool.query("DELETE FROM profissionais WHERE id = ?", [id]);
  }

  private paraProfissional(linha: LinhaProfissional): Profissional {
    return new Profissional(linha.nome, linha.telefone, linha.especialidade, linha.id);
  }
}
