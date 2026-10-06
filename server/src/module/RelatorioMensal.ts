import { Agendamento } from "./Agendamento";
import { StatusAgendamento } from "./StatusAgendamento";

interface FaturamentoDoDia {
  data: string; // "YYYY-MM-DD"
  valor: number;
  atendimentos: number;
}

interface FaturamentoDoProfissional {
  profissionalId: number;
  nome: string;
  atendimentos: number;
  faturamento: number;
}

interface TratamentoRealizado {
  tratamentoId: number;
  nome: string;
  quantidade: number;
  faturamento: number;
}

/**
 * Números de um mês da clínica para a aba "Relatórios". Só entram os
 * atendimentos FINALIZADOS: é o que de fato foi realizado e faturado
 * (agendados e em atendimento ainda podem não acontecer).
 */
export class RelatorioMensal {
  private static readonly FORMATO_MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

  private readonly mes: string; // "YYYY-MM"
  private readonly profissionalId: number | null; // null = todos os profissionais juntos
  private readonly finalizados: Agendamento[];

  constructor(mes: string, agendamentosDoMes: Agendamento[], profissionalId: number | null = null) {
    if (!RelatorioMensal.FORMATO_MES.test(mes)) {
      throw new Error('Mês inválido. Use o formato "AAAA-MM".');
    }
    if (profissionalId !== null && (!Number.isInteger(profissionalId) || profissionalId <= 0)) {
      throw new Error("Profissional inválido.");
    }

    this.mes = mes;
    this.profissionalId = profissionalId;
    this.finalizados = agendamentosDoMes.filter(
      (agendamento) =>
        agendamento.getStatus() === StatusAgendamento.FINALIZADO &&
        RelatorioMensal.dataDe(agendamento).startsWith(mes) &&
        (profissionalId === null || agendamento.getProfissional().getId() === profissionalId)
    );
  }

  /** Primeiro e último dia do mês, no formato usado nas consultas ("YYYY-MM-DD"). */
  public static periodo(mes: string): { inicio: string; fim: string } {
    const correspondencia = RelatorioMensal.FORMATO_MES.exec(mes);
    if (!correspondencia) {
      throw new Error('Mês inválido. Use o formato "AAAA-MM".');
    }
    const [, ano, mesNumero] = correspondencia;
    const ultimoDia = new Date(Date.UTC(Number(ano), Number(mesNumero), 0)).getUTCDate();
    return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimoDia).padStart(2, "0")}` };
  }

  private static dataDe(agendamento: Agendamento): string {
    return agendamento.getData().toISOString().slice(0, 10);
  }

  public getFaturamentoTotal(): number {
    return this.finalizados.reduce((total, agendamento) => total + agendamento.getValorTotal(), 0);
  }

  public getQuantidadeAtendimentos(): number {
    return this.finalizados.length;
  }

  public getTicketMedio(): number {
    const quantidade = this.getQuantidadeAtendimentos();
    return quantidade === 0 ? 0 : this.getFaturamentoTotal() / quantidade;
  }

  /** Um item para cada dia do mês, inclusive os dias sem atendimento (valor 0). */
  public getFaturamentoPorDia(): FaturamentoDoDia[] {
    const { fim } = RelatorioMensal.periodo(this.mes);
    const totalDias = Number(fim.slice(8, 10));

    const dias: FaturamentoDoDia[] = Array.from({ length: totalDias }, (_, indice) => ({
      data: `${this.mes}-${String(indice + 1).padStart(2, "0")}`,
      valor: 0,
      atendimentos: 0,
    }));

    for (const agendamento of this.finalizados) {
      const dia = dias[Number(RelatorioMensal.dataDe(agendamento).slice(8, 10)) - 1];
      dia.valor += agendamento.getValorTotal();
      dia.atendimentos += 1;
    }
    return dias;
  }

  /** Quanto cada profissional faturou no mês, do maior para o menor. */
  public getFaturamentoPorProfissional(): FaturamentoDoProfissional[] {
    const porProfissional = new Map<number, FaturamentoDoProfissional>();

    for (const agendamento of this.finalizados) {
      const profissional = agendamento.getProfissional();
      const id = profissional.getId() as number;
      const item = porProfissional.get(id) ?? {
        profissionalId: id,
        nome: profissional.getNome(),
        atendimentos: 0,
        faturamento: 0,
      };
      item.atendimentos += 1;
      item.faturamento += agendamento.getValorTotal();
      porProfissional.set(id, item);
    }

    return [...porProfissional.values()].sort(
      (a, b) => b.faturamento - a.faturamento || b.atendimentos - a.atendimentos
    );
  }

  /** Do mais realizado para o menos realizado (empate: o que faturou mais vem antes). */
  public getTratamentosMaisRealizados(): TratamentoRealizado[] {
    const porTratamento = new Map<number, TratamentoRealizado>();

    for (const agendamento of this.finalizados) {
      for (const tratamento of agendamento.getTratamentos()) {
        const id = tratamento.getId() as number;
        const item = porTratamento.get(id) ?? {
          tratamentoId: id,
          nome: tratamento.getNome(),
          quantidade: 0,
          faturamento: 0,
        };
        item.quantidade += 1;
        item.faturamento += tratamento.getValor();
        porTratamento.set(id, item);
      }
    }

    return [...porTratamento.values()].sort(
      (a, b) => b.quantidade - a.quantidade || b.faturamento - a.faturamento
    );
  }

  public toJSON() {
    return {
      mes: this.mes,
      profissionalId: this.profissionalId,
      faturamentoTotal: this.getFaturamentoTotal(),
      quantidadeAtendimentos: this.getQuantidadeAtendimentos(),
      ticketMedio: this.getTicketMedio(),
      faturamentoPorDia: this.getFaturamentoPorDia(),
      tratamentosMaisRealizados: this.getTratamentosMaisRealizados(),
      faturamentoPorProfissional: this.getFaturamentoPorProfissional(),
    };
  }
}
