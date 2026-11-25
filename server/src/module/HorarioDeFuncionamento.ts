import { Horario } from "./Horario";
import { DiaSemana } from "./DiaSemana";
import { HorarioDisponivel } from "./HorarioDisponivel";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/** Um dia em que a clínica abre, com o intervalo de funcionamento (fechamento exclusivo). */
interface Expediente {
  abertura: Horario;
  fechamento: Horario;
}

/**
 * Dias da semana e horários em que a clínica funciona (aba "Horários"). Define quais
 * horários os profissionais podem liberar na grade e, com isso, quais o cliente pode
 * agendar: um atendimento só cabe dentro do expediente do dia. Dias que não aparecem
 * aqui são dias fechados.
 *
 * Também alimenta o "Aberto agora · Fecha às 18:00" da página do cliente.
 */
export class HorarioDeFuncionamento {
  private static readonly NOMES_DOS_DIAS = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

  private readonly expedientes: Map<DiaSemana, Expediente>;

  private constructor(expedientes: Map<DiaSemana, Expediente>) {
    if (expedientes.size === 0) {
      throw new ErroDeValidacao("Escolha pelo menos um dia de funcionamento.");
    }
    this.expedientes = expedientes;
  }

  /**
   * Lê o que veio da tela ou do banco: `{ dias: [{ diaSemana, abertura, fechamento }] }`,
   * só com os dias em que a clínica abre. Lança ErroDeValidacao com a mensagem para a tela.
   */
  public static ler(valor: unknown): HorarioDeFuncionamento {
    const dias = (valor as { dias?: unknown } | null)?.dias;
    if (!Array.isArray(dias)) {
      throw new ErroDeValidacao("Horário de funcionamento inválido.");
    }

    const expedientes = new Map<DiaSemana, Expediente>();
    for (const item of dias) {
      const { diaSemana, abertura, fechamento } = (item ?? {}) as Record<string, unknown>;
      if (!Number.isInteger(diaSemana) || !Object.values(DiaSemana).includes(diaSemana as number)) {
        throw new ErroDeValidacao("Dia da semana inválido no horário de funcionamento.");
      }
      const dia = diaSemana as DiaSemana;
      const nome = HorarioDeFuncionamento.NOMES_DOS_DIAS[dia];
      if (expedientes.has(dia)) {
        throw new ErroDeValidacao(`A ${nome} aparece mais de uma vez.`);
      }
      const inicio = HorarioDeFuncionamento.lerHorario(abertura, `abertura de ${nome}`);
      const fim = HorarioDeFuncionamento.lerHorario(fechamento, `fechamento de ${nome}`);
      if (fim.paraMinutos() <= inicio.paraMinutos()) {
        throw new ErroDeValidacao(`Na ${nome}, o fechamento precisa ser depois da abertura.`);
      }
      expedientes.set(dia, { abertura: inicio, fechamento: fim });
    }
    return new HorarioDeFuncionamento(expedientes);
  }

  private static lerHorario(valor: unknown, qual: string): Horario {
    if (typeof valor !== "string" || !Horario.ehValido(valor) || valor > "23:30") {
      throw new ErroDeValidacao(`Horário de ${qual} inválido (use horários de 30 em 30 minutos).`);
    }
    return new Horario(valor);
  }

  /** true se a clínica abre nesse dia da semana. */
  public abreNo(dia: DiaSemana): boolean {
    return this.expedientes.has(dia);
  }

  /**
   * true se um atendimento de 30min pode começar nesse horário: dentro do expediente do dia
   * (começa na abertura ou depois e termina no fechamento ou antes).
   */
  public permite(dia: DiaSemana, horario: Horario): boolean {
    const expediente = this.expedientes.get(dia);
    if (!expediente) {
      return false;
    }
    const inicio = horario.paraMinutos();
    return (
      inicio >= expediente.abertura.paraMinutos() &&
      inicio + Horario.DURACAO_SLOT_MINUTOS <= expediente.fechamento.paraMinutos()
    );
  }

  /** Só os horários liberados da grade que caem dentro do funcionamento. */
  public filtrarGrade(grade: HorarioDisponivel[]): HorarioDisponivel[] {
    return grade.filter((horario) =>
      this.permite(horario.getDiaSemana(), horario.getHoraInicio())
    );
  }

  /** Mensagem para quem tenta liberar um horário fora do funcionamento. */
  public explicarRecusa(dia: DiaSemana): string {
    const expediente = this.expedientes.get(dia);
    const nome = HorarioDeFuncionamento.NOMES_DOS_DIAS[dia];
    return expediente
      ? `Na ${nome} a clínica funciona das ${expediente.abertura} às ${expediente.fechamento}.`
      : `A clínica não funciona na ${nome}.`;
  }

  public toJSON() {
    return {
      dias: [...this.expedientes.entries()]
        .sort(([a], [b]) => a - b)
        .map(([diaSemana, expediente]) => ({
          diaSemana,
          abertura: expediente.abertura.toString(),
          fechamento: expediente.fechamento.toString(),
        })),
    };
  }
}
