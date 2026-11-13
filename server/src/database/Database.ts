import mysql, { Pool, PoolOptions } from "mysql2/promise";
import { RelogioClinica } from "../module/RelogioClinica";

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
      // Datas do Node <-> DATETIME do banco no fuso da clínica (não no fuso do servidor).
      timezone: RelogioClinica.deslocamentoUtc(),
    };

    this.pool = mysql.createPool(config);
    // Cada conexão nova usa o fuso da clínica: NOW() e CURDATE() passam a ser a hora
    // e o dia da clínica, mesmo num MySQL hospedado em UTC.
    this.pool.pool.on("connection", (conexao) => {
      conexao.query("SET time_zone = ?", [RelogioClinica.deslocamentoUtc()]);
    });
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
