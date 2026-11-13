/**
 * Teste de caixa branca — Tratamento
 * Caminhos cobertos:
 *  construtor/setValor:   [C1] valor negativo | [C2] valor não finito (NaN/Infinity) | [C3] valor zero ok
 *  construtor/setDuracao: [C4] duração <= 0 | [C5] não múltiplo de 30 | [C6] múltiplo de 30 ok
 *  setNome:   [C7] vazio/só espaços | [C8] maior que 150 | [C9] exatamente 150 (limite) | [C10] trim
 *  descricao: [C11] null vira "" e faz trim
 *  vincularProfissional: [C12] null ok | [C13] inteiro positivo ok | [C14] zero/negativo | [C15] não inteiro
 *  ehRealizadoPor: [C16] sem dono → qualquer um | [C17] dono igual | [C18] dono diferente
 *  atualizarDados: [C19] atualiza tudo | [C20] para no primeiro dado inválido
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Tratamento } from "../src/module/Tratamento";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const novo = (valor = 100, duracao = 60, nome = "Limpeza de pele", prof: number | null = null) =>
  new Tratamento(nome, "  desc  ", valor, duracao, 1, prof);

describe("Tratamento — valor", () => {
  test("[C1] valor negativo lança erro", () => {
    assert.throws(() => novo(-1), ErroDeValidacao);
    assert.throws(() => novo().setValor(-0.01), ErroDeValidacao);
  });

  test("[C2] valor não finito lança erro", () => {
    assert.throws(() => novo(NaN), ErroDeValidacao);
    assert.throws(() => novo(Infinity), ErroDeValidacao);
  });

  test("[C3] valor zero é aceito", () => {
    assert.equal(novo(0).getValor(), 0);
  });
});

describe("Tratamento — duração", () => {
  test("[C4] duração zero ou negativa lança erro", () => {
    assert.throws(() => novo(100, 0), ErroDeValidacao);
    assert.throws(() => novo(100, -30), ErroDeValidacao);
  });

  test("[C5] duração fora da grade de 30 min lança erro", () => {
    assert.throws(() => novo(100, 45), ErroDeValidacao);
    assert.throws(() => novo().setDuracaoMinutos(20), ErroDeValidacao);
  });

  test("[C6] duração múltipla de 30 calcula os slots", () => {
    const t = novo(100, 90);
    assert.equal(t.getQuantidadeSlots(), 3);
    t.setDuracaoMinutos(30);
    assert.equal(t.getQuantidadeSlots(), 1);
  });
});

describe("Tratamento — nome e descrição", () => {
  test("[C7] nome vazio ou só espaços lança erro", () => {
    assert.throws(() => novo(100, 60, ""), ErroDeValidacao);
    assert.throws(() => novo(100, 60, "    "), ErroDeValidacao);
  });

  test("[C8] nome com 151 caracteres lança erro", () => {
    assert.throws(() => novo(100, 60, "a".repeat(151)), ErroDeValidacao);
  });

  test("[C9] nome com exatamente 150 caracteres é aceito (valor-limite)", () => {
    assert.equal(novo(100, 60, "a".repeat(150)).getNome().length, 150);
  });

  test("[C10] nome é guardado sem espaços nas pontas", () => {
    assert.equal(novo(100, 60, "  Massagem  ").getNome(), "Massagem");
  });

  test("[C11] descrição null vira vazia; descrição é aparada", () => {
    const t = novo();
    assert.equal(t.getDescricao(), "desc");
    t.setDescricao(null as unknown as string);
    assert.equal(t.getDescricao(), "");
  });
});

describe("Tratamento — vínculo com profissional", () => {
  test("[C12] null libera para todos", () => {
    assert.equal(novo(100, 60, "x", null).getProfissionalId(), null);
  });

  test("[C13] id inteiro positivo é aceito", () => {
    assert.equal(novo(100, 60, "x", 7).getProfissionalId(), 7);
  });

  test("[C14] id zero ou negativo lança erro", () => {
    assert.throws(() => novo(100, 60, "x", 0), ErroDeValidacao);
    assert.throws(() => novo(100, 60, "x", -3), ErroDeValidacao);
  });

  test("[C15] id não inteiro lança erro", () => {
    assert.throws(() => novo(100, 60, "x", 1.5), ErroDeValidacao);
  });

  test("[C16] sem dono, qualquer profissional realiza", () => {
    assert.ok(novo(100, 60, "x", null).ehRealizadoPor(99));
  });

  test("[C17] o próprio dono realiza", () => {
    assert.ok(novo(100, 60, "x", 5).ehRealizadoPor(5));
  });

  test("[C18] outro profissional não realiza", () => {
    assert.equal(novo(100, 60, "x", 5).ehRealizadoPor(6), false);
  });
});

describe("Tratamento.atualizarDados", () => {
  test("[C19] atualiza todos os campos", () => {
    const t = novo();
    t.atualizarDados("Novo", "nova desc", 250, 120, 3);
    assert.deepEqual(t.toJSON(), {
      id: 1,
      nome: "Novo",
      descricao: "nova desc",
      valor: 250,
      duracaoMinutos: 120,
      profissionalId: 3,
      quantidadeSlots: 4,
    });
  });

  test("[C20] valor inválido interrompe depois de já ter trocado o nome", () => {
    const t = novo();
    assert.throws(() => t.atualizarDados("Trocado", "d", -5, 60, null), ErroDeValidacao);
    // Caixa branca: setNome roda antes de setValor, então o nome já mudou (atualização não é atômica).
    assert.equal(t.getNome(), "Trocado");
    assert.equal(t.getValor(), 100);
  });
});
