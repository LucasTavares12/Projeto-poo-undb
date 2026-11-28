/**
 * Teste de caixa branca — valor do tratamento no cartão de crédito
 * Caminhos cobertos:
 *  Tratamento.setValorCartaoCredito:
 *   [C1] sem valor no crédito por padrão | [C2] valor aceito (inclui zero) | [C3] null/undefined tira
 *   [C4] negativo, NaN, Infinity ou texto lança e mantém o anterior
 *  Tratamento.getValorPara:
 *   [C5] crédito com valor cadastrado usa o do crédito | [C6] crédito sem valor usa o normal
 *   [C7] Pix, débito, dinheiro e "não informada" usam o normal
 *  Agendamento.getValorTotal: [C8] no crédito soma o do crédito de quem tem e o normal de quem não tem
 *   [C9] trocar a forma de pagamento muda o total | [C10] toJSON leva o total da forma escolhida
 *  RelatorioMensal: [C11] faturamento do mês e por tratamento usam o valor da forma escolhida
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Agendamento } from "../src/module/Agendamento";
import { Cliente } from "../src/module/Cliente";
import { Profissional } from "../src/module/Profissional";
import { Tratamento } from "../src/module/Tratamento";
import { Horario } from "../src/module/Horario";
import { DataAgenda } from "../src/module/DataAgenda";
import { StatusAgendamento } from "../src/module/StatusAgendamento";
import { FormaDePagamento } from "../src/module/FormaDePagamento";
import { RelatorioMensal } from "../src/module/RelatorioMensal";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const cliente = new Cliente("Maria", "(98) 98877-6655", 1);
const profissional = new Profissional("Ana", "(98) 98111-2222", "Estética", 2);

function tratamento(id: number, valor: number, credito: number | null): Tratamento {
  const t = new Tratamento(`T${id}`, "", valor, 60, id);
  t.setValorCartaoCredito(credito);
  return t;
}

function agendamento(
  tratamentos: Tratamento[],
  forma: FormaDePagamento | null,
  status = StatusAgendamento.AGENDADO
): Agendamento {
  return new Agendamento(
    cliente,
    profissional,
    tratamentos,
    DataAgenda.ler("2026-10-22"),
    new Horario("09:00"),
    status,
    100,
    false,
    null,
    null,
    null,
    null,
    { formaDePagamento: forma }
  );
}

describe("Tratamento — valor no cartão de crédito", () => {
  test("[C1] tratamento novo não tem valor no crédito (JSON leva null)", () => {
    const t = new Tratamento("Limpeza", "", 120, 60, 1);
    assert.equal(t.getValorCartaoCredito(), null);
    assert.equal(t.toJSON().valorCartaoCredito, null);
  });

  test("[C2] valor no crédito é aceito, inclusive zero", () => {
    assert.equal(tratamento(1, 120, 126.5).getValorCartaoCredito(), 126.5);
    assert.equal(tratamento(1, 120, 126.5).toJSON().valorCartaoCredito, 126.5);
    assert.equal(tratamento(1, 120, 0).getValorCartaoCredito(), 0);
  });

  test("[C3] null ou undefined tira o valor no crédito", () => {
    const t = tratamento(1, 120, 130);
    t.setValorCartaoCredito(null);
    assert.equal(t.getValorCartaoCredito(), null);
    t.setValorCartaoCredito(130);
    t.setValorCartaoCredito(undefined);
    assert.equal(t.getValorCartaoCredito(), null);
  });

  test("[C4] valor inválido lança erro e mantém o anterior", () => {
    const t = tratamento(1, 120, 130);
    for (const valor of [-1, NaN, Infinity, "130" as unknown as number]) {
      assert.throws(() => t.setValorCartaoCredito(valor), ErroDeValidacao, String(valor));
    }
    assert.equal(t.getValorCartaoCredito(), 130);
  });

  test("[C5] no crédito com valor cadastrado vale o do crédito", () => {
    assert.equal(tratamento(1, 120, 130).getValorPara(FormaDePagamento.CARTAO_CREDITO), 130);
  });

  test("[C6] no crédito sem valor cadastrado vale o normal", () => {
    assert.equal(tratamento(1, 120, null).getValorPara(FormaDePagamento.CARTAO_CREDITO), 120);
  });

  test('[C7] Pix, débito, dinheiro e "não informada" usam o valor normal', () => {
    const t = tratamento(1, 120, 130);
    for (const forma of [FormaDePagamento.PIX, FormaDePagamento.CARTAO_DEBITO, FormaDePagamento.DINHEIRO, null]) {
      assert.equal(t.getValorPara(forma), 120, String(forma));
    }
  });
});

describe("Agendamento — total conforme a forma de pagamento", () => {
  const comCredito = tratamento(1, 120, 130);
  const semCredito = tratamento(2, 80, null);

  test("[C8] no crédito soma o do crédito de quem tem e o normal de quem não tem", () => {
    assert.equal(agendamento([comCredito, semCredito], FormaDePagamento.CARTAO_CREDITO).getValorTotal(), 210);
    assert.equal(agendamento([comCredito, semCredito], FormaDePagamento.PIX).getValorTotal(), 200);
    assert.equal(agendamento([comCredito, semCredito], null).getValorTotal(), 200);
  });

  test("[C9] trocar a forma de pagamento muda o total", () => {
    const a = agendamento([comCredito], FormaDePagamento.PIX);
    assert.equal(a.getValorTotal(), 120);
    a.definirFormaDePagamento(FormaDePagamento.CARTAO_CREDITO);
    assert.equal(a.getValorTotal(), 130);
    assert.equal(a.getValorDo(comCredito), 130);
    a.definirFormaDePagamento(FormaDePagamento.CARTAO_DEBITO);
    assert.equal(a.getValorTotal(), 120);
  });

  test("[C10] o JSON leva o total da forma escolhida", () => {
    assert.equal(agendamento([comCredito], FormaDePagamento.CARTAO_CREDITO).toJSON().valorTotal, 130);
  });
});

describe("RelatorioMensal — valor no crédito", () => {
  test("[C11] faturamento do mês e por tratamento usam o valor da forma escolhida", () => {
    const t = tratamento(1, 100, 110);
    const relatorio = new RelatorioMensal("2026-10", [
      agendamento([t], FormaDePagamento.CARTAO_CREDITO, StatusAgendamento.FINALIZADO),
      agendamento([t], FormaDePagamento.PIX, StatusAgendamento.FINALIZADO),
    ]);
    const json = relatorio.toJSON();
    assert.equal(json.faturamentoTotal, 210);
    assert.equal(json.tratamentosMaisRealizados[0].faturamento, 210);
  });
});
