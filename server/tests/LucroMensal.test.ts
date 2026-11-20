/**
 * Teste de caixa branca — lucro do mês (faturamento − gasto informado)
 *
 *  GastoMensal.novo / setValor:
 *    [G1] mês fora do formato lança | [G2] valor negativo, vazio ou texto lança
 *    [G3] arredonda para centavos e aceita texto numérico | [G4] zero é válido
 *    [G5] valor acima do máximo lança
 *  MesReferencia (objeto de valor):
 *    [M1] anterior de um mês comum | [M2] janeiro volta para dezembro do ano anterior
 *    [M3] formato inválido lança | [M4] dias do mês (fevereiro bissexto) | [M5] contem()
 *  LucroMensal:
 *    [L1] sem gasto: lucro e margem null | [L2] com gasto: lucro e margem
 *    [L3] gasto maior que o faturamento: prejuízo (lucro negativo)
 *    [L4] sem faturamento: margem null
 *    [L5] lucro de um profissional: faturamento dele − gasto próprio dele
 *    [L6] gasto de outro mês lança | [L7] toJSON leva o gasto do mês anterior
 *    [L8] gasto de outro profissional (ou da clínica) no relatório errado lança
 *  GastoMensal.ehDaClinica: [G6] sem profissional = clínica
 *  PerfilDeAcesso.aplicarFiltro:
 *    [P1] acesso total usa o filtro pedido | [P2] conta de profissional vê sempre o dela
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { GastoMensal } from "../src/module/GastoMensal";
import { LucroMensal } from "../src/module/LucroMensal";
import { RelatorioMensal } from "../src/module/RelatorioMensal";
import { Agendamento } from "../src/module/Agendamento";
import { Cliente } from "../src/module/Cliente";
import { Profissional } from "../src/module/Profissional";
import { Tratamento } from "../src/module/Tratamento";
import { Horario } from "../src/module/Horario";
import { DataAgenda } from "../src/module/DataAgenda";
import { StatusAgendamento } from "../src/module/StatusAgendamento";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";
import { PerfilDeAcesso } from "../src/module/PerfilDeAcesso";
import { MesReferencia } from "../src/module/MesReferencia";

const MES = "2026-10";

function finalizado(valor: number, dia: string, profissionalId = 2): Agendamento {
  return new Agendamento(
    new Cliente("Maria", "(98) 98877-6655", 1),
    new Profissional("Bia", "(98) 98111-2222", "Estética", profissionalId),
    [new Tratamento("Limpeza", "", valor, 60, 10)],
    DataAgenda.ler(dia),
    new Horario("09:00"),
    StatusAgendamento.FINALIZADO,
    1
  );
}

// Faturamento de R$ 1.000,00 no mês: R$ 600,00 da profissional 2 e R$ 400,00 da 3.
const agendamentosDoMes = [finalizado(600, "2026-10-05"), finalizado(400, "2026-10-20", 3)];
const relatorio = new RelatorioMensal(MES, agendamentosDoMes);

describe("GastoMensal", () => {
  test("[G1] mês fora do formato lança", () => {
    assert.throws(() => GastoMensal.novo("10/2026", 100), ErroDeValidacao);
  });

  test("[G2] valor negativo, vazio ou texto lança", () => {
    for (const valor of [-1, "", "abc", null, undefined, Number.NaN]) {
      assert.throws(() => GastoMensal.novo(MES, valor), ErroDeValidacao);
    }
  });

  test("[G3] arredonda para centavos e aceita texto numérico", () => {
    assert.equal(GastoMensal.novo(MES, 1250.505).getValor(), 1250.51);
    assert.equal(GastoMensal.novo(MES, "300.5").getValor(), 300.5);
  });

  test("[G4] zero é válido (mês sem gasto)", () => {
    assert.equal(GastoMensal.novo(MES, 0).getValor(), 0);
  });

  test("[G5] valor acima do máximo lança", () => {
    assert.throws(() => GastoMensal.novo(MES, GastoMensal.VALOR_MAXIMO * 10), ErroDeValidacao);
  });
});

describe("MesReferencia", () => {
  test("[M1] anterior de um mês comum", () => {
    assert.equal(new MesReferencia("2026-10").anterior().toString(), "2026-09");
  });

  test("[M2] janeiro volta para dezembro do ano anterior", () => {
    assert.equal(new MesReferencia("2026-01").anterior().toString(), "2025-12");
  });

  test("[M3] formato inválido lança", () => {
    for (const texto of ["2026-13", "2026-1", "10/2026", ""]) {
      assert.throws(() => new MesReferencia(texto), ErroDeValidacao);
    }
  });

  test("[M4] primeiro e último dia (fevereiro de ano bissexto)", () => {
    const fevereiro = new MesReferencia("2028-02");
    assert.equal(fevereiro.getPrimeiroDia(), "2028-02-01");
    assert.equal(fevereiro.getUltimoDia(), "2028-02-29");
  });

  test("[M5] contem() só aceita datas do próprio mês", () => {
    const outubro = new MesReferencia("2026-10");
    assert.ok(outubro.contem("2026-10-31"));
    assert.equal(outubro.contem("2026-11-01"), false);
  });
});

describe("LucroMensal", () => {
  test("[L1] sem gasto informado: lucro e margem ficam null", () => {
    const lucro = new LucroMensal(relatorio, null);
    assert.equal(lucro.gastoFoiInformado(), false);
    assert.equal(lucro.getFaturamento(), 1000);
    assert.equal(lucro.getLucro(), null);
    assert.equal(lucro.getMargem(), null);
  });

  test("[L2] com gasto: lucro = faturamento − gasto e margem em %", () => {
    const lucro = new LucroMensal(relatorio, GastoMensal.novo(MES, 750.25));
    assert.equal(lucro.getLucro(), 249.75);
    assert.equal(lucro.getMargem(), 24.975);
  });

  test("[L3] gasto maior que o faturamento: prejuízo", () => {
    const lucro = new LucroMensal(relatorio, GastoMensal.novo(MES, 1500));
    assert.equal(lucro.getLucro(), -500);
    assert.equal(lucro.getMargem(), -50);
  });

  test("[L4] sem faturamento no mês: margem null", () => {
    const vazio = new RelatorioMensal(MES, []);
    const lucro = new LucroMensal(vazio, GastoMensal.novo(MES, 200));
    assert.equal(lucro.getLucro(), -200);
    assert.equal(lucro.getMargem(), null);
  });

  test("[L5] lucro de um profissional: faturamento dele − gasto próprio dele", () => {
    const daBia = new RelatorioMensal(MES, agendamentosDoMes, 2);
    const lucro = new LucroMensal(daBia, GastoMensal.novo(MES, 150, 2));
    assert.equal(lucro.getProfissionalId(), 2);
    assert.equal(lucro.getFaturamento(), 600);
    assert.equal(lucro.getLucro(), 450);
  });

  test("[L8] gasto de outro profissional (ou da clínica) no relatório errado lança", () => {
    const daBia = new RelatorioMensal(MES, agendamentosDoMes, 2);
    assert.throws(() => new LucroMensal(daBia, GastoMensal.novo(MES, 150, 3)), ErroDeValidacao);
    assert.throws(() => new LucroMensal(daBia, GastoMensal.novo(MES, 150)), ErroDeValidacao);
    assert.throws(() => new LucroMensal(relatorio, GastoMensal.novo(MES, 150, 2)), ErroDeValidacao);
  });

  test("[L6] gasto de outro mês lança", () => {
    assert.throws(
      () => new LucroMensal(relatorio, GastoMensal.novo("2026-09", 100)),
      ErroDeValidacao
    );
  });

  test("[L7] toJSON leva o gasto do mês anterior (para sugerir o mesmo valor)", () => {
    const json = new LucroMensal(relatorio, null, GastoMensal.novo("2026-09", 800)).toJSON();
    assert.deepEqual(json, {
      mes: MES,
      profissionalId: null,
      faturamento: 1000,
      gasto: null,
      lucro: null,
      margem: null,
      gastoDoMesAnterior: 800,
    });
  });
});

describe("GastoMensal.ehDaClinica", () => {
  test("[G6] sem profissional é o gasto da clínica; com profissional, o dele", () => {
    assert.equal(GastoMensal.novo(MES, 10).ehDaClinica(), true);
    assert.equal(GastoMensal.novo(MES, 10, 2).ehDaClinica(), false);
  });
});

describe("PerfilDeAcesso.aplicarFiltro", () => {
  test("[P1] acesso total usa o filtro pedido (null = clínica inteira)", () => {
    const total = new PerfilDeAcesso(null);
    assert.equal(total.aplicarFiltro(null), null);
    assert.equal(total.aplicarFiltro(3), 3);
  });

  test("[P2] conta de profissional vê sempre o dela, qualquer que seja o filtro", () => {
    const daBia = new PerfilDeAcesso(2);
    assert.equal(daBia.aplicarFiltro(null), 2);
    assert.equal(daBia.aplicarFiltro(3), 2);
  });
});
