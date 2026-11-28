/**
 * Teste de caixa branca — PerfilDeAcesso e ConfiguracoesClinica
 * Caminhos cobertos:
 *  PerfilDeAcesso.podeGerenciar: [C1] acesso total gerencia tudo (curto-circuito do ||)
 *                                [C2] conta de profissional gerencia só o próprio | [C3] não gerencia outro nem a clínica (null)
 *  exigir:             [C4] permitido não lança | [C5] sem permissão lança ErroDeAcesso (403) com a mensagem
 *  exigirAcessoTotal:  [C6] acesso total passa | conta de profissional lança
 *  ConfiguracoesClinica: [C7] padrões ligados | [C8] liga e desliga com boolean
 *                        [C9] valor que não é boolean lança e mantém o anterior | [C10] toJSON
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PerfilDeAcesso } from "../src/module/PerfilDeAcesso";
import { ConfiguracoesClinica } from "../src/module/ConfiguracoesClinica";
import { ErroDeAcesso } from "../src/erros/ErroDeAcesso";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

describe("PerfilDeAcesso", () => {
  const total = new PerfilDeAcesso(null);
  const daAna = new PerfilDeAcesso(1);

  test("[C1] acesso total gerencia qualquer profissional e a clínica inteira", () => {
    assert.ok(total.temAcessoTotal());
    assert.equal(total.getProfissionalId(), null);
    assert.ok(total.podeGerenciar(1));
    assert.ok(total.podeGerenciar(99));
    assert.ok(total.podeGerenciar(null));
  });

  test("[C2] conta de profissional gerencia o próprio profissional", () => {
    assert.equal(daAna.temAcessoTotal(), false);
    assert.equal(daAna.getProfissionalId(), 1);
    assert.ok(daAna.podeGerenciar(1));
  });

  test("[C3] conta de profissional não gerencia outro nem o que é da clínica inteira", () => {
    assert.equal(daAna.podeGerenciar(2), false);
    assert.equal(daAna.podeGerenciar(null), false);
  });

  test("[C4] exigir com permissão não lança", () => {
    assert.doesNotThrow(() => daAna.exigir(1, "x"));
    assert.doesNotThrow(() => total.exigir(null, "x"));
  });

  test("[C5] exigir sem permissão lança ErroDeAcesso (403) com a mensagem", () => {
    assert.throws(
      () => daAna.exigir(2, "Sem acesso a este profissional."),
      (erro: unknown) =>
        erro instanceof ErroDeAcesso && erro.status === 403 && erro.message === "Sem acesso a este profissional."
    );
  });

  test("[C6] exigirAcessoTotal só passa para quem tem acesso total", () => {
    assert.doesNotThrow(() => total.exigirAcessoTotal("x"));
    assert.throws(() => daAna.exigirAcessoTotal("Só administradores."), ErroDeAcesso);
  });
});

describe("ConfiguracoesClinica", () => {
  test("[C7] por padrão o botão Entrar aparece e o cadastro está liberado", () => {
    const config = new ConfiguracoesClinica();
    assert.equal(config.getBotaoEntrarVisivel(), true);
    assert.equal(config.getCadastroLiberado(), true);
  });

  test("[C8] liga e desliga cada opção", () => {
    const config = new ConfiguracoesClinica();
    config.setBotaoEntrarVisivel(false);
    config.setCadastroLiberado(false);
    assert.equal(config.getBotaoEntrarVisivel(), false);
    assert.equal(config.getCadastroLiberado(), false);
    config.setCadastroLiberado(true);
    assert.equal(config.getCadastroLiberado(), true);
  });

  test("[C9] valor que não é boolean lança erro e mantém o anterior", () => {
    const config = new ConfiguracoesClinica();
    for (const valor of ["false", 0, 1, null, undefined]) {
      assert.throws(() => config.setCadastroLiberado(valor as unknown as boolean), ErroDeValidacao);
      assert.throws(() => config.setBotaoEntrarVisivel(valor as unknown as boolean), ErroDeValidacao);
    }
    assert.equal(config.getCadastroLiberado(), true);
    assert.equal(config.getBotaoEntrarVisivel(), true);
  });

  test("[C10] toJSON traz as duas opções", () => {
    const config = new ConfiguracoesClinica();
    config.setBotaoEntrarVisivel(false);
    // Os demais campos (personalização, contatos, funcionamento) são testados em ConfiguracoesClinica.test.ts.
    const json = config.toJSON();
    assert.equal(json.botaoEntrarVisivel, false);
    assert.equal(json.cadastroLiberado, true);
  });
});
