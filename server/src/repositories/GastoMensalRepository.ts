import { RowDataPacket } from "mysql2";
import { Repositorio } from "./Repositorio";
import { GastoMensal } from "../module/GastoMensal";

interface LinhaGasto extends RowDataPacket {
  mes: string;
  profissional_id: number;
  valor: string; // DECIMAL vem como texto
}

/**
 * Gastos de cada mês (um por mês para a clínica e um para cada profissional), usados no
 * cálculo do lucro. No banco, `profissional_id = 0` é o gasto da clínica inteira (a chave
 * primária não aceita NULL); fora daqui, a clínica é sempre `null`.
 */
export class GastoMensalRepository extends Repositorio {
  private static readonly DA_CLINICA = 0;

  private static readonly CRIAR_TABELA = `
    CREATE TABLE IF NOT EXISTS gastos_mensais (
      mes CHAR(7) NOT NULL,
      profissional_id INT NOT NULL DEFAULT 0,
      valor DECIMAL(12,2) NOT NULL,
      atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (mes, profissional_id)
    )
  `;

  // Tabela criada antes dos gastos por profissional: os que existiam são da clínica (0).
  private static readonly ADICIONAR_PROFISSIONAL = `
    ALTER TABLE gastos_mensais
      ADD COLUMN profissional_id INT NOT NULL DEFAULT 0 AFTER mes,
      DROP PRIMARY KEY,
      ADD PRIMARY KEY (mes, profissional_id)
  `;

  /** null = o gasto daquele mês (da clínica ou do profissional) ainda não foi informado. */
  public async buscar(mes: string, profissionalId: number | null): Promise<GastoMensal | null> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaGasto[]>(
      "SELECT mes, profissional_id, valor FROM gastos_mensais WHERE mes = ? AND profissional_id = ?",
      [mes, GastoMensalRepository.paraBanco(profissionalId)]
    );
    return linhas.length > 0 ? GastoMensalRepository.paraGasto(linhas[0]) : null;
  }

  /** Grava o gasto do mês, substituindo o que já estava informado. */
  public async salvar(gasto: GastoMensal): Promise<void> {
    await this.garantirEstrutura();
    await this.pool.query(
      `INSERT INTO gastos_mensais (mes, profissional_id, valor) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
      [gasto.getMes(), GastoMensalRepository.paraBanco(gasto.getProfissionalId()), gasto.getValor()]
    );
  }

  /** Apaga o gasto do mês (informado errado): o mês volta a ficar sem gasto. */
  public async apagar(mes: string, profissionalId: number | null): Promise<void> {
    await this.garantirEstrutura();
    await this.pool.query("DELETE FROM gastos_mensais WHERE mes = ? AND profissional_id = ?", [
      mes,
      GastoMensalRepository.paraBanco(profissionalId),
    ]);
  }

  private async garantirEstrutura(): Promise<void> {
    await this.garantirTabela(GastoMensalRepository.CRIAR_TABELA);
    await this.garantirColuna(
      "gastos_mensais",
      "profissional_id",
      GastoMensalRepository.ADICIONAR_PROFISSIONAL
    );
  }

  private static paraBanco(profissionalId: number | null): number {
    return profissionalId ?? GastoMensalRepository.DA_CLINICA;
  }

  private static paraGasto(linha: LinhaGasto): GastoMensal {
    const profissionalId =
      linha.profissional_id === GastoMensalRepository.DA_CLINICA ? null : linha.profissional_id;
    return new GastoMensal(linha.mes, Number(linha.valor), profissionalId);
  }
}
