/**
 * Teste de caixa branca — Horario
 * Caminhos cobertos:
 *  ehValido:   [C1] regex falha | [C2] regex ok e múltiplo de 30 | [C3] regex ok e não múltiplo
 *  construtor: [C4] valor inválido lança | [C5] valor válido
 *  somarSlots/minutosParaTexto: [C6] soma normal | [C7] passa da meia-noite (% 24) | [C8] zero slots
 *  equals:     [C9] iguais | [C10] diferentes
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Horario } from "../src/module/Horario";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

describe("Horario.ehValido", () => {
  test("[C1] formato fora do padrão HH:MM é inválido", () => {
    assert.equal(Horario.ehValido("9:00"), false);
    assert.equal(Horario.ehValido("09h00"), false);
    assert.equal(Horario.ehValido(""), false);
  });

  test("[C2] horário alinhado à grade de 30 min é válido", () => {
    assert.equal(Horario.ehValido("09:00"), true);
    assert.equal(Horario.ehValido("09:30"), true);
    assert.equal(Horario.ehValido("00:00"), true);
  });

  test("[C3] formato certo mas fora da grade é inválido", () => {
    assert.equal(Horario.ehValido("09:15"), false);
    assert.equal(Horario.ehValido("09:01"), false);
  });
});

describe("Horario construtor", () => {
  test("[C4] lança ErroDeValidacao para valor inválido", () => {
    assert.throws(() => new Horario("09:45"), ErroDeValidacao);
  });

  test("[C5] guarda o valor quando válido", () => {
    const h = new Horario("14:30");
    assert.equal(h.toString(), "14:30");
    assert.equal(h.toJSON(), "14:30");
    assert.equal(h.paraMinutos(), 14 * 60 + 30);
  });
});

describe("Horario.somarSlots", () => {
  test("[C6] soma slots de 30 minutos", () => {
    assert.equal(new Horario("09:00").somarSlots(3).toString(), "10:30");
  });

  test("[C7] passa da meia-noite volta para 00:xx", () => {
    assert.equal(new Horario("23:30").somarSlots(2).toString(), "00:30");
  });

  test("[C8] zero slots devolve o mesmo horário (novo objeto)", () => {
    const h = new Horario("10:00");
    const r = h.somarSlots(0);
    assert.notEqual(r, h);
    assert.ok(r.equals(h));
  });
});

describe("Horario.equals", () => {
  test("[C9] horários com mesmo valor são iguais", () => {
    assert.ok(new Horario("08:00").equals(new Horario("08:00")));
  });

  test("[C10] horários diferentes não são iguais", () => {
    assert.equal(new Horario("08:00").equals(new Horario("08:30")), false);
  });
});
