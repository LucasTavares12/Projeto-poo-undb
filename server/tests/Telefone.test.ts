/**
 * Teste de caixa branca — Telefone
 * Caminhos cobertos:
 *  construtor: [C1] < 10 dígitos lança | [C2] > 11 dígitos lança | [C3] 10 dígitos ok | [C4] 11 dígitos ok
 *  somenteDigitos: [C5] remove máscara | [C6] null/undefined (?? "")
 *  ehValido:   [C7] 10 | [C8] 11 | [C9] outro tamanho
 *  formatar:   [C10] celular (corte 5) | [C11] fixo (corte 4)
 *  equals:     [C12] mesmo número com máscaras diferentes | [C13] números diferentes
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Telefone } from "../src/module/Telefone";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

describe("Telefone construtor", () => {
  test("[C1] menos de 10 dígitos lança erro", () => {
    assert.throws(() => new Telefone("(98) 1234-567"), ErroDeValidacao);
  });

  test("[C2] mais de 11 dígitos lança erro", () => {
    assert.throws(() => new Telefone("(98) 98877-66551"), ErroDeValidacao);
  });

  test("[C3] 10 dígitos (fixo) é aceito", () => {
    assert.equal(new Telefone("9832321234").getDigitos(), "9832321234");
  });

  test("[C4] 11 dígitos (celular) é aceito", () => {
    assert.equal(new Telefone("(98) 98877-6655").getDigitos(), "98988776655");
  });
});

describe("Telefone.somenteDigitos", () => {
  test("[C5] remove tudo que não é número", () => {
    assert.equal(Telefone.somenteDigitos("(98) 98877-6655"), "98988776655");
  });

  test("[C6] null/undefined vira string vazia", () => {
    assert.equal(Telefone.somenteDigitos(null as unknown as string), "");
    assert.equal(Telefone.somenteDigitos(undefined as unknown as string), "");
  });
});

describe("Telefone.ehValido", () => {
  test("[C7] 10 dígitos é válido", () => assert.equal(Telefone.ehValido("9832321234"), true));
  test("[C8] 11 dígitos é válido", () => assert.equal(Telefone.ehValido("98988776655"), true));
  test("[C9] outros tamanhos são inválidos", () => {
    assert.equal(Telefone.ehValido("123"), false);
    assert.equal(Telefone.ehValido("123456789012"), false);
  });
});

describe("Telefone.formatar", () => {
  test("[C10] celular usa 5 dígitos antes do hífen", () => {
    assert.equal(new Telefone("98988776655").formatar(), "(98) 98877-6655");
  });

  test("[C11] fixo usa 4 dígitos antes do hífen", () => {
    const t = new Telefone("9832321234");
    assert.equal(t.formatar(), "(98) 3232-1234");
    assert.equal(t.toString(), "(98) 3232-1234");
  });
});

describe("Telefone.equals", () => {
  test("[C12] compara só os dígitos", () => {
    assert.ok(new Telefone("(98) 98877-6655").equals(new Telefone("98988776655")));
  });

  test("[C13] números diferentes", () => {
    assert.equal(new Telefone("98988776655").equals(new Telefone("98988776656")), false);
  });
});
