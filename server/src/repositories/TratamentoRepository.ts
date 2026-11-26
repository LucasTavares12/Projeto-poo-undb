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
  ordem: number;
  foto: string | null;
  valor_cartao_credito: string | null; // DECIMAL vem como string do driver
}

interface LinhaProximaOrdem extends RowDataPacket {
  proxima: number;
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

  // Posição de cada tratamento na lista do seu grupo (ordem em que o cliente vê).
  private static readonly ADICIONAR_ORDEM = `
    ALTER TABLE tratamentos ADD COLUMN ordem INT NOT NULL DEFAULT 0
  `;

  // Foto que demonstra o tratamento para o cliente (base64). NULL = sem foto.
  private static readonly ADICIONAR_FOTO = `
    ALTER TABLE tratamentos ADD COLUMN foto MEDIUMTEXT NULL
  `;

  // Valor no cartão de crédito (ex.: cobre a taxa da maquininha). NULL = mesmo valor.
  public static readonly ADICIONAR_VALOR_CREDITO = `
    ALTER TABLE tratamentos ADD COLUMN valor_cartao_credito DECIMAL(10,2) NULL
  `;

  /** Tratamento novo entra no fim da lista do seu grupo. */
  public async salvar(tratamento: Tratamento): Promise<Tratamento> {
    await this.garantirEstrutura();
    const ordem = await this.proximaOrdem(tratamento.getProfissionalId());
    const [resultado] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO tratamentos
         (nome, descricao, valor, duracao_minutos, profissional_id, ordem, foto, valor_cartao_credito)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tratamento.getNome(),
        tratamento.getDescricao(),
        tratamento.getValor(),
        tratamento.getDuracaoMinutos(),
        tratamento.getProfissionalId(),
        ordem,
        tratamento.getFoto(),
        tratamento.getValorCartaoCredito(),
      ]
    );
    const salvo = new Tratamento(
      tratamento.getNome(),
      tratamento.getDescricao(),
      tratamento.getValor(),
      tratamento.getDuracaoMinutos(),
      resultado.insertId,
      tratamento.getProfissionalId(),
      ordem
    );
    salvo.setFoto(tratamento.getFoto());
    salvo.setValorCartaoCredito(tratamento.getValorCartaoCredito());
    return salvo;
  }

  /** A posição logo depois do último tratamento do grupo (null = todos os profissionais). */
  public async proximaOrdem(profissionalId: number | null): Promise<number> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaProximaOrdem[]>(
      "SELECT COALESCE(MAX(ordem), -1) + 1 AS proxima FROM tratamentos WHERE profissional_id <=> ?",
      [profissionalId]
    );
    return Number(linhas[0].proxima);
  }

  /** Tratamentos de um grupo (null = os de todos os profissionais), na ordem atual. */
  public async listarDoGrupo(profissionalId: number | null): Promise<Tratamento[]> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaTratamento[]>(
      "SELECT * FROM tratamentos WHERE profissional_id <=> ? ORDER BY ordem, nome",
      [profissionalId]
    );
    return linhas.map((linha) => this.paraTratamento(linha));
  }

  /** Grava a posição de cada tratamento, tudo junto: ou muda a ordem inteira, ou nada. */
  public async salvarOrdem(tratamentos: Tratamento[]): Promise<void> {
    await this.garantirEstrutura();
    const conexao = await this.pool.getConnection();
    try {
      await conexao.beginTransaction();
      for (const tratamento of tratamentos) {
        await conexao.query("UPDATE tratamentos SET ordem = ? WHERE id = ?", [
          tratamento.getOrdem(),
          tratamento.getId(),
        ]);
      }
      await conexao.commit();
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  }

  public async buscarPorId(id: number): Promise<Tratamento | null> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaTratamento[]>(
      "SELECT * FROM tratamentos WHERE id = ?",
      [id]
    );
    return linhas.length > 0 ? this.paraTratamento(linhas[0]) : null;
  }

  /**
   * Todos os tratamentos: primeiro os ligados a um profissional, depois os de todos os
   * profissionais, cada grupo na ordem definida no painel. Assim, ao filtrar pelo profissional
   * escolhido, o cliente vê os serviços dele primeiro e depois os que todos fazem.
   */
  public async listarTodos(): Promise<Tratamento[]> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaTratamento[]>(
      "SELECT * FROM tratamentos ORDER BY profissional_id IS NULL, ordem, nome"
    );
    return linhas.map((linha) => this.paraTratamento(linha));
  }

  public async atualizar(tratamento: Tratamento): Promise<void> {
    await this.garantirEstrutura();
    await this.pool.query(
      `UPDATE tratamentos
       SET nome = ?, descricao = ?, valor = ?, duracao_minutos = ?, profissional_id = ?, ordem = ?,
           foto = ?, valor_cartao_credito = ?
       WHERE id = ?`,
      [
        tratamento.getNome(),
        tratamento.getDescricao(),
        tratamento.getValor(),
        tratamento.getDuracaoMinutos(),
        tratamento.getProfissionalId(),
        tratamento.getOrdem(),
        tratamento.getFoto(),
        tratamento.getValorCartaoCredito(),
        tratamento.getId(),
      ]
    );
  }

  public async deletar(id: number): Promise<void> {
    await this.pool.query("DELETE FROM tratamentos WHERE id = ?", [id]);
  }

  private async garantirEstrutura(): Promise<void> {
    await this.garantirColuna(
      "tratamentos",
      "profissional_id",
      TratamentoRepository.ADICIONAR_VINCULO
    );
    await this.garantirColuna("tratamentos", "ordem", TratamentoRepository.ADICIONAR_ORDEM);
    await this.garantirColuna("tratamentos", "foto", TratamentoRepository.ADICIONAR_FOTO);
    await this.garantirColuna(
      "tratamentos",
      "valor_cartao_credito",
      TratamentoRepository.ADICIONAR_VALOR_CREDITO
    );
  }

  private paraTratamento(linha: LinhaTratamento): Tratamento {
    const tratamento = new Tratamento(
      linha.nome,
      linha.descricao ?? "",
      Number(linha.valor),
      linha.duracao_minutos,
      linha.id,
      linha.profissional_id,
      Number(linha.ordem ?? 0)
    );
    tratamento.setValorCartaoCredito(
      linha.valor_cartao_credito === null || linha.valor_cartao_credito === undefined
        ? null
        : Number(linha.valor_cartao_credito)
    );
    // Uma foto gravada que não passe mais na validação é ignorada (fica sem foto).
    try {
      tratamento.setFoto(linha.foto ?? null);
    } catch {
      tratamento.setFoto(null);
    }
    return tratamento;
  }
}
