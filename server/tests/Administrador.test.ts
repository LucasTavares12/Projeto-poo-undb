/**
 * Teste de caixa branca — Administrador (conta do painel)
 * Caminhos cobertos:
 *  validarEmail:   [C1] normaliza (espaços e maiúsculas) | [C2] formatos inválidos lançam
 *  criarHash:      [C3] senha com 5 caracteres ou não texto lança; 6 é aceita (valor-limite)
 *                  [C4] guarda "salt:hash"; mesmo texto gera hash diferente (salt aleatório)
 *  senhaConfere:   [C5] senha certa | [C6] senha errada | [C7] hash sem ":" ou com parte vazia → false
 *                  [C8] hash guardado de outro tamanho → false (antes do timingSafeEqual) | [C9] senha null
 *  alterarSenha:   [C10] troca o hash; senha inválida mantém a antiga
 *  setEmail:       [C11] valida; e-mail inválido mantém o antigo
 *  vincularProfissional: [C12] null = acesso total | inteiro positivo | zero/negativo/não inteiro lança
 *  toJSON:         [C13] nunca expõe o hash; criadoEm null ou ISO
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Administrador } from "../src/module/Administrador";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

describe("Administrador — e-mail", () => {
  test("[C1] e-mail é guardado sem espaços e em minúsculas", () => {
    assert.equal(new Administrador("  Ana@Clinica.COM ", "x:y").getEmail(), "ana@clinica.com");
    assert.equal(Administrador.normalizarEmail(null as unknown as string), "");
  });

  test("[C2] e-mail fora do formato lança erro", () => {
    for (const email of ["", "   ", "sem-arroba", "a@b", "a b@c.com", "@c.com", "a@.com"]) {
      assert.throws(() => new Administrador(email, "x:y"), ErroDeValidacao, email);
    }
  });

  test("[C11] setEmail valida; se for inválido mantém o antigo", () => {
    const admin = new Administrador("a@b.com", "x:y");
    admin.setEmail(" NOVO@b.com");
    assert.equal(admin.getEmail(), "novo@b.com");
    assert.throws(() => admin.setEmail("invalido"), ErroDeValidacao);
    assert.equal(admin.getEmail(), "novo@b.com");
  });
});

describe("Administrador — senha", () => {
  test("[C3] senha com menos de 6 caracteres ou que não é texto lança erro", async () => {
    await assert.rejects(Administrador.comSenha("a@b.com", "12345"), ErroDeValidacao);
    await assert.rejects(Administrador.comSenha("a@b.com", 123456 as unknown as string), ErroDeValidacao);
    await assert.rejects(Administrador.comSenha("a@b.com", undefined as unknown as string), ErroDeValidacao);
    const admin = await Administrador.comSenha("a@b.com", "123456");
    assert.ok(await admin.senhaConfere("123456"));
  });

  test("[C4] guarda \"salt:hash\" em hexadecimal, com salt aleatório", async () => {
    const um = await Administrador.comSenha("a@b.com", "segredo1");
    const outro = await Administrador.comSenha("a@b.com", "segredo1");
    assert.match(um.getSenhaHash(), /^[0-9a-f]{32}:[0-9a-f]{128}$/);
    assert.notEqual(um.getSenhaHash(), outro.getSenhaHash());
    assert.ok(!um.getSenhaHash().includes("segredo1"));
  });

  test("[C5] senha certa confere", async () => {
    const admin = await Administrador.comSenha("a@b.com", "segredo1");
    assert.equal(await admin.senhaConfere("segredo1"), true);
  });

  test("[C6] senha errada não confere", async () => {
    const admin = await Administrador.comSenha("a@b.com", "segredo1");
    assert.equal(await admin.senhaConfere("segredo2"), false);
    assert.equal(await admin.senhaConfere("SEGREDO1"), false);
  });

  test("[C7] hash guardado sem ':' ou com parte vazia não confere", async () => {
    assert.equal(await new Administrador("a@b.com", "semdoispontos").senhaConfere("x"), false);
    assert.equal(await new Administrador("a@b.com", "abc:").senhaConfere("x"), false);
    assert.equal(await new Administrador("a@b.com", ":abc").senhaConfere("x"), false);
  });

  test("[C8] hash guardado com tamanho diferente não confere", async () => {
    assert.equal(await new Administrador("a@b.com", "abcd:00ff").senhaConfere("x"), false);
  });

  test("[C9] senha null é tratada como texto vazio", async () => {
    const admin = await Administrador.comSenha("a@b.com", "segredo1");
    assert.equal(await admin.senhaConfere(null as unknown as string), false);
  });

  test("[C10] alterarSenha troca o hash; senha inválida mantém a antiga", async () => {
    const admin = await Administrador.comSenha("a@b.com", "antiga1");
    await admin.alterarSenha("nova123");
    assert.equal(await admin.senhaConfere("antiga1"), false);
    assert.equal(await admin.senhaConfere("nova123"), true);

    const hashAntes = admin.getSenhaHash();
    await assert.rejects(admin.alterarSenha("123"), ErroDeValidacao);
    assert.equal(admin.getSenhaHash(), hashAntes);
  });
});

describe("Administrador — vínculo e JSON", () => {
  test("[C12] vincular a profissional e voltar para acesso total", () => {
    const admin = new Administrador("a@b.com", "x:y");
    assert.equal(admin.temAcessoTotal(), true);
    admin.vincularProfissional(5);
    assert.equal(admin.getProfissionalId(), 5);
    assert.equal(admin.temAcessoTotal(), false);
    admin.vincularProfissional(null);
    assert.equal(admin.temAcessoTotal(), true);

    assert.throws(() => admin.vincularProfissional(0), ErroDeValidacao);
    assert.throws(() => admin.vincularProfissional(-2), ErroDeValidacao);
    assert.throws(() => admin.vincularProfissional(1.5), ErroDeValidacao);
  });

  test("[C13] toJSON nunca expõe o hash da senha", () => {
    const criadoEm = new Date("2026-10-01T10:00:00Z");
    const json = new Administrador("a@b.com", "salt:hash", 3, criadoEm, 2).toJSON();
    assert.deepEqual(json, { id: 3, email: "a@b.com", criadoEm: "2026-10-01T10:00:00.000Z", profissionalId: 2, administrador: false });
    assert.ok(!JSON.stringify(json).includes("hash"));
    assert.equal(new Administrador("a@b.com", "x:y").toJSON().criadoEm, null);
    assert.equal(new Administrador("a@b.com", "x:y", 3).getId(), 3);
  });
});
