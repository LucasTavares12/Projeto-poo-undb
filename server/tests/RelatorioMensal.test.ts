/**
 * Teste de caixa branca — RelatorioMensal
 * Caminhos cobertos:
 *  construtor:  [C1] mês fora do formato "AAAA-MM" | [C2] profissional zero/negativo/não inteiro
 *               [C3] profissional null ou inteiro positivo ok
 *  filtro:      [C4] só FINALIZADO entra | [C5] outro mês fica fora (2º termo do &&)
 *               [C6] com profissional, só os dele entram (3º termo do &&)
 *  período (via MesReferencia): [C7] mês inexistente (13) lança | [C8] meses de 31, 30, 28 e 29 dias (bissexto), dezembro
 *  getTicketMedio: [C9] sem atendimentos devolve 0 (sem dividir por zero) | [C10] média
 *  getFaturamentoPorDia: [C11] mês vazio: todos os dias com 0 | [C12] soma no dia certo (1º e último dia)
 *  getFaturamentoPorProfissional: [C13] agrupa e ordena pelo faturamento
 *                                 [C14] empate no faturamento: mais atendimentos vem antes
 *  getTratamentosMaisRealizados:  [C15] conta cada tratamento de cada agendamento
 *                                 [C16] empate na quantidade: maior faturamento vem antes
 *  toJSON:      [C17] junta todos os números
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { RelatorioMensal } from "../src/module/RelatorioMensal";
import { Agendamento } from "../src/module/Agendamento";
import { Cliente } from "../src/module/Cliente";
import { Profissional } from "../src/module/Profissional";
import { Tratamento } from "../src/module/Tratamento";
import { Horario } from "../src/module/Horario";
import { DataAgenda } from "../src/module/DataAgenda";
import { StatusAgendamento } from "../src/module/StatusAgendamento";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const cliente = new Cliente("Maria", "(98) 98877-6655", 1);
const ana = new Profissional("Ana", "(98) 98111-2222", "Estética", 1);
const bia = new Profissional("Bia", "(98) 98111-3333", "Massagem", 2);
const limpeza = new Tratamento("Limpeza", "", 100, 60, 10);
const massagem = new Tratamento("Massagem", "", 80, 30, 11);
const pacote = new Tratamento("Pacote", "", 200, 60, 12);

function ag(
  data: string,
  status = StatusAgendamento.FINALIZADO,
  profissional = ana,
  tratamentos = [limpeza]
) {
  return new Agendamento(cliente, profissional, tratamentos, DataAgenda.ler(data), new Horario("09:00"), status);
}

describe("RelatorioMensal — construtor", () => {
  test("[C1] mês fora do formato lança erro", () => {
    for (const mes of ["2026-13", "2026-00", "2026-1", "26-01", "2026/10", ""]) {
      assert.throws(() => new RelatorioMensal(mes, []), ErroDeValidacao, mes);
    }
  });

  test("[C2] profissional zero, negativo ou não inteiro lança erro", () => {
    assert.throws(() => new RelatorioMensal("2026-10", [], 0), ErroDeValidacao);
    assert.throws(() => new RelatorioMensal("2026-10", [], -1), ErroDeValidacao);
    assert.throws(() => new RelatorioMensal("2026-10", [], 1.5), ErroDeValidacao);
  });

  test("[C3] profissional null (todos) ou inteiro positivo é aceito", () => {
    assert.equal(new RelatorioMensal("2026-10", []).toJSON().profissionalId, null);
    assert.equal(new RelatorioMensal("2026-10", [], 1).toJSON().profissionalId, 1);
  });
});

describe("RelatorioMensal — quais agendamentos entram", () => {
  test("[C4] só os FINALIZADOS entram", () => {
    const relatorio = new RelatorioMensal("2026-10", [
      ag("2026-10-05", StatusAgendamento.AGENDADO),
      ag("2026-10-05", StatusAgendamento.EM_ATENDIMENTO),
      ag("2026-10-05", StatusAgendamento.FINALIZADO),
    ]);
    assert.equal(relatorio.getQuantidadeAtendimentos(), 1);
  });

  test("[C5] agendamento de outro mês fica fora", () => {
    const relatorio = new RelatorioMensal("2026-10", [
      ag("2026-09-30"),
      ag("2026-10-01"),
      ag("2026-11-01"),
    ]);
    assert.equal(relatorio.getQuantidadeAtendimentos(), 1);
  });

  test("[C6] com profissional, só os atendimentos dele entram", () => {
    const lista = [ag("2026-10-05", undefined, ana), ag("2026-10-05", undefined, bia), ag("2026-10-06", undefined, bia)];
    assert.equal(new RelatorioMensal("2026-10", lista).getQuantidadeAtendimentos(), 3);
    assert.equal(new RelatorioMensal("2026-10", lista, 2).getQuantidadeAtendimentos(), 2);
    assert.equal(new RelatorioMensal("2026-10", lista, 99).getQuantidadeAtendimentos(), 0);
  });
});

describe("RelatorioMensal — período do mês", () => {
  const dias = (mes: string) => new RelatorioMensal(mes, []).getFaturamentoPorDia();

  test("[C7] mês inexistente lança erro", () => {
    assert.throws(() => new RelatorioMensal("2026-13", []), ErroDeValidacao);
    assert.throws(() => new RelatorioMensal("2026-00", []), ErroDeValidacao);
  });

  test("[C8] último dia certo para cada tamanho de mês", () => {
    const outubro = dias("2026-10");
    assert.equal(outubro[0].data, "2026-10-01");
    assert.equal(outubro.at(-1)?.data, "2026-10-31");
    assert.equal(dias("2026-11").at(-1)?.data, "2026-11-30");
    assert.equal(dias("2026-02").at(-1)?.data, "2026-02-28");
    assert.equal(dias("2028-02").at(-1)?.data, "2028-02-29"); // bissexto
    assert.equal(dias("2026-12").at(-1)?.data, "2026-12-31"); // mês 12 não vira o ano seguinte
  });
});

describe("RelatorioMensal — totais", () => {
  test("[C9] sem atendimentos: faturamento e ticket médio são 0", () => {
    const relatorio = new RelatorioMensal("2026-10", []);
    assert.equal(relatorio.getFaturamentoTotal(), 0);
    assert.equal(relatorio.getTicketMedio(), 0);
  });

  test("[C10] ticket médio = faturamento / atendimentos", () => {
    const relatorio = new RelatorioMensal("2026-10", [
      ag("2026-10-05", undefined, ana, [limpeza, massagem]), // 180
      ag("2026-10-06", undefined, ana, [massagem]), // 80
    ]);
    assert.equal(relatorio.getFaturamentoTotal(), 260);
    assert.equal(relatorio.getTicketMedio(), 130);
  });
});

describe("RelatorioMensal.getFaturamentoPorDia", () => {
  test("[C11] mês sem atendimentos: um item zerado para cada dia", () => {
    const dias = new RelatorioMensal("2026-11", []).getFaturamentoPorDia();
    assert.equal(dias.length, 30);
    assert.deepEqual(dias[0], { data: "2026-11-01", valor: 0, atendimentos: 0 });
    assert.equal(dias[29].data, "2026-11-30");
    assert.ok(dias.every((dia) => dia.valor === 0 && dia.atendimentos === 0));
  });

  test("[C12] cada atendimento soma no próprio dia (inclusive no 1º e no último)", () => {
    const dias = new RelatorioMensal("2026-10", [
      ag("2026-10-01"),
      ag("2026-10-15", undefined, ana, [limpeza, massagem]),
      ag("2026-10-15"),
      ag("2026-10-31", undefined, ana, [massagem]),
    ]).getFaturamentoPorDia();
    assert.deepEqual(dias[0], { data: "2026-10-01", valor: 100, atendimentos: 1 });
    assert.deepEqual(dias[14], { data: "2026-10-15", valor: 280, atendimentos: 2 });
    assert.deepEqual(dias[30], { data: "2026-10-31", valor: 80, atendimentos: 1 });
    assert.equal(dias[1].valor, 0);
  });
});

describe("RelatorioMensal.getFaturamentoPorProfissional", () => {
  test("[C13] agrupa por profissional e ordena do maior faturamento para o menor", () => {
    const lista = new RelatorioMensal("2026-10", [
      ag("2026-10-05", undefined, ana, [massagem]),
      ag("2026-10-05", undefined, bia, [pacote]),
      ag("2026-10-06", undefined, ana, [massagem]),
    ]).getFaturamentoPorProfissional();
    assert.deepEqual(lista, [
      { profissionalId: 2, nome: "Bia", atendimentos: 1, faturamento: 200 },
      { profissionalId: 1, nome: "Ana", atendimentos: 2, faturamento: 160 },
    ]);
  });

  test("[C14] empate no faturamento: quem atendeu mais vem antes", () => {
    const lista = new RelatorioMensal("2026-10", [
      ag("2026-10-05", undefined, ana, [pacote]), // Ana: 1 atendimento, 200
      ag("2026-10-05", undefined, bia, [limpeza]), // Bia: 2 atendimentos, 200
      ag("2026-10-06", undefined, bia, [limpeza]),
    ]).getFaturamentoPorProfissional();
    assert.deepEqual(lista.map((item) => item.nome), ["Bia", "Ana"]);
  });
});

describe("RelatorioMensal.getTratamentosMaisRealizados", () => {
  test("[C15] conta cada tratamento de cada agendamento (laço dentro de laço)", () => {
    const lista = new RelatorioMensal("2026-10", [
      ag("2026-10-05", undefined, ana, [limpeza, massagem]),
      ag("2026-10-06", undefined, ana, [massagem]),
    ]).getTratamentosMaisRealizados();
    assert.deepEqual(lista, [
      { tratamentoId: 11, nome: "Massagem", quantidade: 2, faturamento: 160 },
      { tratamentoId: 10, nome: "Limpeza", quantidade: 1, faturamento: 100 },
    ]);
  });

  test("[C16] empate na quantidade: o que faturou mais vem antes", () => {
    const lista = new RelatorioMensal("2026-10", [
      ag("2026-10-05", undefined, ana, [massagem]),
      ag("2026-10-06", undefined, ana, [pacote]),
    ]).getTratamentosMaisRealizados();
    assert.deepEqual(lista.map((item) => item.nome), ["Pacote", "Massagem"]);
  });
});

describe("RelatorioMensal.toJSON", () => {
  test("[C17] junta todos os números do mês", () => {
    const json = new RelatorioMensal("2026-10", [ag("2026-10-05")], 1).toJSON();
    assert.equal(json.mes, "2026-10");
    assert.equal(json.profissionalId, 1);
    assert.equal(json.faturamentoTotal, 100);
    assert.equal(json.quantidadeAtendimentos, 1);
    assert.equal(json.ticketMedio, 100);
    assert.equal(json.faturamentoPorDia.length, 31);
    assert.equal(json.tratamentosMaisRealizados.length, 1);
    assert.equal(json.faturamentoPorProfissional.length, 1);
  });
});
