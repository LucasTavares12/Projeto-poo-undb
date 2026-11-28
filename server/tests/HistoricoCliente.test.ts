/**
 * Teste de caixa branca — HistoricoCliente
 * Caminhos cobertos:
 *  construtor:  [C1] lista vazia lança | [C2] ordena do mais recente (data e depois horário)
 *  agrupar:     [C3] junta pelo telefone (só os números), separa telefones diferentes
 *  getNome:     [C4] nome do agendamento mais recente
 *  combinaCom:  [C5] busca vazia/espaços → true (return antecipado) | [C6] nome sem acento/caixa, qualquer nome usado
 *               [C7] 3 ou mais dígitos do telefone | [C8] só 2 dígitos não busca no telefone (valor-limite)
 *               [C9] nem nome nem telefone → false
 *  getAtendimentos: [C10] só FINALIZADOS
 *  números:     [C11] sem atendimentos: ticket 0, último/primeiro null | [C12] total, ticket, último e primeiro
 *  getProximoAgendamento: [C13] o AGENDADO mais próximo a partir de hoje (hoje entra) | [C14] nenhum → null
 *  getTratamentosMaisFeitos: [C15] do mais feito para o menos; empate em ordem alfabética
 *  getProfissionais: [C16] sem repetir
 *  paraResumo:  [C17] campos null sem atendimentos e sem próximo | [C18] campos preenchidos
 *  paraFicha:   [C19] inclui números e todos os agendamentos
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { HistoricoCliente } from "../src/module/HistoricoCliente";
import { Agendamento } from "../src/module/Agendamento";
import { Cliente } from "../src/module/Cliente";
import { Profissional } from "../src/module/Profissional";
import { Tratamento } from "../src/module/Tratamento";
import { Horario } from "../src/module/Horario";
import { DataAgenda } from "../src/module/DataAgenda";
import { StatusAgendamento } from "../src/module/StatusAgendamento";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const TELEFONE = "(98) 98877-6655";
const ana = new Profissional("Ana", "(98) 98111-2222", "Estética", 1);
const bia = new Profissional("Bia", "(98) 98111-3333", "Massagem", 2);
const limpeza = new Tratamento("Limpeza", "", 100, 60, 10);
const massagem = new Tratamento("Massagem", "", 50, 30, 11);
const drenagem = new Tratamento("Drenagem", "", 70, 30, 12);

function ag(
  data: string,
  horario = "09:00",
  status = StatusAgendamento.FINALIZADO,
  extras: Partial<{ nome: string; telefone: string; tratamentos: Tratamento[]; profissional: Profissional }> = {}
) {
  return new Agendamento(
    new Cliente(extras.nome ?? "Mônica Souza", extras.telefone ?? TELEFONE),
    extras.profissional ?? ana,
    extras.tratamentos ?? [limpeza],
    DataAgenda.ler(data),
    new Horario(horario),
    status
  );
}

const datas = (lista: Agendamento[]) =>
  lista.map((a) => `${DataAgenda.paraTexto(a.getData())} ${a.getHorarioInicio()}`);

describe("HistoricoCliente — construtor e agrupar", () => {
  test("[C1] sem agendamentos lança erro", () => {
    assert.throws(() => new HistoricoCliente("98988776655", []), ErroDeValidacao);
  });

  test("[C2] ordena do mais recente para o mais antigo, desempatando pelo horário", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-01", "10:00"),
      ag("2026-10-05", "09:00"),
      ag("2026-10-01", "14:30"),
    ]);
    assert.deepEqual(datas(historico.paraFicha("2026-01-01").agendamentos), [
      "2026-10-05 09:00",
      "2026-10-01 14:30",
      "2026-10-01 10:00",
    ]);
  });

  test("[C3] agrupa pelo telefone (só os números) e separa telefones diferentes", () => {
    const grupos = HistoricoCliente.agrupar([
      ag("2026-10-01", "09:00", undefined, { telefone: "(98) 98877-6655" }),
      ag("2026-10-02", "09:00", undefined, { telefone: "98988776655" }),
      ag("2026-10-03", "09:00", undefined, { telefone: "(98) 3232-1234", nome: "Outra" }),
    ]);
    assert.equal(grupos.length, 2);
    assert.equal(grupos[0].getTelefone(), "98988776655");
    assert.equal(grupos[0].getAtendimentos().length, 2);
    assert.equal(grupos[1].getTelefone(), "9832321234");
    assert.deepEqual(HistoricoCliente.agrupar([]), []);
  });

  test("[C4] o nome é o do agendamento mais recente", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-05", "09:00", undefined, { nome: "Monica S." }),
      ag("2026-10-01", "09:00", undefined, { nome: "Mônica Souza" }),
    ]);
    assert.equal(historico.getNome(), "Monica S.");
  });
});

describe("HistoricoCliente.combinaCom", () => {
  const historico = new HistoricoCliente("98988776655", [
    ag("2026-10-05", "09:00", undefined, { nome: "Monica S." }),
    ag("2026-10-01", "09:00", undefined, { nome: "Mônica Souza" }),
  ]);

  test("[C5] busca vazia ou só com espaços combina com todos", () => {
    assert.ok(historico.combinaCom(""));
    assert.ok(historico.combinaCom("   "));
  });

  test("[C6] acha pelo nome sem diferenciar acento e maiúsculas, em qualquer nome usado", () => {
    assert.ok(historico.combinaCom("MONICA"));
    assert.ok(historico.combinaCom("mônica"));
    assert.ok(historico.combinaCom("souza")); // só o nome antigo tem "Souza"
  });

  test("[C7] acha por 3 ou mais dígitos do telefone, com ou sem máscara", () => {
    assert.ok(historico.combinaCom("988"));
    assert.ok(historico.combinaCom("(98) 98877"));
    assert.ok(historico.combinaCom("6655"));
  });

  test("[C8] só 2 dígitos não buscam no telefone (valor-limite)", () => {
    assert.equal(historico.combinaCom("98"), false);
  });

  test("[C9] nem o nome nem o telefone combinam", () => {
    assert.equal(historico.combinaCom("Carla"), false);
    assert.equal(historico.combinaCom("12345"), false);
  });
});

describe("HistoricoCliente — números", () => {
  test("[C10] só os finalizados contam como atendimento", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-01", "09:00", StatusAgendamento.FINALIZADO),
      ag("2026-10-02", "09:00", StatusAgendamento.AGENDADO),
      ag("2026-10-03", "09:00", StatusAgendamento.EM_ATENDIMENTO),
    ]);
    assert.deepEqual(datas(historico.getAtendimentos()), ["2026-10-01 09:00"]);
  });

  test("[C11] sem atendimentos: total e ticket 0, último e primeiro null", () => {
    const historico = new HistoricoCliente("98988776655", [ag("2026-10-02", "09:00", StatusAgendamento.AGENDADO)]);
    assert.equal(historico.getTotalGasto(), 0);
    assert.equal(historico.getTicketMedio(), 0);
    assert.equal(historico.getUltimoAtendimento(), null);
    assert.equal(historico.getPrimeiroAtendimento(), null);
  });

  test("[C12] total gasto, ticket médio, último e primeiro atendimento", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-01", "09:00", undefined, { tratamentos: [limpeza, massagem] }), // 150
      ag("2026-10-10", "09:00", undefined, { tratamentos: [massagem] }), // 50
      ag("2026-10-05", "09:00", undefined, { tratamentos: [limpeza] }), // 100
    ]);
    assert.equal(historico.getTotalGasto(), 300);
    assert.equal(historico.getTicketMedio(), 100);
    assert.equal(DataAgenda.paraTexto(historico.getUltimoAtendimento()!.getData()), "2026-10-10");
    assert.equal(DataAgenda.paraTexto(historico.getPrimeiroAtendimento()!.getData()), "2026-10-01");
  });
});

describe("HistoricoCliente.getProximoAgendamento", () => {
  test("[C13] devolve o AGENDADO mais próximo a partir de hoje (o próprio dia entra)", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-01", "09:00", StatusAgendamento.AGENDADO), // já passou
      ag("2026-10-20", "09:00", StatusAgendamento.AGENDADO),
      ag("2026-10-15", "14:00", StatusAgendamento.AGENDADO), // hoje
      ag("2026-10-15", "08:00", StatusAgendamento.EM_ATENDIMENTO), // não é AGENDADO
    ]);
    const proximo = historico.getProximoAgendamento("2026-10-15")!;
    assert.equal(`${DataAgenda.paraTexto(proximo.getData())} ${proximo.getHorarioInicio()}`, "2026-10-15 14:00");
  });

  test("[C14] sem agendamento futuro devolve null", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-01", "09:00", StatusAgendamento.AGENDADO),
      ag("2026-10-20", "09:00", StatusAgendamento.FINALIZADO),
    ]);
    assert.equal(historico.getProximoAgendamento("2026-10-15"), null);
  });
});

describe("HistoricoCliente — tratamentos e profissionais", () => {
  test("[C15] tratamentos do mais feito para o menos; empate em ordem alfabética", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-01", "09:00", undefined, { tratamentos: [massagem, limpeza] }),
      ag("2026-10-02", "09:00", undefined, { tratamentos: [massagem, drenagem] }),
      ag("2026-10-03", "09:00", StatusAgendamento.AGENDADO, { tratamentos: [limpeza] }), // não conta
    ]);
    assert.deepEqual(historico.getTratamentosMaisFeitos(), [
      { nome: "Massagem", quantidade: 2 },
      { nome: "Drenagem", quantidade: 1 },
      { nome: "Limpeza", quantidade: 1 },
    ]);
  });

  test("[C16] profissionais que atenderam, sem repetir", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-03", "09:00", undefined, { profissional: ana }),
      ag("2026-10-02", "09:00", undefined, { profissional: bia }),
      ag("2026-10-01", "09:00", undefined, { profissional: ana }),
    ]);
    assert.deepEqual(historico.getProfissionais(), ["Ana", "Bia"]);
  });
});

describe("HistoricoCliente — resumo e ficha", () => {
  test("[C17] resumo com campos null quando não há atendimento nem próximo horário", () => {
    const historico = new HistoricoCliente("98988776655", [ag("2026-10-01", "09:00", StatusAgendamento.AGENDADO)]);
    assert.deepEqual(historico.paraResumo("2026-10-15"), {
      telefone: "98988776655",
      nome: "Mônica Souza",
      atendimentos: 0,
      faltas: 0,
      totalGasto: 0,
      ultimoAtendimento: null,
      proximoAgendamento: null,
    });
  });

  test("[C18] resumo preenchido", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-01", "09:00"),
      ag("2026-10-20", "10:30", StatusAgendamento.AGENDADO),
    ]);
    assert.deepEqual(historico.paraResumo("2026-10-15"), {
      telefone: "98988776655",
      nome: "Mônica Souza",
      atendimentos: 1,
      faltas: 0,
      totalGasto: 100,
      ultimoAtendimento: "2026-10-01",
      proximoAgendamento: { data: "2026-10-20", horarioInicio: new Horario("10:30") },
    });
  });

  test("[C19] ficha traz os números e todos os agendamentos", () => {
    const historico = new HistoricoCliente("98988776655", [
      ag("2026-10-01", "09:00"),
      ag("2026-10-05", "09:00"),
      ag("2026-10-20", "10:30", StatusAgendamento.AGENDADO),
    ]);
    const ficha = historico.paraFicha("2026-10-15");
    assert.equal(ficha.atendimentos, 2);
    assert.equal(ficha.ticketMedio, 100);
    assert.equal(ficha.primeiroAtendimento, "2026-10-01");
    assert.equal(ficha.ultimoAtendimento, "2026-10-05");
    assert.deepEqual(ficha.tratamentosMaisFeitos, [{ nome: "Limpeza", quantidade: 2 }]);
    assert.deepEqual(ficha.profissionais, ["Ana"]);
    assert.equal(ficha.agendamentos.length, 3);
    // Na ficha, o próximo agendamento vem completo (o objeto), não só data e horário como no resumo.
    assert.ok(ficha.proximoAgendamento instanceof Agendamento);
    assert.equal(new HistoricoCliente("1", [ag("2026-10-01")]).paraFicha("2026-10-15").primeiroAtendimento, "2026-10-01");
    assert.equal(
      new HistoricoCliente("1", [ag("2026-10-01", "09:00", StatusAgendamento.AGENDADO)]).paraFicha("2026-10-15").primeiroAtendimento,
      null
    );
  });
});
