import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Administrador } from "../module/Administrador";

interface LinhaAdministrador extends RowDataPacket {
  id: number;
  email: string;
  senha_hash: string;
}

export class AdministradorRepository extends Repositorio {
  private static readonly CRIAR_TABELA = `
    CREATE TABLE IF NOT EXISTS administradores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  public async salvar(administrador: Administrador): Promise<Administrador> {
    await this.garantirTabela(AdministradorRepository.CRIAR_TABELA);
    try {
      const [resultado] = await this.pool.query<ResultSetHeader>(
        "INSERT INTO administradores (email, senha_hash) VALUES (?, ?)",
        [administrador.getEmail(), administrador.getSenhaHash()]
      );
      return new Administrador(
        administrador.getEmail(),
        administrador.getSenhaHash(),
        resultado.insertId
      );
    } catch (erro) {
      if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
        throw new Error("Já existe uma conta com este e-mail.");
      }
      throw erro;
    }
  }

  public async buscarPorEmail(email: string): Promise<Administrador | null> {
    await this.garantirTabela(AdministradorRepository.CRIAR_TABELA);
    const [linhas] = await this.pool.query<LinhaAdministrador[]>(
      "SELECT * FROM administradores WHERE email = ?",
      [Administrador.normalizarEmail(email)]
    );
    return linhas.length > 0 ? this.paraAdministrador(linhas[0]) : null;
  }

  private paraAdministrador(linha: LinhaAdministrador): Administrador {
    return new Administrador(linha.email, linha.senha_hash, linha.id);
  }
}
