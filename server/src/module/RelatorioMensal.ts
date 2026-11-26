import { Agendamento } from "./Agendamento";
import { StatusAgendamento } from "./StatusAgendamento";
import { DataAgenda } from "./DataAgenda";
import { MesReferencia } from "./MesReferencia";
import { FormaDePagamento } from "./FormaDePagamento";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

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

interface FaturamentoDaFormaDePagamento {
  /** Código da forma ("PIX"...); null = o cliente não informou. */
  formaDePagamento: string | null;
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
  private readonly mes: MesReferencia;
  private readonly profissionalId: number | null; // null = todos os profissionais juntos
  private readonly finalizados: Agendamento[];
  /** Horários do mês em que o cliente não veio. */
  private readonly faltas: Agendamento[];

  /** `mes` = "AAAA-MM" (o `MesReferencia` valida). */
  constructor(mes: string, agendamentosDoMes: Agendamento[], profissionalId: number | null = null) {
    const referencia = new MesReferencia(mes);
    if (profissionalId !== null && (!Number.isInteger(profissionalId) || profissionalId <= 0)) {
      throw new ErroDeValidacao("Profissional inválido.");
    }

    this.mes = referencia;
    this.profissionalId = profissionalId;
    const doFiltro = agendamentosDoMes.filter(
      (agendamento) =>
        referencia.contem(RelatorioMensal.dataDe(agendamento)) &&
        (profissionalId === null || agendamento.getProfissional().getId() === profissionalId)
    );
    this.finalizados = doFiltro.filter(
      (agendamento) => agendamento.getStatus() === StatusAgendamento.FINALIZADO
    );
    this.faltas = doFiltro.filter((agendamento) => agendamento.faltou());
  }

  /** "AAAA-MM". */
  public getMes(): string {
    return this.mes.toString();
  }

  /** null = soma de todos os profissionais (clínica inteira). */
  public getProfissionalId(): number | null {
    return this.profissionalId;
  }

  private static dataDe(agendamento: Agendamento): string {
    return DataAgenda.paraTexto(agendamento.getData());
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

  public getQuantidadeFaltas(): number {
    return this.faltas.length;
  }

  /** Faltas sobre os horários encerrados do mês (atendidos + faltas), de 0 a 1. */
  public getTaxaDeFaltas(): number {
    const encerrados = this.faltas.length + this.finalizados.length;
    return encerrados === 0 ? 0 : this.faltas.length / encerrados;
  }

  /** Quanto entrou por cada forma de pagamento (inclusive "Não informada"), do maior para o menor. */
  public getFaturamentoPorFormaDePagamento(): FaturamentoDaFormaDePagamento[] {
    const porForma = new Map<string | null, FaturamentoDaFormaDePagamento>();

    for (const agendamento of this.finalizados) {
      const forma: FormaDePagamento | null = agendamento.getFormaDePagamento();
      const codigo = forma?.getCodigo() ?? null;
      const item = porForma.get(codigo) ?? {
        formaDePagamento: codigo,
        nome: forma?.getNome() ?? "Não informada",
        atendimentos: 0,
        faturamento: 0,
      };
      item.atendimentos += 1;
      item.faturamento += agendamento.getValorTotal();
      porForma.set(codigo, item);
    }

    return [...porForma.values()].sort(
      (a, b) => b.faturamento - a.faturamento || b.atendimentos - a.atendimentos
    );
  }

  /** Um item para cada dia do mês, inclusive os dias sem atendimento (valor 0). */
  public getFaturamentoPorDia(): FaturamentoDoDia[] {
    const quantidadeDeDias = this.mes.getQuantidadeDeDias();
    const dias: FaturamentoDoDia[] = Array.from({ length: quantidadeDeDias }, (_, indice) => ({
      data: this.mes.dia(indice + 1),
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
        item.faturamento += agendamento.getValorDo(tratamento);
        porTratamento.set(id, item);
      }
    }

    return [...porTratamento.values()].sort(
      (a, b) => b.quantidade - a.quantidade || b.faturamento - a.faturamento
    );
  }

  public toJSON() {
    return {
      mes: this.getMes(),
      profissionalId: this.profissionalId,
      faturamentoTotal: this.getFaturamentoTotal(),
      quantidadeAtendimentos: this.getQuantidadeAtendimentos(),
      ticketMedio: this.getTicketMedio(),
      faturamentoPorDia: this.getFaturamentoPorDia(),
      tratamentosMaisRealizados: this.getTratamentosMaisRealizados(),
      faturamentoPorProfissional: this.getFaturamentoPorProfissional(),
      quantidadeFaltas: this.getQuantidadeFaltas(),
      taxaDeFaltas: this.getTaxaDeFaltas(),
      faturamentoPorFormaDePagamento: this.getFaturamentoPorFormaDePagamento(),
    };
  }
}
