import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { HorarioDisponivel } from "../module/HorarioDisponivel";
import { DiaSemana } from "../module/DiaSemana";
import { Horario } from "../module/Horario";

interface LinhaHorarioDisponivel extends RowDataPacket {
  id: number;
  profissional_id: number;
  dia_semana: number;
  hora_inicio: string; // vem como "HH:MM:SS"
}

export class HorarioDisponivelRepository extends Repositorio {
  public async salvar(horario: HorarioDisponivel): Promise<HorarioDisponivel> {
    const [resultado] = await this.pool.query<ResultSetHeader>(
      "INSERT INTO horarios_disponiveis (profissional_id, dia_semana, hora_inicio) VALUES (?, ?, ?)",
      [horario.getProfissionalId(), horario.getDiaSemana(), horario.getHoraInicio().toString()]
    );
    return new HorarioDisponivel(
      horario.getProfissionalId(),
      horario.getDiaSemana(),
      horario.getHoraInicio(),
      resultado.insertId
    );
  }

  public async listarPorProfissional(profissionalId: number): Promise<HorarioDisponivel[]> {
    const [linhas] = await this.pool.query<LinhaHorarioDisponivel[]>(
      "SELECT * FROM horarios_disponiveis WHERE profissional_id = ? ORDER BY dia_semana, hora_inicio",
      [profissionalId]
    );
    return linhas.map((linha) => this.paraHorarioDisponivel(linha));
  }

  public async buscarPorId(id: number): Promise<HorarioDisponivel | null> {
    const [linhas] = await this.pool.query<LinhaHorarioDisponivel[]>(
      "SELECT * FROM horarios_disponiveis WHERE id = ?",
      [id]
    );
    return linhas.length > 0 ? this.paraHorarioDisponivel(linhas[0]) : null;
  }

  public async deletar(id: number): Promise<void> {
    await this.pool.query("DELETE FROM horarios_disponiveis WHERE id = ?", [id]);
  }

  private paraHorarioDisponivel(linha: LinhaHorarioDisponivel): HorarioDisponivel {
    return new HorarioDisponivel(
      linha.profissional_id,
      linha.dia_semana as DiaSemana,
      new Horario(linha.hora_inicio.slice(0, 5)),
      linha.id
    );
  }
}
