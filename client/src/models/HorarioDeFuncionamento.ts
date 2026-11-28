import type { ExpedienteJSON, HorarioFuncionamentoJSON } from "../services/types";

/** Um dia da semana como aparece nas telas (0 = domingo ... 6 = sábado). */
export interface DiaDaSemana {
  numero: number;
  nome: string;
  curto: string;
}

/** Linha da lista "dias e horários" da página do cliente. */
export interface LinhaDoFuncionamento {
  dia: DiaDaSemana;
  /** "08:00 – 18:00" ou "Fechado". */
  texto: string;
  aberto: boolean;
  hoje: boolean;
}

/** Linha do editor da aba "Horários". */
export interface LinhaDeEdicao {
  diaSemana: number;
  aberto: boolean;
  abertura: string;
  fechamento: string;
}

/** Aberto ou fechado agora, com o texto do lado ("Fecha às 18:00", "Abre amanhã às 08:00"). */
export interface SituacaoAgora {
  aberto: boolean;
  detalhe: string;
}

/**
 * Dias e horários em que a clínica funciona. Mesmas regras do servidor
 * (HorarioDeFuncionamento), que é quem garante: um horário de 30min só pode ser liberado
 * na grade se começar na abertura ou depois e terminar no fechamento ou antes.
 *
 * Na página do cliente, diz se está aberto agora — só informativo: pelo site dá para
 * agendar a qualquer hora.
 */
export class HorarioDeFuncionamento {
  // A semana começa na segunda, como na grade de horários.
  public static readonly DIAS: DiaDaSemana[] = [
    { numero: 1, nome: "Segunda", curto: "Seg" },
    { numero: 2, nome: "Terça", curto: "Ter" },
    { numero: 3, nome: "Quarta", curto: "Qua" },
    { numero: 4, nome: "Quinta", curto: "Qui" },
    { numero: 5, nome: "Sexta", curto: "Sex" },
    { numero: 6, nome: "Sábado", curto: "Sáb" },
    { numero: 0, nome: "Domingo", curto: "Dom" },
  ];

  /** Horários que dá para escolher como abertura/fechamento (de 30 em 30 minutos). */
  public static readonly OPCOES_DE_HORARIO: string[] = Array.from({ length: 48 }, (_, i) =>
    HorarioDeFuncionamento.paraTexto(i * 30)
  );

  private static readonly SLOT_MINUTOS = 30;

  private readonly expedientes: Map<number, ExpedienteJSON>;

  constructor(json: HorarioFuncionamentoJSON) {
    this.expedientes = new Map(json.dias.map((dia) => [dia.diaSemana, dia]));
  }

  /** null quando a clínica ainda não definiu o funcionamento. */
  public static de(json: HorarioFuncionamentoJSON | null | undefined): HorarioDeFuncionamento | null {
    return json && json.dias.length > 0 ? new HorarioDeFuncionamento(json) : null;
  }

  public static diaPorNumero(numero: number): DiaDaSemana {
    return HorarioDeFuncionamento.DIAS.find((dia) => dia.numero === numero)!;
  }

  private static paraMinutos(texto: string): number {
    const [hora, minuto] = texto.split(":").map(Number);
    return hora * 60 + minuto;
  }

  private static paraTexto(minutos: number): string {
    const hora = String(Math.floor(minutos / 60)).padStart(2, "0");
    return `${hora}:${String(minutos % 60).padStart(2, "0")}`;
  }

  public abreNo(diaSemana: number): boolean {
    return this.expedientes.has(diaSemana);
  }

  public expedienteDe(diaSemana: number): ExpedienteJSON | null {
    return this.expedientes.get(diaSemana) ?? null;
  }

  /** true se um horário de 30min nesse dia cabe dentro do expediente. */
  public permite(diaSemana: number, horaInicio: string): boolean {
    const expediente = this.expedientes.get(diaSemana);
    if (!expediente) {
      return false;
    }
    const inicio = HorarioDeFuncionamento.paraMinutos(horaInicio);
    return (
      inicio >= HorarioDeFuncionamento.paraMinutos(expediente.abertura) &&
      inicio + HorarioDeFuncionamento.SLOT_MINUTOS <=
        HorarioDeFuncionamento.paraMinutos(expediente.fechamento)
    );
  }

