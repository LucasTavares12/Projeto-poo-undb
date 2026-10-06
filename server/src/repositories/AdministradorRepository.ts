import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Administrador } from "../module/Administrador";

interface LinhaAdministrador extends RowDataPacket {
  id: number;
  email: string;
  senha_hash: string;
  criado_em: Date;
  profissional_id: number | null;
}

interface LinhaContagem extends RowDataPacket {
  total: number;
}

export class AdministradorRepository extends Repositorio {
  private static readonly CRIAR_TABELA = `
    CREATE TABLE IF NOT EXISTS administradores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      profissional_id INT NULL,
      CONSTRAINT fk_administrador_profissional
        FOREIGN KEY (profissional_id) REFERENCES profissionais (id)
    )
  `;

  // Bancos criados antes do vínculo com profissional: acrescenta a coluna e a chave estrangeira.
  // Sem ON DELETE: um profissional com usuário vinculado não pode ser excluído (senão a conta
  // viraria, sem querer, uma conta de acesso total).
  private static readonly ADICIONAR_VINCULO = `
    ALTER TABLE administradores
      ADD COLUMN profissional_id INT NULL,
      ADD CONSTRAINT fk_administrador_profissional
        FOREIGN KEY (profissional_id) REFERENCES profissionais (id)
  `;

  public async salvar(administrador: Administrador): Promise<Administrador> {
    await this.garantirEstrutura();
    try {
      const [resultado] = await this.pool.query<ResultSetHeader>(
        "INSERT INTO administradores (email, senha_hash, profissional_id) VALUES (?, ?, ?)",
        [administrador.getEmail(), administrador.getSenhaHash(), administrador.getProfissionalId()]
      );
      return new Administrador(
        administrador.getEmail(),
        administrador.getSenhaHash(),
        resultado.insertId,
        new Date(),
        administrador.getProfissionalId()
      );
    } catch (erro) {
      this.tratarEmailRepetido(erro);
    }
  }

  public async listarTodos(): Promise<Administrador[]> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaAdministrador[]>(
      "SELECT * FROM administradores ORDER BY email"
    );
    return linhas.map((linha) => this.paraAdministrador(linha));
  }

  public async buscarPorId(id: number): Promise<Administrador | null> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaAdministrador[]>(
      "SELECT * FROM administradores WHERE id = ?",
      [id]
    );
    return linhas.length > 0 ? this.paraAdministrador(linhas[0]) : null;
  }

  /** Quantos usuários têm acesso total (sem profissional vinculado). */
  public async contarComAcessoTotal(): Promise<number> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaContagem[]>(
      "SELECT COUNT(*) AS total FROM administradores WHERE profissional_id IS NULL"
    );
    return Number(linhas[0].total);
  }

  /** Usuário já ligado a este profissional, se houver (cada profissional tem no máximo um). */
  public async buscarPorProfissional(profissionalId: number): Promise<Administrador | null> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaAdministrador[]>(
      "SELECT * FROM administradores WHERE profissional_id = ?",
      [profissionalId]
    );
    return linhas.length > 0 ? this.paraAdministrador(linhas[0]) : null;
  }

  /** Grava e-mail e senha (hash) do administrador. */
  public async atualizar(administrador: Administrador): Promise<void> {
    await this.garantirEstrutura();
    try {
      await this.pool.query(
        "UPDATE administradores SET email = ?, senha_hash = ?, profissional_id = ? WHERE id = ?",
        [
          administrador.getEmail(),
          administrador.getSenhaHash(),
          administrador.getProfissionalId(),
          administrador.getId(),
        ]
      );
    } catch (erro) {
      this.tratarEmailRepetido(erro);
    }
  }

  public async deletar(id: number): Promise<void> {
    await this.garantirEstrutura();
    await this.pool.query("DELETE FROM administradores WHERE id = ?", [id]);
  }

  private async garantirEstrutura(): Promise<void> {
    await this.garantirTabela(AdministradorRepository.CRIAR_TABELA);
    await this.garantirColuna(
      "administradores",
      "profissional_id",
      AdministradorRepository.ADICIONAR_VINCULO
    );
  }

  /** O índice UNIQUE do e-mail é a garantia final contra contas repetidas. */
  private tratarEmailRepetido(erro: unknown): never {
    if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
      throw new Error("Já existe uma conta com este e-mail.");
    }
    throw erro;
  }

  public async buscarPorEmail(email: string): Promise<Administrador | null> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaAdministrador[]>(
      "SELECT * FROM administradores WHERE email = ?",
      [Administrador.normalizarEmail(email)]
    );
    return linhas.length > 0 ? this.paraAdministrador(linhas[0]) : null;
  }

  private paraAdministrador(linha: LinhaAdministrador): Administrador {
    return new Administrador(
      linha.email,
      linha.senha_hash,
      linha.id,
      linha.criado_em,
      linha.profissional_id
    );
  }
}
