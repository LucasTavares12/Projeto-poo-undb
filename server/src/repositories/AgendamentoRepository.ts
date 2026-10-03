import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Agendamento } from "../module/Agendamento";
import { Cliente } from "../module/Cliente";
import { Profissional } from "../module/Profissional";
import { Tratamento } from "../module/Tratamento";
import { Horario } from "../module/Horario";
import { StatusAgendamento } from "../module/StatusAgendamento";

interface LinhaAgendamentoBase extends RowDataPacket {
  id: number;
  data: string;
  hora_inicio: string;
  status: StatusAgendamento;
  cliente_id: number;
  cliente_nome: string;
  cliente_telefone: string;
  profissional_id: number;
  profissional_nome: string;
  profissional_telefone: string;
  especialidade: string;
}

interface LinhaTratamento extends RowDataPacket {
  id: number;
  nome: string;
  descricao: string | null;
  valor: string;
  duracao_minutos: number;
}

const SELECT_BASE = `
  SELECT
    a.id, a.data, a.hora_inicio, a.status,
    c.id AS cliente_id, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
    p.id AS profissional_id, p.nome AS profissional_nome, p.telefone AS profissional_telefone, p.especialidade
  FROM agendamentos a
  JOIN clientes c ON c.id = a.cliente_id
  JOIN profissionais p ON p.id = a.profissional_id
`;

const SELECT_TRATAMENTOS_DO_AGENDAMENTO = `
  SELECT t.*
  FROM tratamentos t
  JOIN agendamento_tratamentos at ON at.tratamento_id = t.id
  WHERE at.agendamento_id = ?
`;

export class AgendamentoRepository extends Repositorio {
  public async salvar(agendamento: Agendamento): Promise<Agendamento> {
    const [resultado] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO agendamentos (cliente_id, profissional_id, data, hora_inicio, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        agendamento.getCliente().getId(),
        agendamento.getProfissional().getId(),
        this.formatarData(agendamento.getData()),
        agendamento.getHorarioInicio().toString(),
        agendamento.getStatus(),
      ]
    );

    const agendamentoId = resultado.insertId;
    await this.salvarTratamentos(agendamentoId, agendamento.getTratamentos());

    const criado = await this.buscarPorId(agendamentoId);
    if (!criado) {
      throw new Error("Falha ao recuperar o agendamento recém-criado.");
    }
    return criado;
  }

  public async buscarPorId(id: number): Promise<Agendamento | null> {
    const [linhas] = await this.pool.query<LinhaAgendamentoBase[]>(
      `${SELECT_BASE} WHERE a.id = ?`,
      [id]
    );
    return linhas.length > 0 ? await this.montarAgendamento(linhas[0]) : null;
  }

  public async listarTodos(): Promise<Agendamento[]> {
    const [linhas] = await this.pool.query<LinhaAgendamentoBase[]>(
      `${SELECT_BASE} ORDER BY a.data, a.hora_inicio`
    );
    return Promise.all(linhas.map((linha) => this.montarAgendamento(linha)));
  }

  /** Usado para calcular a disponibilidade: todos os agendamentos de um profissional em uma data. */
  public async listarPorProfissionalEData(
    profissionalId: number,
    data: Date
  ): Promise<Agendamento[]> {
    const [linhas] = await this.pool.query<LinhaAgendamentoBase[]>(
      `${SELECT_BASE} WHERE a.profissional_id = ? AND a.data = ? ORDER BY a.hora_inicio`,
      [profissionalId, this.formatarData(data)]
    );
    return Promise.all(linhas.map((linha) => this.montarAgendamento(linha)));
  }

  public async atualizarStatus(id: number, status: StatusAgendamento): Promise<void> {
    await this.pool.query("UPDATE agendamentos SET status = ? WHERE id = ?", [status, id]);
  }

  /** Apaga o agendamento e seus tratamentos juntos: ou sai tudo, ou nada. */
  public async deletar(id: number): Promise<void> {
    const conexao = await this.pool.getConnection();
    try {
      await conexao.beginTransaction();
      await conexao.query("DELETE FROM agendamento_tratamentos WHERE agendamento_id = ?", [id]);
      await conexao.query("DELETE FROM agendamentos WHERE id = ?", [id]);
      await conexao.commit();
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  }

  private async salvarTratamentos(agendamentoId: number, tratamentos: Tratamento[]): Promise<void> {
    const valores = tratamentos.map((tratamento) => [agendamentoId, tratamento.getId()]);
    await this.pool.query(
      "INSERT INTO agendamento_tratamentos (agendamento_id, tratamento_id) VALUES ?",
      [valores]
    );
  }

  private async buscarTratamentosDoAgendamento(agendamentoId: number): Promise<Tratamento[]> {
    const [linhas] = await this.pool.query<LinhaTratamento[]>(
      SELECT_TRATAMENTOS_DO_AGENDAMENTO,
      [agendamentoId]
    );
    return linhas.map(
      (linha) =>
        new Tratamento(linha.nome, linha.descricao ?? "", Number(linha.valor), linha.duracao_minutos, linha.id)
    );
  }

  private formatarData(data: Date): string {
    return data.toISOString().slice(0, 10);
  }

  private async montarAgendamento(linha: LinhaAgendamentoBase): Promise<Agendamento> {
    const cliente = new Cliente(linha.cliente_nome, linha.cliente_telefone, linha.cliente_id);
    const profissional = new Profissional(
      linha.profissional_nome,
      linha.profissional_telefone,
      linha.especialidade,
      linha.profissional_id
    );
    const tratamentos = await this.buscarTratamentosDoAgendamento(linha.id);

    return new Agendamento(
      cliente,
      profissional,
      tratamentos,
      new Date(linha.data),
      new Horario(linha.hora_inicio.slice(0, 5)),
      linha.status,
      linha.id
    );
  }
}
