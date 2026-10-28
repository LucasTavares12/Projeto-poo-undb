import { Agendamento } from "./Agendamento";
import { BloqueioAgenda } from "./BloqueioAgenda";
import { DataAgenda } from "./DataAgenda";
import { Horario } from "./Horario";
import { HorarioDisponivel } from "./HorarioDisponivel";
import { Profissional } from "./Profissional";
import { RelogioClinica } from "./RelogioClinica";

/**
 * O que ocupa uma faixa da agenda num dia:
 * - agendamento: um atendimento marcado (ocupa `slots` faixas de 30min seguidas);
 * - livre: horário liberado na grade e sem ninguém marcado;
 * - passado: horário liberado que já passou (não dá mais para usar);
 * - fechado: horário liberado num dia de folga, férias ou feriado.
 */
type TipoDeBloco = "agendamento" | "livre" | "passado" | "fechado";

interface Bloco {
  tipo: TipoDeBloco;
  horario: string;
  slots: number;
  agendamento?: Agendamento;
}

/** Um dia da agenda do profissional, já dividido em blocos para desenhar na tela. */
class DiaDaAgenda {
  private readonly data: Date;
  private readonly bloqueio: BloqueioAgenda | null;
  private readonly blocos: Bloco[];

  constructor(
    data: Date,
    linhas: string[],
    liberados: Set<string>,
    agendamentos: Agendamento[],
    bloqueio: BloqueioAgenda | null,
    agora: Date
  ) {
    this.data = data;
    this.bloqueio = bloqueio;
    this.blocos = this.montarBlocos(linhas, liberados, agendamentos, agora);
  }

  /**
   * Percorre as linhas (horários) do dia: onde começa um agendamento, ele ocupa todas as faixas
   * da sua duração; as faixas liberadas que sobram ficam livres, passadas ou fechadas.
   */
  private montarBlocos(
    linhas: string[],
    liberados: Set<string>,
    agendamentos: Agendamento[],
    agora: Date
  ): Bloco[] {
    const porInicio = new Map(
      agendamentos.map((agendamento) => [agendamento.getHorarioInicio().toString(), agendamento])
    );
    const blocos: Bloco[] = [];
    let ocupadoAte = -1; // índice da última linha coberta por um agendamento

    linhas.forEach((horario, indice) => {
      const agendamento = porInicio.get(horario);
      if (agendamento && indice > ocupadoAte) {
        const slots = agendamento.getQuantidadeSlots();
        blocos.push({ tipo: "agendamento", horario, slots, agendamento });
        ocupadoAte = indice + slots - 1;
        return;
      }
      if (indice <= ocupadoAte || !liberados.has(horario)) {
        return;
      }
      blocos.push({ tipo: this.situacaoDoHorarioLiberado(horario, agora), horario, slots: 1 });
    });
    return blocos;
  }

  private situacaoDoHorarioLiberado(horario: string, agora: Date): TipoDeBloco {
    if (this.bloqueio) {
      return "fechado";
    }
    const inicio = RelogioClinica.momento(this.data, new Horario(horario));
    return inicio.getTime() <= agora.getTime() ? "passado" : "livre";
  }

  public toJSON() {
    return {
      data: DataAgenda.paraTexto(this.data),
      fechado: this.bloqueio !== null,
      motivoFechado: this.bloqueio?.getMotivo() || null,
      agendamentos: this.blocos.filter((bloco) => bloco.tipo === "agendamento").length,
      livres: this.blocos.filter((bloco) => bloco.tipo === "livre").length,
      blocos: this.blocos,
    };
  }
}

/**
 * Semana (ou outro período) da agenda de um profissional: cruza a grade semanal liberada,
 * os agendamentos e as folgas/feriados, e diz o que há em cada horário de cada dia.
 */
export class AgendaSemanal {
  public static readonly DIAS_PADRAO = 7;

  private readonly profissional: Profissional;
  private readonly inicio: Date;
  /** Horários (linhas da agenda) usados em pelo menos um dia do período. */
  private readonly linhas: string[];
  private readonly dias: DiaDaAgenda[];

  constructor(
    profissional: Profissional,
    inicio: Date,
    quantidadeDias: number,
    grade: HorarioDisponivel[],
    agendamentos: Agendamento[],
    bloqueios: BloqueioAgenda[],
    agora: Date = new Date()
  ) {
    if (!Number.isInteger(quantidadeDias) || quantidadeDias < 1 || quantidadeDias > 31) {
      throw new Error("Escolha um período de 1 a 31 dias.");
    }
    this.profissional = profissional;
    this.inicio = inicio;

    const datas = Array.from({ length: quantidadeDias }, (_, indice) => {
      const data = new Date(inicio);
      data.setUTCDate(data.getUTCDate() + indice);
      return data;
    });

    this.linhas = AgendaSemanal.calcularLinhas(datas, grade, agendamentos);
    this.dias = datas.map((data) => {
      const dia = DataAgenda.paraTexto(data);
      const doDia = agendamentos.filter(
        (agendamento) => DataAgenda.paraTexto(agendamento.getData()) === dia
      );
      const liberados = new Set(
        grade
          .filter((horario) => horario.getDiaSemana() === data.getUTCDay())
          .map((horario) => horario.getHoraInicio().toString())
      );
      const bloqueio = bloqueios.find((item) => item.abrange(data)) ?? null;
      return new DiaDaAgenda(data, this.linhas, liberados, doDia, bloqueio, agora);
    });
  }

  /**
   * As linhas da agenda: todo horário liberado na grade nos dias do período, mais as faixas
   * ocupadas por agendamentos (mesmo que hoje estejam fora da grade), em ordem.
   */
  private static calcularLinhas(
    datas: Date[],
    grade: HorarioDisponivel[],
    agendamentos: Agendamento[]
  ): string[] {
    const diasDaSemana = new Set(datas.map((data) => data.getUTCDay()));
    const horarios = new Set(
      grade
        .filter((horario) => diasDaSemana.has(horario.getDiaSemana()))
        .map((horario) => horario.getHoraInicio().toString())
    );
    for (const agendamento of agendamentos) {
      agendamento.getHorariosOcupados().forEach((horario) => horarios.add(horario.toString()));
    }
    return [...horarios].sort();
  }

  public toJSON() {
    return {
      profissional: this.profissional,
      inicio: DataAgenda.paraTexto(this.inicio),
      horarios: this.linhas,
      dias: this.dias,
    };
  }
}
