/**
 * Teste de caixa branca — RelogioClinica
 * O "agora" é controlado com mock.timers (Date falso) e o fuso com process.env.TZ,
 * para os testes não dependerem da hora nem do fuso do computador.
 * Caminhos cobertos:
 *  configurarFuso:  [C1] usa FUSO_CLINICA quando existe | [C2] sem ela, usa o padrão (Brasília)
 *  deslocamentoUtc: [C3] fuso negativo ("-03:00") | [C4] UTC ("+00:00") | [C5] fuso com meia hora ("+05:30")
 *  hoje:            [C6] "YYYY-MM-DD" com zero à esquerda no mês e no dia
 *  momento:         [C7] junta o dia da agenda (UTC) com o horário no fuso local
 *  jaPassouHoje:    [C8] horário anterior → true | [C9] exatamente agora → true (<=) | [C10] depois → false
 */
import { test, describe, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { RelogioClinica } from "../src/module/RelogioClinica";
import { DataAgenda } from "../src/module/DataAgenda";
import { Horario } from "../src/module/Horario";

const tzOriginal = process.env.TZ;
const fusoOriginal = process.env.FUSO_CLINICA;

function restaurar(nome: "TZ" | "FUSO_CLINICA", valor: string | undefined) {
  if (valor === undefined) {
    delete process.env[nome];
  } else {
    process.env[nome] = valor;
  }
}

afterEach(() => {
  restaurar("TZ", tzOriginal);
  restaurar("FUSO_CLINICA", fusoOriginal);
});

describe("RelogioClinica.configurarFuso", () => {
  test("[C1] usa o fuso da variável FUSO_CLINICA", () => {
    process.env.FUSO_CLINICA = "America/Manaus";
    RelogioClinica.configurarFuso();
    assert.equal(process.env.TZ, "America/Manaus");
  });

  test("[C2] sem FUSO_CLINICA usa o horário de Brasília", () => {
    delete process.env.FUSO_CLINICA;
    RelogioClinica.configurarFuso();
    assert.equal(process.env.TZ, RelogioClinica.FUSO_PADRAO);
    assert.equal(RelogioClinica.FUSO_PADRAO, "America/Sao_Paulo");
  });
});

describe("RelogioClinica.deslocamentoUtc", () => {
  test("[C3] Brasília fica 3 horas atrás do UTC", () => {
    process.env.TZ = "America/Sao_Paulo";
    assert.equal(RelogioClinica.deslocamentoUtc(), "-03:00");
  });

  test("[C4] UTC não tem deslocamento", () => {
    process.env.TZ = "UTC";
    assert.equal(RelogioClinica.deslocamentoUtc(), "+00:00");
  });

  test("[C5] fuso com meia hora mostra os minutos", () => {
    process.env.TZ = "Asia/Kolkata";
    assert.equal(RelogioClinica.deslocamentoUtc(), "+05:30");
  });
});

describe("RelogioClinica — com o relógio controlado", () => {
  beforeEach(() => {
    process.env.TZ = "America/Sao_Paulo";
  });
  afterEach(() => {
    mock.timers.reset();
  });

  const congelarEm = (agora: Date) => mock.timers.enable({ apis: ["Date"], now: agora });

  test("[C6] hoje vem no formato da agenda, com zeros à esquerda", () => {
    congelarEm(new Date(2026, 0, 5, 10, 0)); // 5 de janeiro, no fuso local
    assert.equal(RelogioClinica.hoje(), "2026-01-05");
  });

  test("[C7] momento junta o dia da agenda com o horário no fuso da clínica", () => {
    const momento = RelogioClinica.momento(DataAgenda.ler("2026-10-22"), new Horario("09:30"));
    assert.equal(momento.toISOString(), "2026-10-22T12:30:00.000Z"); // 09:30 em Brasília = 12:30 UTC
  });

  test("[C8] horário que já passou hoje", () => {
    congelarEm(new Date(2026, 9, 22, 10, 15));
    assert.equal(RelogioClinica.jaPassouHoje(new Horario("10:00")), true);
  });

  test("[C9] horário que começa exatamente agora conta como passado (valor-limite)", () => {
    congelarEm(new Date(2026, 9, 22, 10, 30));
    assert.equal(RelogioClinica.jaPassouHoje(new Horario("10:30")), true);
  });

  test("[C10] horário ainda por vir", () => {
    congelarEm(new Date(2026, 9, 22, 10, 15));
    assert.equal(RelogioClinica.jaPassouHoje(new Horario("10:30")), false);
  });
});