  /** Linhas da grade de horários: da abertura mais cedo até o último horário que cabe. */
  public horasDaGrade(): string[] {
    const expedientes = [...this.expedientes.values()];
    const inicio = Math.min(...expedientes.map((e) => HorarioDeFuncionamento.paraMinutos(e.abertura)));
    const fim = Math.max(...expedientes.map((e) => HorarioDeFuncionamento.paraMinutos(e.fechamento)));
    const horas: string[] = [];
    for (let minutos = inicio; minutos + HorarioDeFuncionamento.SLOT_MINUTOS <= fim; minutos += 30) {
      horas.push(HorarioDeFuncionamento.paraTexto(minutos));
    }
    return horas;
  }

  /** "08:00 – 18:00" (null = fechado nesse dia). */
  public intervaloDe(diaSemana: number): string | null {
    const expediente = this.expedientes.get(diaSemana);
    return expediente ? `${expediente.abertura} – ${expediente.fechamento}` : null;
  }

  /** Aberto agora? E o que dizer do lado: quando fecha ou quando abre de novo. */
  public situacao(agora: Date = new Date()): SituacaoAgora {
    const hoje = agora.getDay();
    const minutos = agora.getHours() * 60 + agora.getMinutes();
    const expedienteDeHoje = this.expedientes.get(hoje);

    if (expedienteDeHoje) {
      const abre = HorarioDeFuncionamento.paraMinutos(expedienteDeHoje.abertura);
      const fecha = HorarioDeFuncionamento.paraMinutos(expedienteDeHoje.fechamento);
      if (minutos >= abre && minutos < fecha) {
        return { aberto: true, detalhe: `Fecha às ${expedienteDeHoje.fechamento}` };
      }
      if (minutos < abre) {
        return { aberto: false, detalhe: `Abre hoje às ${expedienteDeHoje.abertura}` };
      }
    }

    for (let diasDepois = 1; diasDepois <= 7; diasDepois++) {
      const dia = (hoje + diasDepois) % 7;
      const expediente = this.expedientes.get(dia);
      if (expediente) {
        const quando =
          diasDepois === 1 ? "amanhã" : HorarioDeFuncionamento.diaPorNumero(dia).nome.toLowerCase();
        return { aberto: false, detalhe: `Abre ${quando} às ${expediente.abertura}` };
      }
    }
    return { aberto: false, detalhe: "" };
  }

  /** A semana toda (de segunda a domingo), marcando o dia de hoje. */
  public linhasDaSemana(agora: Date = new Date()): LinhaDoFuncionamento[] {
    return HorarioDeFuncionamento.DIAS.map((dia) => {
      const intervalo = this.intervaloDe(dia.numero);
      return {
        dia,
        texto: intervalo ?? "Fechado",
        aberto: intervalo !== null,
        hoje: dia.numero === agora.getDay(),
      };
    });
  }

  // ---------- Edição (aba "Horários") ----------

  /**
   * As 7 linhas do editor. Sem funcionamento definido, sugere segunda a sábado,
   * das 08:00 às 18:00.
   */
  public static paraEdicao(atual: HorarioDeFuncionamento | null): LinhaDeEdicao[] {
    return HorarioDeFuncionamento.DIAS.map((dia) => {
      const expediente = atual?.expedienteDe(dia.numero) ?? null;
      return {
        diaSemana: dia.numero,
        aberto: atual ? expediente !== null : dia.numero !== 0,
        abertura: expediente?.abertura ?? "08:00",
        fechamento: expediente?.fechamento ?? "18:00",
      };
    });
  }

  /** Primeiro problema das linhas do editor (null = está tudo certo). */
  public static validarEdicao(linhas: LinhaDeEdicao[]): string | null {
    const abertas = linhas.filter((linha) => linha.aberto);
    if (abertas.length === 0) {
      return "Escolha pelo menos um dia de funcionamento.";
    }
    const invertida = abertas.find((linha) => linha.fechamento <= linha.abertura);
    return invertida
      ? `${HorarioDeFuncionamento.diaPorNumero(invertida.diaSemana).nome}: o fechamento precisa ser depois da abertura.`
      : null;
  }

  /** O que vai para o servidor (só os dias abertos). */
  public static jsonDaEdicao(linhas: LinhaDeEdicao[]): HorarioFuncionamentoJSON {
    return {
      dias: linhas
        .filter((linha) => linha.aberto)
        .map(({ diaSemana, abertura, fechamento }) => ({ diaSemana, abertura, fechamento })),
    };
  }
}
