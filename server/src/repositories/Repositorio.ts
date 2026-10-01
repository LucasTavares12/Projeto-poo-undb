import { Pool } from "mysql2/promise";
import { Database } from "../database/Database";

/**
 * Classe base para todos os repositórios: cada um ganha acesso ao mesmo
 * pool de conexões do MySQL sem precisar repetir a lógica de obtê-lo.
 */
export abstract class Repositorio {
  protected readonly pool: Pool;

  constructor() {
    this.pool = Database.getInstancia().getPool();
  }
}
