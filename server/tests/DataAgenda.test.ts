/**
 * Teste de caixa branca — DataAgenda e AntecedenciaMinima
 * DataAgenda.ler: [C1] formato errado | [C2] formato certo mas data impossível (NaN) | [C3] null
 *                 [C4] data válida | [C5] mensagem de erro personalizada
 * DataAgenda.mesmoDia: [C6] mesmo dia | [C7] dias diferentes
 * AntecedenciaMinima.permite: [C8] exatamente 2h (limite, >=) | [C9] 2h - 1ms | [C10] bem antes | [C11] já passou
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DataAgenda } from "../src/module/DataAgenda";
import { AntecedenciaMinima } from "../src/module/AntecedenciaMinima";
import { RelogioClinica } from "../src/module/RelogioClinica";
import { Horario } from "../src/module/Horario";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

describe("DataAgenda.ler", () => {
  test("[C1] formato diferente de YYYY-MM-DD lança erro", () => {
    assert.throws(() => DataAgenda.ler("22/10/2026"), ErroDeValidacao);
    assert.throws(() => DataAgenda.ler("2026-1-5"), ErroDeValidacao);
  });

  test("[C2] formato certo mas data inexistente lança erro", () => {
    assert.throws(() => DataAgenda.ler("2026-13-40"), ErroDeValidacao);
  });

  test("[C3] null/undefined lança erro", () => {
    assert.throws(() => DataAgenda.ler(null), ErroDeValidacao);
    assert.throws(() => DataAgenda.ler(undefined), ErroDeValidacao);
  });

  test("[C4] data válida vira meia-noite UTC", () => {
    const d = DataAgenda.ler("2026-10-22");
    assert.equal(d.toISOString(), "2026-10-22T00:00:00.000Z");
    assert.equal(DataAgenda.paraTexto(d), "2026-10-22");
  });

  test("[C5] usa a mensagem de erro informada", () => {
    assert.throws(() => DataAgenda.ler("x", "Data do bloqueio inválida."), {
      message: "Data do bloqueio inválida.",
    });
  });
});

describe("DataAgenda.mesmoDia", () => {
  test("[C6] horas diferentes no mesmo dia UTC", () => {
    assert.ok(
      DataAgenda.mesmoDia(new Date("2026-10-22T00:00:00Z"), new Date("2026-10-22T23:59:00Z"))
    );
  });

  test("[C7] dias diferentes", () => {
    assert.equal(
      DataAgenda.mesmoDia(new Date("2026-10-22T00:00:00Z"), new Date("2026-10-23T00:00:00Z")),
      false
    );
  });
});

describe("AntecedenciaMinima.permite", () => {
  const data = DataAgenda.ler("2026-10-22");
  const horario = new Horario("14:00");
  const inicio = RelogioClinica.momento(data, horario).getTime();
  const DUAS_HORAS = AntecedenciaMinima.HORAS * 60 * 60 * 1000;

  test("[C8] exatamente 2h antes é permitido (operador >=)", () => {
    assert.equal(AntecedenciaMinima.permite(data, horario, new Date(inicio - DUAS_HORAS)), true);
  });

  test("[C9] 1 ms a menos que 2h não é permitido", () => {
    assert.equal(
      AntecedenciaMinima.permite(data, horario, new Date(inicio - DUAS_HORAS + 1)),
      false
    );
  });

  test("[C10] um dia antes é permitido", () => {
    assert.equal(
      AntecedenciaMinima.permite(data, horario, new Date(inicio - 24 * 60 * 60 * 1000)),
      true
    );
  });

  test("[C11] horário que já passou não é permitido", () => {
    assert.equal(AntecedenciaMinima.permite(data, horario, new Date(inicio + 1000)), false);
  });

  test("mensagens citam a quantidade de horas", () => {
    assert.match(AntecedenciaMinima.mensagemParaAgendar(), /2 horas/);
    assert.match(AntecedenciaMinima.mensagemParaAlterar(), /2 horas/);
  });
});
