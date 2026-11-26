/**
 * Teste de caixa branca — ordem dos tratamentos (aba "Tratamentos")
 * Caminhos cobertos:
 *  Tratamento.definirOrdem: [C1] padrão 0 e aceita inteiros >= 0 | [C2] negativo/não inteiro lança
 *  Tratamento.ehDoMesmoGrupoQue: [C3] mesmo profissional, outro profissional, ambos de todos
 *  OrdemDosTratamentos (construtor): [C4] vazio/não lista lança | [C5] id inválido lança | [C6] id repetido lança
 *  OrdemDosTratamentos.aplicar: [C7] aplica as posições 0,1,2 e devolve na nova ordem
 *                               [C8] faltando ou sobrando tratamento do grupo lança
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Tratamento } from "../src/module/Tratamento";
import { OrdemDosTratamentos } from "../src/module/OrdemDosTratamentos";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const novo = (id: number, profissionalId: number | null = 1, ordem = 0) =>
  new Tratamento(`T${id}`, "", 100, 30, id, profissionalId, ordem);

describe("Tratamento — ordem", () => {
  test("[C1] começa em 0 e aceita posições válidas", () => {
    const tratamento = novo(1);
    assert.equal(tratamento.getOrdem(), 0);
    tratamento.definirOrdem(5);
    assert.equal(tratamento.getOrdem(), 5);
    assert.equal(tratamento.toJSON().ordem, 5);
  });

  test("[C2] posição negativa ou quebrada lança", () => {
    assert.throws(() => novo(1).definirOrdem(-1), ErroDeValidacao);
    assert.throws(() => novo(1).definirOrdem(1.5), ErroDeValidacao);
    assert.throws(() => novo(1, 1, -2), ErroDeValidacao);
  });

  test("[C3] sabe se é do mesmo grupo", () => {
    assert.equal(novo(1, 1).ehDoMesmoGrupoQue(1), true);
    assert.equal(novo(1, 1).ehDoMesmoGrupoQue(2), false);
    assert.equal(novo(1, null).ehDoMesmoGrupoQue(null), true);
    assert.equal(novo(1, 1).ehDoMesmoGrupoQue(null), false);
  });
});

describe("OrdemDosTratamentos", () => {
  test("[C4] lista vazia ou que não é lista lança", () => {
    assert.throws(() => new OrdemDosTratamentos([]), ErroDeValidacao);
    assert.throws(() => new OrdemDosTratamentos("1,2"), ErroDeValidacao);
    assert.throws(() => new OrdemDosTratamentos(undefined), ErroDeValidacao);
  });

  test("[C5] id inválido lança", () => {
    assert.throws(() => new OrdemDosTratamentos([1, 0]), ErroDeValidacao);
    assert.throws(() => new OrdemDosTratamentos([1, "2"]), ErroDeValidacao);
  });

  test("[C6] id repetido lança", () => {
    assert.throws(() => new OrdemDosTratamentos([1, 2, 1]), ErroDeValidacao);
  });

  test("[C7] aplica as posições na ordem pedida", () => {
    const grupo = [novo(1, 1, 0), novo(2, 1, 1), novo(3, 1, 2)];
    const reordenados = new OrdemDosTratamentos([3, 1, 2]).aplicar(grupo);
    assert.deepEqual(
      reordenados.map((tratamento) => [tratamento.getId(), tratamento.getOrdem()]),
      [[3, 0], [1, 1], [2, 2]]
    );
  });

  test("[C8] lista diferente do grupo lança", () => {
    const grupo = [novo(1), novo(2), novo(3)];
    assert.throws(() => new OrdemDosTratamentos([1, 2]).aplicar(grupo), ErroDeValidacao);
    assert.throws(() => new OrdemDosTratamentos([1, 2, 3, 4]).aplicar(grupo), ErroDeValidacao);
    assert.throws(() => new OrdemDosTratamentos([1, 2, 9]).aplicar(grupo), ErroDeValidacao);
  });
});
