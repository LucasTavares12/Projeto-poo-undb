export interface DiaDaGrade {
  numero: number;
  nome: string;
}

/**
 * Grade semanal de horários (de 30 em 30 minutos) que o admin usa para
 * liberar os horários de atendimento de um profissional.
 */
export class GradeSemanal {
  // Segue a numeração do enum DiaSemana do backend (0 = domingo), começando a semana na segunda.
  public static readonly DIAS: DiaDaGrade[] = [
    { numero: 1, nome: "Seg" },
    { numero: 2, nome: "Ter" },
    { numero: 3, nome: "Qua" },
    { numero: 4, nome: "Qui" },
    { numero: 5, nome: "Sex" },
    { numero: 6, nome: "Sáb" },
    { numero: 0, nome: "Dom" },
  ];

  private readonly horas: string[] = [];

  /** `horaFinal` é exclusiva: de 7 a 21 gera de "07:00" até "20:30". */
  constructor(horaInicial = 7, horaFinal = 21) {
    for (let hora = horaInicial; hora < horaFinal; hora++) {
      const texto = String(hora).padStart(2, "0");
      this.horas.push(`${texto}:00`, `${texto}:30`);
    }
  }

  /** Identifica uma célula da grade (dia da semana + horário). */
  public static chave(diaSemana: number, horaInicio: string): string {
    return `${diaSemana}-${horaInicio}`;
  }

  /** Linhas da grade; `extras` garante que horários já liberados fora da faixa padrão apareçam. */
  public getHoras(extras: string[] = []): string[] {
    return [...new Set([...this.horas, ...extras])].sort();
  }
}
