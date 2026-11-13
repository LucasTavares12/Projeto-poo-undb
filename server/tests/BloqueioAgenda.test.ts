/**
 * Teste de caixa branca — BloqueioAgenda
 * Construtor: [C1] dataInicio inválida | [C2] dataFim inválida | [C3] fim antes do início
 *             [C4] motivo > 150 | [C5] motivo null/trim | [C6] 366 dias ok (limite) | [C7] 367 dias lança
 *             [C8] início == fim (1 dia)
 * valeParaProfissional: [C9] clínica inteira | [C10] mesmo profissional | [C11] outro profissional
 * abrange: [C12] primeiro dia | [C13] último dia | [C14] antes | [C15] depois
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { BloqueioAgenda } from "../src/module/BloqueioAgenda";
import { DataAgenda } from "../src/module/DataAgenda";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const d = (texto: string) => DataAgenda.ler(texto);

describe("BloqueioAgenda construtor", () => {
  test("[C1] data inicial inválida lança erro", () => {
    assert.throws(
      () => new BloqueioAgenda(null, new Date("x"), d("2026-10-10"), "Férias"),
      ErroDeValidacao
    );
  });

  test("[C2] data final inválida lança erro", () => {
    assert.throws(
      () => new BloqueioAgenda(null, d("2026-10-10"), new Date("x"), "Férias"),
      ErroDeValidacao
    );
  });

  test("[C3] data final antes da inicial lança erro", () => {
    assert.throws(
      () => new BloqueioAgenda(null, d("2026-10-12"), d("2026-10-10"), "Férias"),
      ErroDeValidacao
    );
  });

  test("[C4] motivo com 151 caracteres lança erro", () => {
    assert.throws(
      () => new BloqueioAgenda(null, d("2026-10-10"), d("2026-10-10"), "m".repeat(151)),
      ErroDeValidacao
    );
  });

  test("[C5] motivo null vira vazio; motivo é aparado", () => {
    assert.equal(
      new BloqueioAgenda(null, d("2026-10-10"), d("2026-10-10"), null as unknown as string).getMotivo(),
      ""
    );
    assert.equal(
      new BloqueioAgenda(null, d("2026-10-10"), d("2026-10-10"), "  Feriado  ").getMotivo(),
      "Feriado"
    );
  });

  test("[C6] exatamente 366 dias é aceito (valor-limite)", () => {
    const b = new BloqueioAgenda(1, d("2028-01-01"), d("2028-12-31"), "Ano bissexto");
    assert.equal(b.getQuantidadeDias(), 366);
  });

  test("[C7] 367 dias lança erro", () => {
    assert.throws(
      () => new BloqueioAgenda(1, d("2028-01-01"), d("2029-01-01"), "Longo demais"),
      ErroDeValidacao
    );
  });

  test("[C8] início igual ao fim conta 1 dia", () => {
    const b = new BloqueioAgenda(1, d("2026-10-10"), d("2026-10-10"), "Folga", 9);
    assert.equal(b.getQuantidadeDias(), 1);
    assert.deepEqual(b.toJSON(), {
      id: 9,
      profissionalId: 1,
      dataInicio: "2026-10-10",
      dataFim: "2026-10-10",
      motivo: "Folga",
      quantidadeDias: 1,
    });
    assert.deepEqual(b.paraPublico(), { dataInicio: "2026-10-10", dataFim: "2026-10-10" });
  });
});

describe("BloqueioAgenda.valeParaProfissional", () => {
  test("[C9] bloqueio da clínica inteira vale para todos", () => {
    const b = new BloqueioAgenda(null, d("2026-12-25"), d("2026-12-25"), "Natal");
    assert.ok(b.ehDaClinicaInteira());
    assert.ok(b.valeParaProfissional(42));
  });

  test("[C10] bloqueio do próprio profissional", () => {
    assert.ok(new BloqueioAgenda(3, d("2026-10-10"), d("2026-10-10"), "").valeParaProfissional(3));
  });

  test("[C11] bloqueio de outro profissional não vale", () => {
    const b = new BloqueioAgenda(3, d("2026-10-10"), d("2026-10-10"), "");
    assert.equal(b.ehDaClinicaInteira(), false);
    assert.equal(b.valeParaProfissional(4), false);
  });
});

describe("BloqueioAgenda.abrange", () => {
  const b = new BloqueioAgenda(null, d("2026-10-10"), d("2026-10-12"), "Recesso");

  test("[C12] primeiro dia está incluído", () => assert.ok(b.abrange(d("2026-10-10"))));
  test("[C13] último dia está incluído", () => assert.ok(b.abrange(d("2026-10-12"))));
  test("[C14] dia anterior não está incluído", () => assert.equal(b.abrange(d("2026-10-09")), false));
  test("[C15] dia seguinte não está incluído", () => assert.equal(b.abrange(d("2026-10-13")), false));
});
