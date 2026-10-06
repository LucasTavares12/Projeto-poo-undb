import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Tratamento } from "../module/Tratamento";

interface LinhaTratamento extends RowDataPacket {
  id: number;
  nome: string;
  descricao: string | null;
  valor: string; // DECIMAL vem como string do driver
  duracao_minutos: number;
  profissional_id: number | null;
}

export class TratamentoRepository extends Repositorio {
  // Bancos criados antes do vínculo com profissional: acrescenta a coluna e a chave estrangeira.
  // Sem ON DELETE: um profissional com tratamentos vinculados não pode ser excluído (senão os
  // tratamentos dele passariam, sem querer, a valer para todos os profissionais).
  private static readonly ADICIONAR_VINCULO = `
    ALTER TABLE tratamentos
      ADD COLUMN profissional_id INT NULL,
      ADD CONSTRAINT fk_tratamento_profissional
        FOREIGN KEY (profissional_id) REFERENCES profissionais (id)
  `;

  public async salvar(tratamento: Tratamento): Promise<Tratamento> {
    await this.garantirEstrutura();
    const [resultado] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO tratamentos (nome, descricao, valor, duracao_minutos, profissional_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        tratamento.getNome(),
        tratamento.getDescricao(),
        tratamento.getValor(),
        tratamento.getDuracaoMinutos(),
        tratamento.getProfissionalId(),
      ]
    );
    return new Tratamento(
      tratamento.getNome(),
      tratamento.getDescricao(),
      tratamento.getValor(),
      tratamento.getDuracaoMinutos(),
      resultado.insertId,
      tratamento.getProfissionalId()
    );
  }

  public async buscarPorId(id: number): Promise<Tratamento | null> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaTratamento[]>(
      "SELECT * FROM tratamentos WHERE id = ?",
      [id]
    );
    return linhas.length > 0 ? this.paraTratamento(linhas[0]) : null;
  }

  public async listarTodos(): Promise<Tratamento[]> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaTratamento[]>(
      "SELECT * FROM tratamentos ORDER BY nome"
    );
    return linhas.map((linha) => this.paraTratamento(linha));
  }

  public async atualizar(tratamento: Tratamento): Promise<void> {
    await this.garantirEstrutura();
    await this.pool.query(
      `UPDATE tratamentos
       SET nome = ?, descricao = ?, valor = ?, duracao_minutos = ?, profissional_id = ?
       WHERE id = ?`,
      [
        tratamento.getNome(),
        tratamento.getDescricao(),
        tratamento.getValor(),
        tratamento.getDuracaoMinutos(),
        tratamento.getProfissionalId(),
        tratamento.getId(),
      ]
    );
  }

  public async deletar(id: number): Promise<void> {
    await this.pool.query("DELETE FROM tratamentos WHERE id = ?", [id]);
  }

  private garantirEstrutura(): Promise<void> {
    return this.garantirColuna(
      "tratamentos",
      "profissional_id",
      TratamentoRepository.ADICIONAR_VINCULO
    );
  }

  private paraTratamento(linha: LinhaTratamento): Tratamento {
    return new Tratamento(
      linha.nome,
      linha.descricao ?? "",
      Number(linha.valor),
      linha.duracao_minutos,
      linha.id,
      linha.profissional_id
    );
  }
}
