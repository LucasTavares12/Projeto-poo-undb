/**
 * Teste de caixa branca — PerfilDeAcesso e Administrador (profissional administrador)
 * Caminhos cobertos:
 *  PerfilDeAcesso:
 *   construtor: [C1] administrador sem profissional é ignorado (acesso total já inclui tudo)
 *   administraClinica: [C2] acesso total | [C3] profissional admin | [C4] profissional comum
 *   naGestao: [C5] profissional admin vira acesso total | [C6] profissional comum continua igual
 *   agendamentos: [C7] profissional admin continua restrito aos próprios (aplicarFiltro/podeGerenciar)
 *   exigirAdministracao: [C8] profissional comum lança ErroDeAcesso | [C9] admin passa
 *  Administrador:
 *   definirAdministrador: [C10] com profissional ok | [C11] sem profissional lança | [C12] não booleano lança
 *   vincularProfissional: [C13] desvincular (null) tira a marca de administrador
 *   construtor: [C14] marca sem profissional é descartada
 *   toJSON: [C15] expõe "administrador" e nunca o hash
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PerfilDeAcesso } from "../src/module/PerfilDeAcesso";
import { Administrador } from "../src/module/Administrador";
import { ErroDeAcesso } from "../src/erros/ErroDeAcesso";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

describe("PerfilDeAcesso — profissional administrador", () => {
  test("[C1] marca de administrador sem profissional é ignorada", () => {
    const perfil = new PerfilDeAcesso(null, true);
    assert.equal(perfil.temAcessoTotal(), true);
    assert.equal(perfil.naGestao(), perfil);
  });

  test("[C2] acesso total administra a clínica", () => {
    assert.equal(new PerfilDeAcesso(null).administraClinica(), true);
  });

  test("[C3] profissional administrador administra a clínica", () => {
    assert.equal(new PerfilDeAcesso(7, true).administraClinica(), true);
  });

  test("[C4] profissional comum não administra a clínica", () => {
    assert.equal(new PerfilDeAcesso(7).administraClinica(), false);
  });

  test("[C5] na gestão, o profissional administrador age como acesso total", () => {
    const gestao = new PerfilDeAcesso(7, true).naGestao();
    assert.equal(gestao.temAcessoTotal(), true);
    assert.equal(gestao.getProfissionalId(), null);
    assert.equal(gestao.aplicarFiltro(3), 3);
    assert.equal(gestao.podeGerenciar(null), true);
  });

  test("[C6] na gestão, o profissional comum continua restrito", () => {
    const perfil = new PerfilDeAcesso(7);
    assert.equal(perfil.naGestao(), perfil);
    assert.equal(perfil.naGestao().aplicarFiltro(3), 7);
  });

  test("[C7] nos agendamentos, o profissional administrador só vê os próprios", () => {
    const perfil = new PerfilDeAcesso(7, true);
    assert.equal(perfil.temAcessoTotal(), false);
    assert.equal(perfil.aplicarFiltro(null), 7);
    assert.equal(perfil.aplicarFiltro(3), 7);
    assert.equal(perfil.podeGerenciar(3), false);
    assert.equal(perfil.podeGerenciar(7), true);
  });

  test("[C8] exigirAdministracao barra o profissional comum", () => {
    assert.throws(() => new PerfilDeAcesso(7).exigirAdministracao("sem acesso"), ErroDeAcesso);
  });

  test("[C9] exigirAdministracao deixa passar acesso total e profissional admin", () => {
    assert.doesNotThrow(() => new PerfilDeAcesso(null).exigirAdministracao("x"));
    assert.doesNotThrow(() => new PerfilDeAcesso(7, true).exigirAdministracao("x"));
  });
});

describe("Administrador — marca de administrador da clínica", () => {
  const conta = (profissionalId: number | null, administrador = false) =>
    new Administrador("dono@clinica.com", "salt:hash", 1, new Date(), profissionalId, administrador);

  test("[C10] profissional pode virar administrador (e deixar de ser)", () => {
    const usuario = conta(5);
    usuario.definirAdministrador(true);
    assert.equal(usuario.ehProfissionalAdministrador(), true);
    assert.equal(usuario.administraClinica(), true);
    assert.equal(usuario.temAcessoTotal(), false);
    usuario.definirAdministrador(false);
    assert.equal(usuario.administraClinica(), false);
  });

  test("[C11] conta de acesso total não recebe a marca", () => {
    assert.throws(() => conta(null).definirAdministrador(true), ErroDeValidacao);
    assert.doesNotThrow(() => conta(null).definirAdministrador(false));
  });

  test("[C12] valor que não é booleano lança erro", () => {
    assert.throws(() => conta(5).definirAdministrador("sim" as unknown as boolean), ErroDeValidacao);
  });

  test("[C13] desvincular o profissional tira a marca (vira acesso total)", () => {
    const usuario = conta(5, true);
    usuario.vincularProfissional(null);
    assert.equal(usuario.ehProfissionalAdministrador(), false);
    assert.equal(usuario.temAcessoTotal(), true);
    assert.equal(usuario.administraClinica(), true);
  });

  test("[C14] marca sem profissional no construtor é descartada", () => {
    assert.equal(conta(null, true).ehProfissionalAdministrador(), false);
  });

  test("[C15] toJSON expõe a marca e nunca o hash da senha", () => {
    const json = conta(5, true).toJSON();
    assert.equal(json.administrador, true);
    assert.equal(json.profissionalId, 5);
    assert.equal("senhaHash" in json, false);
  });
});
