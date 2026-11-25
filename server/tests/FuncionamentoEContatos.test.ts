/**
 * Teste de caixa branca — HorarioDeFuncionamento e contatos da clínica
 * Caminhos cobertos:
 *  HorarioDeFuncionamento.ler:
 *   [C1] lê os dias e devolve o mesmo JSON (ordenado) | [C2] sem "dias" / não é lista lança
 *   [C3] nenhum dia aberto lança | [C4] dia inválido lança | [C5] dia repetido lança
 *   [C6] horário fora da grade de 30min ou depois de 23:30 lança | [C7] fechamento <= abertura lança
 *  permite / abreNo:
 *   [C8] dentro do expediente (início na abertura, último slot termina no fechamento)
 *   [C9] antes da abertura ou ultrapassando o fechamento | [C10] dia fechado
 *  filtrarGrade: [C11] mantém só o que cabe | explicarRecusa: [C12] dia aberto e dia fechado
 *  ConfiguracoesClinica (contatos):
 *   [C13] Instagram: "@", link e nome puro viram o usuário | [C14] Instagram inválido lança
 *   [C15] WhatsApp guarda só os números | [C16] WhatsApp sem DDD lança
 *   [C17] link do mapa só http(s) | [C18] endereço: limpa, vazio = null, longo demais lança
 *   [C19] horarioFuncionamento: null limpa e aplicar() aceita o JSON
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { HorarioDeFuncionamento } from "../src/module/HorarioDeFuncionamento";
import { HorarioDisponivel } from "../src/module/HorarioDisponivel";
import { ConfiguracoesClinica } from "../src/module/ConfiguracoesClinica";
import { Horario } from "../src/module/Horario";
import { DiaSemana } from "../src/module/DiaSemana";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const SEMANA = {
  dias: [
    { diaSemana: 6, abertura: "08:00", fechamento: "12:00" },
    { diaSemana: 1, abertura: "08:00", fechamento: "18:00" },
  ],
};
const funcionamento = HorarioDeFuncionamento.ler(SEMANA);
const h = (valor: string) => new Horario(valor);

describe("HorarioDeFuncionamento — leitura", () => {
  test("[C1] lê os dias e devolve o JSON em ordem", () => {
    assert.deepEqual(funcionamento.toJSON(), {
      dias: [
        { diaSemana: 1, abertura: "08:00", fechamento: "18:00" },
        { diaSemana: 6, abertura: "08:00", fechamento: "12:00" },
      ],
    });
  });

  test("[C2] formato errado lança", () => {
    assert.throws(() => HorarioDeFuncionamento.ler(null), ErroDeValidacao);
    assert.throws(() => HorarioDeFuncionamento.ler({}), ErroDeValidacao);
    assert.throws(() => HorarioDeFuncionamento.ler({ dias: "seg" }), ErroDeValidacao);
  });

  test("[C3] nenhum dia aberto lança", () => {
    assert.throws(() => HorarioDeFuncionamento.ler({ dias: [] }), ErroDeValidacao);
  });

  test("[C4] dia da semana inválido lança", () => {
    for (const diaSemana of [7, -1, 1.5, "1"]) {
      assert.throws(
        () => HorarioDeFuncionamento.ler({ dias: [{ diaSemana, abertura: "08:00", fechamento: "12:00" }] }),
        ErroDeValidacao
      );
    }
  });

  test("[C5] dia repetido lança", () => {
    const dia = { diaSemana: 2, abertura: "08:00", fechamento: "12:00" };
    assert.throws(() => HorarioDeFuncionamento.ler({ dias: [dia, dia] }), ErroDeValidacao);
  });

  test("[C6] horário fora da grade lança", () => {
    for (const abertura of ["08:15", "8:00", "24:00", 800]) {
      assert.throws(
        () => HorarioDeFuncionamento.ler({ dias: [{ diaSemana: 2, abertura, fechamento: "12:00" }] }),
        ErroDeValidacao,
        String(abertura)
      );
    }
  });

  test("[C7] fechamento antes ou igual à abertura lança", () => {
    for (const fechamento of ["08:00", "07:30"]) {
      assert.throws(
        () => HorarioDeFuncionamento.ler({ dias: [{ diaSemana: 2, abertura: "08:00", fechamento }] }),
        ErroDeValidacao
      );
    }
  });
});

describe("HorarioDeFuncionamento — regras", () => {
  test("[C8] dentro do expediente", () => {
    assert.equal(funcionamento.abreNo(DiaSemana.SEGUNDA), true);
    assert.equal(funcionamento.permite(DiaSemana.SEGUNDA, h("08:00")), true);
    assert.equal(funcionamento.permite(DiaSemana.SEGUNDA, h("17:30")), true);
  });

  test("[C9] antes da abertura ou passando do fechamento", () => {
    assert.equal(funcionamento.permite(DiaSemana.SEGUNDA, h("07:30")), false);
    assert.equal(funcionamento.permite(DiaSemana.SEGUNDA, h("18:00")), false);
    assert.equal(funcionamento.permite(DiaSemana.SABADO, h("12:00")), false);
  });

  test("[C10] dia fechado não permite nada", () => {
    assert.equal(funcionamento.abreNo(DiaSemana.DOMINGO), false);
    assert.equal(funcionamento.permite(DiaSemana.DOMINGO, h("10:00")), false);
  });

  test("[C11] filtrarGrade mantém só o que cabe", () => {
    const grade = [
      new HorarioDisponivel(1, DiaSemana.SEGUNDA, h("09:00"), 1),
      new HorarioDisponivel(1, DiaSemana.SEGUNDA, h("19:00"), 2),
      new HorarioDisponivel(1, DiaSemana.DOMINGO, h("09:00"), 3),
      new HorarioDisponivel(1, DiaSemana.SABADO, h("11:30"), 4),
    ];
    assert.deepEqual(
      funcionamento.filtrarGrade(grade).map((horario) => horario.getId()),
      [1, 4]
    );
  });

  test("[C12] explica por que recusou", () => {
    assert.match(funcionamento.explicarRecusa(DiaSemana.SEGUNDA), /das 08:00 às 18:00/);
    assert.match(funcionamento.explicarRecusa(DiaSemana.DOMINGO), /não funciona no? ?a? ?domingo/);
  });
});

describe("ConfiguracoesClinica — contatos e funcionamento", () => {
  test("[C13] Instagram vira só o nome de usuário", () => {
    const config = new ConfiguracoesClinica();
    for (const valor of ["@studio.bella", "studio.bella", "https://www.instagram.com/studio.bella/?hl=pt"]) {
      config.setInstagram(valor);
      assert.equal(config.getInstagram(), "studio.bella", valor);
    }
    config.setInstagram("  ");
    assert.equal(config.getInstagram(), null);
  });

  test("[C14] Instagram inválido lança", () => {
    assert.throws(() => new ConfiguracoesClinica().setInstagram("studio bella"), ErroDeValidacao);
    assert.throws(() => new ConfiguracoesClinica().setInstagram("@" + "a".repeat(31)), ErroDeValidacao);
  });

  test("[C15] WhatsApp guarda só os números", () => {
    const config = new ConfiguracoesClinica();
    config.setWhatsapp("(98) 98877-6655");
    assert.equal(config.getWhatsapp(), "98988776655");
    config.setWhatsapp("");
    assert.equal(config.getWhatsapp(), null);
  });

  test("[C16] WhatsApp sem DDD lança", () => {
    assert.throws(() => new ConfiguracoesClinica().setWhatsapp("98877-6655"), ErroDeValidacao);
  });

  test("[C17] link do mapa só aceita http(s)", () => {
    const config = new ConfiguracoesClinica();
    config.setLinkMapa("https://maps.app.goo.gl/abc123");
    assert.equal(config.getLinkMapa(), "https://maps.app.goo.gl/abc123");
    assert.throws(() => config.setLinkMapa("javascript:alert(1)"), ErroDeValidacao);
    assert.throws(() => config.setLinkMapa("maps.google.com"), ErroDeValidacao);
  });

  test("[C18] endereço é limpo; vazio vira null; longo demais lança", () => {
    const config = new ConfiguracoesClinica();
    config.setEndereco("  Rua das Flores, 123  ");
    assert.equal(config.getEndereco(), "Rua das Flores, 123");
    config.setEndereco("");
    assert.equal(config.getEndereco(), null);
    assert.throws(() => config.setEndereco("a".repeat(201)), ErroDeValidacao);
  });

  test("[C19] horário de funcionamento pelo aplicar() e null limpa", () => {
    const config = new ConfiguracoesClinica();
    config.aplicar({ horarioFuncionamento: SEMANA });
    assert.deepEqual(config.toJSON().horarioFuncionamento?.toJSON(), funcionamento.toJSON());
    config.aplicar({ horarioFuncionamento: null });
    assert.equal(config.getHorarioFuncionamento(), null);
    assert.throws(() => config.aplicar({ horarioFuncionamento: { dias: [] } }), ErroDeValidacao);
  });
});
