import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Notificacao } from "../module/Notificacao";
import { OrigemDaAcao } from "../module/OrigemDaAcao";
import { TipoNotificacao } from "../module/TipoNotificacao";

interface LinhaNotificacao extends RowDataPacket {
  id: number;
  tipo: TipoNotificacao;
  profissional_id: number;
  agendamento_id: number | null;
  titulo: string;
  mensagem: string;
  origem: OrigemDaAcao;
  autor_id: number | null;
  criada_em: Date;
}

interface LinhaNumero extends RowDataPacket {
  valor: number | null;
}

/**
 * Avisos do sino do painel e, por conta, quais ela já fechou. Fica um registro por aviso
 * fechado porque o modal (agendamentos novos) e o sino (remarcações e cancelamentos) fecham
 * avisos diferentes, em momentos diferentes.
 */
export class NotificacaoRepository extends Repositorio {
  private static readonly CRIAR_NOTIFICACOES = `
    CREATE TABLE IF NOT EXISTS notificacoes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo VARCHAR(40) NOT NULL,
      profissional_id INT NOT NULL,
      agendamento_id INT NULL,
      titulo VARCHAR(100) NOT NULL,
      mensagem VARCHAR(500) NOT NULL,
      origem VARCHAR(20) NOT NULL,
      autor_id INT NULL,
      criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_notificacao_profissional (profissional_id, id),
      CONSTRAINT fk_notificacao_profissional FOREIGN KEY (profissional_id)
        REFERENCES profissionais (id) ON DELETE CASCADE
    )
  `;

  private static readonly CRIAR_FECHADAS = `
    CREATE TABLE IF NOT EXISTS notificacoes_fechadas (
      administrador_id INT NOT NULL,
      notificacao_id INT NOT NULL,
      PRIMARY KEY (administrador_id, notificacao_id),
      CONSTRAINT fk_notificacao_fechada_admin FOREIGN KEY (administrador_id)
        REFERENCES administradores (id) ON DELETE CASCADE,
      CONSTRAINT fk_notificacao_fechada_aviso FOREIGN KEY (notificacao_id)
        REFERENCES notificacoes (id) ON DELETE CASCADE
    )
  `;

  // Pendentes para a conta: do profissional dela (ou todas, com acesso total), que ela ainda
  // não fechou. Agendamento novo avisa sempre; remarcação/cancelamento dela mesma, não.
  private static readonly FILTRO_PENDENTES = `
    (? IS NULL OR profissional_id = ?)
    AND (tipo = 'NOVO_AGENDAMENTO' OR autor_id IS NULL OR autor_id <> ?)
    AND NOT EXISTS (
      SELECT 1 FROM notificacoes_fechadas f
      WHERE f.notificacao_id = notificacoes.id AND f.administrador_id = ?
    )
  `;

  private async garantirEstrutura(): Promise<void> {
    await this.garantirTabela(NotificacaoRepository.CRIAR_NOTIFICACOES);
    await this.garantirTabela(NotificacaoRepository.CRIAR_FECHADAS);
  }

  public async salvar(notificacao: Notificacao): Promise<void> {
    await this.garantirEstrutura();
    await this.pool.query<ResultSetHeader>(
      `INSERT INTO notificacoes
         (tipo, profissional_id, agendamento_id, titulo, mensagem, origem, autor_id, criada_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notificacao.getTipo(),
        notificacao.getProfissionalId(),
        notificacao.getAgendamentoId(),
        notificacao.getTitulo(),
        notificacao.getMensagem(),
        notificacao.getOrigem(),
        notificacao.getAutorId(),
        notificacao.getCriadaEm(),
      ]
    );
  }

  /** As mais recentes que a conta ainda não fechou. `profissionalId` null = acesso total. */
  public async listarPendentes(
    profissionalId: number | null,
    adminId: number,
    limite: number
  ): Promise<Notificacao[]> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaNotificacao[]>(
      `SELECT * FROM notificacoes WHERE ${NotificacaoRepository.FILTRO_PENDENTES}
       ORDER BY id DESC LIMIT ?`,
      [profissionalId, profissionalId, adminId, adminId, limite]
    );
    return linhas.map((linha) => this.paraNotificacao(linha));
  }

  public async contarPendentes(profissionalId: number | null, adminId: number): Promise<number> {
    await this.garantirEstrutura();
    const [linhas] = await this.pool.query<LinhaNumero[]>(
      `SELECT COUNT(*) AS valor FROM notificacoes
       WHERE ${NotificacaoRepository.FILTRO_PENDENTES}`,
      [profissionalId, profissionalId, adminId, adminId]
    );
    return Number(linhas[0].valor ?? 0);
  }

  /** A conta fechou estes avisos: saem do sino dela (ids que não existem são ignorados). */
  public async fechar(adminId: number, ids: number[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.garantirEstrutura();
    await this.pool.query(
      `INSERT IGNORE INTO notificacoes_fechadas (administrador_id, notificacao_id)
       SELECT ?, id FROM notificacoes WHERE id IN (?)`,
      [adminId, ids]
    );
  }

  private paraNotificacao(linha: LinhaNotificacao): Notificacao {
    return new Notificacao(
      linha.tipo,
      linha.profissional_id,
      linha.agendamento_id,
      linha.titulo,
      linha.mensagem,
      linha.origem,
      linha.autor_id,
      linha.criada_em,
      linha.id
    );
  }
}
