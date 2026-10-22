import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { BloqueioAgenda } from "../module/BloqueioAgenda";
import { DataAgenda } from "../module/DataAgenda";

interface LinhaBloqueio extends RowDataPacket {
  id: number;
  profissional_id: number | null;
  data_inicio: string; // "YYYY-MM-DD" (DATE_FORMAT no SELECT: sem conversão de fuso)
  data_fim: string;
  motivo: string;
}

export class BloqueioAgendaRepository extends Repositorio {
  private static readonly SELECT_BASE = `
    SELECT id, profissional_id,
      DATE_FORMAT(data_inicio, '%Y-%m-%d') AS data_inicio,
      DATE_FORMAT(data_fim, '%Y-%m-%d') AS data_fim,
      motivo
    FROM bloqueios_agenda
  `;

  // Excluir o profissional apaga as folgas dele junto; os feriados (sem profissional) ficam.
  private static readonly CRIAR_TABELA = `
    CREATE TABLE IF NOT EXISTS bloqueios_agenda (
      id INT AUTO_INCREMENT PRIMARY KEY,
      profissional_id INT NULL,
      data_inicio DATE NOT NULL,
      data_fim DATE NOT NULL,
      motivo VARCHAR(150) NOT NULL DEFAULT '',
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_bloqueio_periodo (data_inicio, data_fim),
      CONSTRAINT fk_bloqueio_profissional FOREIGN KEY (profissional_id)
        REFERENCES profissionais (id) ON DELETE CASCADE
    )
  `;

  public async salvar(bloqueio: BloqueioAgenda): Promise<BloqueioAgenda> {
    await this.garantirTabela(BloqueioAgendaRepository.CRIAR_TABELA);
    const [resultado] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO bloqueios_agenda (profissional_id, data_inicio, data_fim, motivo)
       VALUES (?, ?, ?, ?)`,
      [
        bloqueio.getProfissionalId(),
        DataAgenda.paraTexto(bloqueio.getDataInicio()),
        DataAgenda.paraTexto(bloqueio.getDataFim()),
        bloqueio.getMotivo(),
      ]
    );
    return new BloqueioAgenda(
      bloqueio.getProfissionalId(),
      bloqueio.getDataInicio(),
      bloqueio.getDataFim(),
      bloqueio.getMotivo(),
      resultado.insertId
    );
  }

  public async buscarPorId(id: number): Promise<BloqueioAgenda | null> {
    await this.garantirTabela(BloqueioAgendaRepository.CRIAR_TABELA);
    const [linhas] = await this.pool.query<LinhaBloqueio[]>(`${BloqueioAgendaRepository.SELECT_BASE} WHERE id = ?`, [id]);
    return linhas.length > 0 ? this.paraBloqueio(linhas[0]) : null;
  }

  /**
   * Bloqueios que terminam em `aPartirDe` ou depois ("YYYY-MM-DD"; null = todos, inclusive os
   * já passados). Com `profissionalId`, só os daquele profissional e os da clínica inteira.
   */
  public async listar(
    profissionalId: number | null,
    aPartirDe: string | null
  ): Promise<BloqueioAgenda[]> {
    await this.garantirTabela(BloqueioAgendaRepository.CRIAR_TABELA);
    const [linhas] = await this.pool.query<LinhaBloqueio[]>(
      `${BloqueioAgendaRepository.SELECT_BASE}
       WHERE (? IS NULL OR profissional_id IS NULL OR profissional_id = ?)
         AND (? IS NULL OR data_fim >= ?)
       ORDER BY data_inicio, data_fim`,
      [profissionalId, profissionalId, aPartirDe, aPartirDe]
    );
    return linhas.map((linha) => this.paraBloqueio(linha));
  }

  /** true se a agenda do profissional está fechada na data (folga dele ou feriado da clínica). */
  public async existeNaData(profissionalId: number, data: Date): Promise<boolean> {
    await this.garantirTabela(BloqueioAgendaRepository.CRIAR_TABELA);
    const dia = DataAgenda.paraTexto(data);
    const [linhas] = await this.pool.query<RowDataPacket[]>(
      `SELECT 1 FROM bloqueios_agenda
       WHERE data_inicio <= ? AND data_fim >= ?
         AND (profissional_id IS NULL OR profissional_id = ?)
       LIMIT 1`,
      [dia, dia, profissionalId]
    );
    return linhas.length > 0;
  }

  public async deletar(id: number): Promise<void> {
    await this.garantirTabela(BloqueioAgendaRepository.CRIAR_TABELA);
    await this.pool.query("DELETE FROM bloqueios_agenda WHERE id = ?", [id]);
  }

  private paraBloqueio(linha: LinhaBloqueio): BloqueioAgenda {
    return new BloqueioAgenda(
      linha.profissional_id,
      DataAgenda.ler(linha.data_inicio),
      DataAgenda.ler(linha.data_fim),
      linha.motivo,
      linha.id
    );
  }
}
