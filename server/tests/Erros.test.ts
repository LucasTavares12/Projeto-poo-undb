/**
 * Teste de caixa branca — hierarquia de erros (src/erros)
 * Caminhos cobertos:
 *  [C1] cada subclasse define o seu status HTTP (polimorfismo)
 *  [C2] ErroAutenticacao recebe o status no construtor
 *  [C3] name é o nome da classe concreta (new.target.name), não "ErroDaAplicacao"
 *  [C4] todos são ErroDaAplicacao e Error, e guardam a mensagem
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ErroDaAplicacao } from "../src/erros/ErroDaAplicacao";
import { ErroAutenticacao } from "../src/erros/ErroAutenticacao";
import { ErroDeAcesso } from "../src/erros/ErroDeAcesso";
import { ErroDeConflito } from "../src/erros/ErroDeConflito";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";
import { ErroNaoEncontrado } from "../src/erros/ErroNaoEncontrado";

const erros = [
  { erro: new ErroDeValidacao("v"), status: 400, nome: "ErroDeValidacao" },
  { erro: new ErroDeAcesso("a"), status: 403, nome: "ErroDeAcesso" },
  { erro: new ErroNaoEncontrado("n"), status: 404, nome: "ErroNaoEncontrado" },
  { erro: new ErroDeConflito("c"), status: 409, nome: "ErroDeConflito" },
];

test("[C1] cada tipo de erro tem o seu status HTTP", () => {
  for (const { erro, status } of erros) {
    assert.equal(erro.status, status, erro.name);
  }
});

test("[C2] ErroAutenticacao usa o status recebido", () => {
  assert.equal(new ErroAutenticacao("Senha errada.", 401).status, 401);
  assert.equal(new ErroAutenticacao("Cadastro desativado.", 403).status, 403);
});

test("[C3] name é o nome da classe concreta", () => {
  for (const { erro, nome } of erros) {
    assert.equal(erro.name, nome);
  }
  assert.equal(new ErroAutenticacao("x", 401).name, "ErroAutenticacao");
});

test("[C4] todos são ErroDaAplicacao e Error, com a mensagem", () => {
  for (const { erro } of [...erros, { erro: new ErroAutenticacao("auth", 401) }]) {
    assert.ok(erro instanceof ErroDaAplicacao);
    assert.ok(erro instanceof Error);
    assert.ok(erro.message.length > 0);
  }
  assert.equal(new ErroNaoEncontrado("Profissional não encontrado.").message, "Profissional não encontrado.");
});
