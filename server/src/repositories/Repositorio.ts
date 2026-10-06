import { Pool, RowDataPacket } from "mysql2/promise";
import { Database } from "../database/Database";

/**
 * Classe base para todos os repositórios: cada um ganha acesso ao mesmo
 * pool de conexões do MySQL sem precisar repetir a lógica de obtê-lo.
 */
export abstract class Repositorio {
  // Compartilhado entre todos os repositórios: cada tabela é criada uma única vez por execução.
  private static readonly tabelasProntas = new Map<string, Promise<void>>();

  protected readonly pool: Pool;

  constructor() {
    this.pool = Database.getInstancia().getPool();
  }

  /**
   * Roda o `CREATE TABLE IF NOT EXISTS` na primeira vez que a tabela for usada,
   * para as tabelas novas não dependerem de um script SQL manual.
   */
  protected garantirTabela(sqlCriacao: string): Promise<void> {
    let pronta = Repositorio.tabelasProntas.get(sqlCriacao);
    if (!pronta) {
      pronta = this.pool
        .query(sqlCriacao)
        .then(() => undefined)
        .catch((erro) => {
          Repositorio.tabelasProntas.delete(sqlCriacao); // tenta de novo na próxima chamada
          throw erro;
        });
      Repositorio.tabelasProntas.set(sqlCriacao, pronta);
    }
    return pronta;
  }

  /**
   * Para bancos criados antes de uma coluna existir: se `coluna` ainda não estiver em
   * `tabela`, roda o `ALTER TABLE` informado. Também roda uma única vez por execução.
   */
  protected garantirColuna(tabela: string, coluna: string, sqlAlteracao: string): Promise<void> {
    const chave = `coluna:${tabela}.${coluna}`;
    let pronta = Repositorio.tabelasProntas.get(chave);
    if (!pronta) {
      pronta = this.pool
        .query<RowDataPacket[]>(
          `SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [tabela, coluna]
        )
        .then(async ([linhas]) => {
          if (linhas.length === 0) {
            await this.pool.query(sqlAlteracao);
          }
        })
        .catch((erro) => {
          Repositorio.tabelasProntas.delete(chave);
          throw erro;
        });
      Repositorio.tabelasProntas.set(chave, pronta);
    }
    return pronta;
  }
}
