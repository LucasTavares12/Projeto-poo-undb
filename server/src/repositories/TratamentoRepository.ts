import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Tratamento } from "../module/Tratamento";

interface LinhaTratamento extends RowDataPacket {
  id: number;
  nome: string;
  descricao: string | null;
  valor: string; // DECIMAL vem como string do driver
  duracao_minutos: number;
}

export class TratamentoRepository extends Repositorio {
  public async salvar(tratamento: Tratamento): Promise<Tratamento> {
    const [resultado] = await this.pool.query<ResultSetHeader>(
      "INSERT INTO tratamentos (nome, descricao, valor, duracao_minutos) VALUES (?, ?, ?, ?)",
      [
        tratamento.getNome(),
        tratamento.getDescricao(),
        tratamento.getValor(),
        tratamento.getDuracaoMinutos(),
      ]
    );
    return new Tratamento(
      tratamento.getNome(),
      tratamento.getDescricao(),
      tratamento.getValor(),
      tratamento.getDuracaoMinutos(),
      resultado.insertId
    );
  }

  public async buscarPorId(id: number): Promise<Tratamento | null> {
    const [linhas] = await this.pool.query<LinhaTratamento[]>(
      "SELECT * FROM tratamentos WHERE id = ?",
      [id]
    );
    return linhas.length > 0 ? this.paraTratamento(linhas[0]) : null;
  }

  public async listarTodos(): Promise<Tratamento[]> {
    const [linhas] = await this.pool.query<LinhaTratamento[]>(
      "SELECT * FROM tratamentos ORDER BY nome"
    );
    return linhas.map((linha) => this.paraTratamento(linha));
  }

  public async atualizar(tratamento: Tratamento): Promise<void> {
    await this.pool.query(
      "UPDATE tratamentos SET nome = ?, descricao = ?, valor = ?, duracao_minutos = ? WHERE id = ?",
      [
        tratamento.getNome(),
        tratamento.getDescricao(),
        tratamento.getValor(),
        tratamento.getDuracaoMinutos(),
        tratamento.getId(),
      ]
    );
  }

  public async deletar(id: number): Promise<void> {
    await this.pool.query("DELETE FROM tratamentos WHERE id = ?", [id]);
  }

  private paraTratamento(linha: LinhaTratamento): Tratamento {
    return new Tratamento(
      linha.nome,
      linha.descricao ?? "",
      Number(linha.valor),
      linha.duracao_minutos,
      linha.id
    );
  }
}
