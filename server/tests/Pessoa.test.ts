/**
 * Teste de caixa branca — Pessoa (pelas subclasses Cliente e Profissional)
 * Caminhos cobertos:
 *  construtor:   [C1] não valida (dados antigos do banco entram como estão)
 *  setNome:      [C2] vazio/espaços/null lança, com mensagem do papel (polimorfismo) | [C3] 150 ok, 151 lança | [C4] trim
 *  setTelefone:  [C5] sem nenhum dígito lança "Informe o telefone" | [C6] quantidade errada de dígitos lança
 *                [C7] válido é guardado formatado
 *  temTelefone:  [C8] mesmos números com máscaras diferentes | [C9] texto sem dígitos → false (curto-circuito do &&)
 *                [C10] outro número → false
 *  Cliente.novo / Profissional.novo: [C11] validam os dados | [C12] especialidade vazia, 100 ok, 101 lança
 *  Profissional.atualizarDados: [C13] atualiza tudo | [C14] telefone inválido para no meio (nome já mudou)
 *  apresentar / toJSON: [C15] cada subclasse se apresenta do seu jeito
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Cliente } from "../src/module/Cliente";
import { Profissional } from "../src/module/Profissional";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

describe("Pessoa — construtor", () => {
  test("[C1] o construtor aceita dados fora da regra (registros antigos do banco)", () => {
    const antigo = new Cliente("", "123", 9);
    assert.equal(antigo.getNome(), "");
    assert.equal(antigo.getTelefone(), "123");
    assert.equal(antigo.getId(), 9);
  });
});

describe("Pessoa.setNome", () => {
  test("[C2] nome vazio lança erro com a mensagem do papel de cada subclasse", () => {
    assert.throws(() => new Cliente("x", "").setNome("   "), { message: "Informe o nome do cliente." });
    assert.throws(() => new Profissional("x", "", "y").setNome(""), { message: "Informe o nome do profissional." });
    assert.throws(() => new Cliente("x", "").setNome(null as unknown as string), ErroDeValidacao);
  });

  test("[C3] 150 caracteres é aceito; 151 lança (valor-limite)", () => {
    const cliente = new Cliente("x", "");
    cliente.setNome("a".repeat(150));
    assert.equal(cliente.getNome().length, 150);
    assert.throws(() => cliente.setNome("a".repeat(151)), ErroDeValidacao);
  });

  test("[C4] nome é guardado sem espaços nas pontas", () => {
    const cliente = new Cliente("x", "");
    cliente.setNome("  Maria  ");
    assert.equal(cliente.getNome(), "Maria");
  });
});

describe("Pessoa.setTelefone", () => {
  test("[C5] sem nenhum dígito lança 'Informe o telefone'", () => {
    assert.throws(() => new Cliente("x", "").setTelefone("(  )  -  "), { message: "Informe o telefone do cliente." });
    assert.throws(() => new Cliente("x", "").setTelefone(null as unknown as string), ErroDeValidacao);
  });

  test("[C6] quantidade errada de dígitos lança erro", () => {
    assert.throws(() => new Cliente("x", "").setTelefone("98 8877-665"), ErroDeValidacao); // 9 dígitos
    assert.throws(() => new Cliente("x", "").setTelefone("989887766550"), ErroDeValidacao); // 12 dígitos
  });

  test("[C7] telefone válido é guardado no formato de exibição", () => {
    const cliente = new Cliente("x", "");
    cliente.setTelefone("98988776655");
    assert.equal(cliente.getTelefone(), "(98) 98877-6655");
    cliente.setTelefone("9832321234");
    assert.equal(cliente.getTelefone(), "(98) 3232-1234");
  });
});

describe("Pessoa.temTelefone", () => {
  const cliente = new Cliente("Maria", "(98) 98877-6655");

  test("[C8] mesmos números, com ou sem máscara", () => {
    assert.ok(cliente.temTelefone("98988776655"));
    assert.ok(cliente.temTelefone("98 9 8877 6655"));
    assert.equal(cliente.getTelefoneDigitos(), "98988776655");
  });

  test("[C9] texto sem dígitos nunca combina (nem com telefone vazio)", () => {
    assert.equal(cliente.temTelefone(""), false);
    assert.equal(new Cliente("Antigo", "").temTelefone("sem número"), false);
  });

  test("[C10] outro número não combina", () => {
    assert.equal(cliente.temTelefone("98988776600"), false);
  });
});

describe("Cliente.novo e Profissional.novo", () => {
  test("[C11] as fábricas validam e formatam os dados", () => {
    const cliente = Cliente.novo("  Maria ", "98988776655");
    assert.equal(cliente.getNome(), "Maria");
    assert.equal(cliente.getTelefone(), "(98) 98877-6655");
    assert.throws(() => Cliente.novo("", "98988776655"), ErroDeValidacao);
    assert.throws(() => Cliente.novo("Maria", "123"), ErroDeValidacao);

    const prof = Profissional.novo("Ana", "9832321234", "  Estética ");
    assert.equal(prof.getEspecialidade(), "Estética");
    assert.equal(prof.getTelefone(), "(98) 3232-1234");
  });

  test("[C12] especialidade vazia lança; 100 caracteres ok; 101 lança", () => {
    assert.throws(() => Profissional.novo("Ana", "9832321234", "  "), { message: "Informe a especialidade do profissional." });
    assert.throws(() => Profissional.novo("Ana", "9832321234", null as unknown as string), ErroDeValidacao);
    assert.equal(Profissional.novo("Ana", "9832321234", "e".repeat(100)).getEspecialidade().length, 100);
    assert.throws(() => Profissional.novo("Ana", "9832321234", "e".repeat(101)), ErroDeValidacao);
  });
});

describe("Profissional.atualizarDados", () => {
  test("[C13] atualiza nome, telefone e especialidade", () => {
    const prof = new Profissional("Ana", "(98) 98111-2222", "Estética", 1);
    prof.atualizarDados("Ana Paula", "98999998888", "Massagem");
    assert.deepEqual(prof.toJSON(), { id: 1, nome: "Ana Paula", telefone: "(98) 99999-8888", especialidade: "Massagem" });
  });

  test("[C14] telefone inválido interrompe depois de já ter trocado o nome", () => {
    const prof = new Profissional("Ana", "(98) 98111-2222", "Estética", 1);
    assert.throws(() => prof.atualizarDados("Trocado", "123", "Massagem"), ErroDeValidacao);
    // Caixa branca: setNome roda antes de setTelefone, então a alteração não é atômica.
    assert.equal(prof.getNome(), "Trocado");
    assert.equal(prof.getTelefone(), "(98) 98111-2222");
    assert.equal(prof.getEspecialidade(), "Estética");
  });
});

describe("apresentar e toJSON", () => {
  test("[C15] cada subclasse se apresenta do seu jeito (polimorfismo)", () => {
    const cliente = new Cliente("Maria", "(98) 98877-6655", 4);
    const prof = new Profissional("Ana", "(98) 98111-2222", "Estética", 1);
    assert.equal(cliente.apresentar(), "Cliente: Maria (contato: (98) 98877-6655)");
    assert.equal(prof.apresentar(), "Profissional: Ana - Estética");
    assert.deepEqual(cliente.toJSON(), { id: 4, nome: "Maria", telefone: "(98) 98877-6655" });
  });
});
