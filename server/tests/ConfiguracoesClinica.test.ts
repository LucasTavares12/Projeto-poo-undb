/**
 * Teste de caixa branca — ConfiguracoesClinica (personalização)
 * Caminhos cobertos:
 *  padrões: [C1] nome padrão, cores e logo null
 *  setNomeClinica: [C2] trim e espaços repetidos | [C3] vazio/só espaços | [C4] não string
 *                  [C5] 60 caracteres ok | [C6] 61 caracteres lança
 *  setCor*: [C7] maiúsculas viram minúsculas | [C8] null e "" = padrão | [C9] formato inválido
 *  setLogo: [C10] PNG/JPEG/WebP base64 ok | [C11] null/"" remove | [C12] outro tipo (svg, texto) lança
 *           [C13] grande demais lança
 *  restaurarVisualPadrao: [C14] volta nome, cores e logo, sem mexer nos botões de acesso
 *  toJSON: [C15] traz as opções novas
 *  aplicar: [C16] muda só as opções informadas | [C17] nenhuma opção conhecida lança
 *           [C18] valor inválido lança (passa pelo setter)
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ConfiguracoesClinica } from "../src/module/ConfiguracoesClinica";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const PNG = "data:image/png;base64,iVBORw0KGgo=";

describe("ConfiguracoesClinica — padrões e nome", () => {
  test("[C1] sem personalização usa o visual padrão", () => {
    const config = new ConfiguracoesClinica();
    assert.equal(config.getNomeClinica(), ConfiguracoesClinica.NOME_PADRAO);
    assert.equal(config.getCorPrincipal(), null);
    assert.equal(config.getCorLateral(), null);
    assert.equal(config.getLogo(), null);
  });

  test("[C2] nome é limpo (pontas e espaços repetidos)", () => {
    const config = new ConfiguracoesClinica();
    config.setNomeClinica("  Studio   Bella  ");
    assert.equal(config.getNomeClinica(), "Studio Bella");
  });

  test("[C3] nome vazio lança erro", () => {
    assert.throws(() => new ConfiguracoesClinica().setNomeClinica("   "), ErroDeValidacao);
  });

  test("[C4] nome que não é texto lança erro", () => {
    assert.throws(() => new ConfiguracoesClinica().setNomeClinica(42 as unknown as string), ErroDeValidacao);
  });

  test("[C5] nome com 60 caracteres é aceito", () => {
    const config = new ConfiguracoesClinica();
    config.setNomeClinica("a".repeat(60));
    assert.equal(config.getNomeClinica().length, 60);
  });

  test("[C6] nome com 61 caracteres lança erro", () => {
    assert.throws(() => new ConfiguracoesClinica().setNomeClinica("a".repeat(61)), ErroDeValidacao);
  });
});

describe("ConfiguracoesClinica — cores", () => {
  test("[C7] cor em maiúsculas é guardada em minúsculas", () => {
    const config = new ConfiguracoesClinica();
    config.setCorPrincipal("#A05C68");
    config.setCorLateral(" #1D2B45 ");
    assert.equal(config.getCorPrincipal(), "#a05c68");
    assert.equal(config.getCorLateral(), "#1d2b45");
  });

  test("[C8] null ou vazio volta para a cor padrão", () => {
    const config = new ConfiguracoesClinica();
    config.setCorPrincipal("#112233");
    config.setCorPrincipal(null);
    assert.equal(config.getCorPrincipal(), null);
    config.setCorLateral("#112233");
    config.setCorLateral("");
    assert.equal(config.getCorLateral(), null);
  });

  test("[C9] formato inválido lança erro", () => {
    const config = new ConfiguracoesClinica();
    for (const cor of ["#fff", "112233", "#11223g", "red", "#1122334"]) {
      assert.throws(() => config.setCorPrincipal(cor), ErroDeValidacao, cor);
    }
    assert.throws(() => config.setCorLateral(123 as unknown as string), ErroDeValidacao);
  });
});

describe("ConfiguracoesClinica — logo", () => {
  test("[C10] aceita PNG, JPEG e WebP em base64", () => {
    const config = new ConfiguracoesClinica();
    for (const tipo of ["png", "jpeg", "webp"]) {
      const logo = `data:image/${tipo};base64,AAAA`;
      config.setLogo(logo);
      assert.equal(config.getLogo(), logo);
    }
  });

  test("[C11] null ou vazio remove a logo", () => {
    const config = new ConfiguracoesClinica();
    config.setLogo(PNG);
    config.setLogo(null);
    assert.equal(config.getLogo(), null);
    config.setLogo(PNG);
    config.setLogo("");
    assert.equal(config.getLogo(), null);
  });

  test("[C12] outro tipo de arquivo lança erro", () => {
    const config = new ConfiguracoesClinica();
    assert.throws(() => config.setLogo("data:image/svg+xml;base64,PHN2Zz4="), ErroDeValidacao);
    assert.throws(() => config.setLogo("https://exemplo.com/logo.png"), ErroDeValidacao);
    assert.throws(() => config.setLogo("data:image/png;base64,<script>"), ErroDeValidacao);
  });

  test("[C13] logo grande demais lança erro", () => {
    const enorme = `data:image/png;base64,${"A".repeat(1_500_001)}`;
    assert.throws(() => new ConfiguracoesClinica().setLogo(enorme), ErroDeValidacao);
  });
});

describe("ConfiguracoesClinica — restaurar e toJSON", () => {
  test("[C14] restaurar volta só o visual", () => {
    const config = new ConfiguracoesClinica();
    config.setCadastroLiberado(false);
    config.setNomeClinica("Studio Bella");
    config.setCorPrincipal("#112233");
    config.setCorLateral("#445566");
    config.setLogo(PNG);
    config.restaurarVisualPadrao();
    assert.equal(config.getNomeClinica(), ConfiguracoesClinica.NOME_PADRAO);
    assert.equal(config.getCorPrincipal(), null);
    assert.equal(config.getCorLateral(), null);
    assert.equal(config.getLogo(), null);
    assert.equal(config.getCadastroLiberado(), false);
  });

  test("[C15] toJSON traz as opções de personalização", () => {
    const config = new ConfiguracoesClinica();
    config.setCorLateral("#445566");
    assert.deepEqual(config.toJSON(), {
      botaoEntrarVisivel: true,
      cadastroLiberado: true,
      nomeClinica: ConfiguracoesClinica.NOME_PADRAO,
      corPrincipal: null,
      corLateral: "#445566",
      logo: null,
      endereco: null,
      linkMapa: null,
      instagram: null,
      whatsapp: null,
      horarioFuncionamento: null,
    });
  });
});

describe("ConfiguracoesClinica — aplicar alterações", () => {
  test("[C16] muda só as opções informadas", () => {
    const config = new ConfiguracoesClinica();
    config.setCorLateral("#445566");
    config.aplicar({ nomeClinica: "Studio Bella", corPrincipal: "#112233", logo: undefined });
    assert.equal(config.getNomeClinica(), "Studio Bella");
    assert.equal(config.getCorPrincipal(), "#112233");
    assert.equal(config.getCorLateral(), "#445566");
    assert.equal(config.getBotaoEntrarVisivel(), true);
  });

  test("[C17] sem nenhuma opção conhecida lança erro", () => {
    assert.throws(() => new ConfiguracoesClinica().aplicar({}), ErroDeValidacao);
  });

  test("[C18] valor inválido lança erro", () => {
    assert.throws(() => new ConfiguracoesClinica().aplicar({ corLateral: "azul" }), ErroDeValidacao);
    assert.throws(
      () => new ConfiguracoesClinica().aplicar({ cadastroLiberado: "sim" as unknown as boolean }),
      ErroDeValidacao
    );
  });
});
