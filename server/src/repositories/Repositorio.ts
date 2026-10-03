import { Pool } from "mysql2/promise";
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
}
