import mysql, { Pool, PoolOptions } from "mysql2/promise";

/**
 * Encapsula o pool de conexões com o MySQL (schema "projetopoo").
 * Implementada como singleton: a aplicação inteira compartilha a mesma
 * instância/pool em vez de abrir uma conexão nova a cada consulta.
 */
export class Database {
  private static instancia: Database;

  private readonly pool: Pool;

  private constructor() {
    const config: PoolOptions = {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "projetopoo",
      waitForConnections: true,
      connectionLimit: 10,
    };

    this.pool = mysql.createPool(config);
  }

  public static getInstancia(): Database {
    if (!Database.instancia) {
      Database.instancia = new Database();
    }
    return Database.instancia;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async testarConexao(): Promise<void> {
    const conexao = await this.pool.getConnection();
    try {
      await conexao.ping();
    } finally {
      conexao.release();
    }
  }
}
