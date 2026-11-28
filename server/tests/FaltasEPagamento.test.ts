/**
 * Teste de caixa branca — faltas e forma de pagamento
 * Caminhos cobertos:
 *  FormaDePagamento:
 *   ler: [C1] código válido devolve a mesma instância | [C2] código inválido lança
 *   lerOpcional: [C3] vazio/null/undefined = null | [C4] inválido lança
 *   toJSON/getNome: [C5] JSON é o código, nome é o texto
 *  Agendamento: [C6] definirFormaDePagamento troca e aceita null
 *  Agendamento.registrarFalta / moverPara(FALTOU):
 *   [C7] depois do horário vira FALTOU e marca finalizadoEm | [C8] antes do horário lança
 *   [C9] fora de AGENDADO lança | [C10] moverPara(FALTOU) usa a mesma regra
 *   [C11] desfazer (FALTOU → AGENDADO) zera finalizadoEm | [C12] falta pode ser arquivada
 *  HistoricoCliente: [C13] conta faltas e taxa | [C14] sem encerrados a taxa é 0
 *  RelatorioMensal: [C15] faltas e taxa do mês | [C16] faturamento por forma (inclui "Não informada")
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Agendamento } from "../src/module/Agendamento";
import { Cliente } from "../src/module/Cliente";
import { Profissional } from "../src/module/Profissional";
import { Tratamento } from "../src/module/Tratamento";
import { Horario } from "../src/module/Horario";
import { DataAgenda } from "../src/module/DataAgenda";
import { RelogioClinica } from "../src/module/RelogioClinica";
import { StatusAgendamento } from "../src/module/StatusAgendamento";
import { FormaDePagamento } from "../src/module/FormaDePagamento";
import { HistoricoCliente } from "../src/module/HistoricoCliente";
import { RelatorioMensal } from "../src/module/RelatorioMensal";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const cliente = new Cliente("Maria", "(98) 98877-6655", 1);
const profissional = new Profissional("Ana", "(98) 98111-2222", "Estética", 2);
const limpeza = new Tratamento("Limpeza", "", 120, 60, 10);
const DATA = DataAgenda.ler("2026-10-22");
const HORARIO = new Horario("09:00");
const INICIO = RelogioClinica.momento(DATA, HORARIO);
const ANTES = new Date(INICIO.getTime() - 60 * 60 * 1000); // 1h antes
const DEPOIS = new Date(INICIO.getTime() + 15 * 60 * 1000); // 15min depois

function criar(
  status = StatusAgendamento.AGENDADO,
  forma: FormaDePagamento | null = null,
  data = DATA
): Agendamento {
  return new Agendamento(
    cliente,
    profissional,
    [limpeza],
    data,
    HORARIO,
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

describe("FormaDePagamento", () => {
  test("[C1] código válido devolve a mesma instância", () => {
    assert.equal(FormaDePagamento.ler("PIX"), FormaDePagamento.PIX);
    assert.equal(FormaDePagamento.ler("CARTAO_DEBITO"), FormaDePagamento.CARTAO_DEBITO);
  });

  test("[C2] código inválido lança erro", () => {
    for (const codigo of ["pix", "BOLETO", 1, null, undefined]) {
      assert.throws(() => FormaDePagamento.ler(codigo), ErroDeValidacao, String(codigo));
    }
  });

  test("[C3] vazio vira não informada", () => {
    assert.equal(FormaDePagamento.lerOpcional(""), null);
    assert.equal(FormaDePagamento.lerOpcional(null), null);
    assert.equal(FormaDePagamento.lerOpcional(undefined), null);
  });

  test("[C4] lerOpcional com código inválido lança erro", () => {
    assert.throws(() => FormaDePagamento.lerOpcional("CHEQUE"), ErroDeValidacao);
  });

  test("[C5] JSON é o código e o nome é o texto", () => {
    assert.equal(JSON.stringify(FormaDePagamento.CARTAO_CREDITO), '"CARTAO_CREDITO"');
    assert.equal(FormaDePagamento.DINHEIRO.getNome(), "Dinheiro");
    assert.equal(FormaDePagamento.todas().length, 4);
  });
});

describe("Agendamento — forma de pagamento", () => {
  test("[C6] forma de pagamento pode ser trocada ou apagada", () => {
    const agendamento = criar(StatusAgendamento.AGENDADO, FormaDePagamento.PIX);
    assert.equal(agendamento.getFormaDePagamento(), FormaDePagamento.PIX);
    agendamento.definirFormaDePagamento(FormaDePagamento.DINHEIRO);
    assert.equal(agendamento.toJSON().formaDePagamento, FormaDePagamento.DINHEIRO);
    agendamento.definirFormaDePagamento(null);
    assert.equal(agendamento.getFormaDePagamento(), null);
  });
});

describe("Agendamento — faltas", () => {
  test("[C7] depois do horário vira 'Não compareceu'", () => {
    const agendamento = criar();
    agendamento.registrarFalta(DEPOIS);
    assert.equal(agendamento.getStatus(), StatusAgendamento.FALTOU);
    assert.equal(agendamento.faltou(), true);
    assert.equal(agendamento.estaEncerrado(), true);
    assert.equal(agendamento.getFinalizadoEm(), DEPOIS);
  });

  test("[C8] antes do horário não dá para marcar falta", () => {
    assert.throws(() => criar().registrarFalta(ANTES), ErroDeValidacao);
  });

  test("[C9] só quem está 'Agendado' pode faltar", () => {
    assert.throws(() => criar(StatusAgendamento.EM_ATENDIMENTO).registrarFalta(DEPOIS), ErroDeValidacao);
    assert.throws(() => criar(StatusAgendamento.FINALIZADO).registrarFalta(DEPOIS), ErroDeValidacao);
  });

  test("[C10] moverPara(FALTOU) segue a mesma regra", () => {
    assert.throws(() => criar().moverPara(StatusAgendamento.FALTOU, ANTES), ErroDeValidacao);
    const agendamento = criar();
    agendamento.moverPara(StatusAgendamento.FALTOU, DEPOIS);
    assert.equal(agendamento.getStatus(), StatusAgendamento.FALTOU);
  });

  test("[C11] desfazer a falta volta para 'Agendado'", () => {
    const agendamento = criar();
    agendamento.registrarFalta(DEPOIS);
    agendamento.moverPara(StatusAgendamento.AGENDADO);
    assert.equal(agendamento.getStatus(), StatusAgendamento.AGENDADO);
    assert.equal(agendamento.getFinalizadoEm(), null);
  });

  test("[C12] falta pode sair do quadro como os finalizados", () => {
    const agendamento = criar(StatusAgendamento.FALTOU);
    assert.equal(agendamento.podeSerArquivado(), true);
    agendamento.arquivar();
    assert.equal(agendamento.estaArquivado(), true);
  });
});

describe("Faltas no histórico e no relatório", () => {
  test("[C13] histórico conta faltas e taxa", () => {
    const historico = new HistoricoCliente("98988776655", [
      criar(StatusAgendamento.FINALIZADO),
      criar(StatusAgendamento.FINALIZADO),
      criar(StatusAgendamento.FINALIZADO),
      criar(StatusAgendamento.FALTOU),
      criar(StatusAgendamento.AGENDADO), // ainda não aconteceu: não entra na taxa
    ]);
    assert.equal(historico.getFaltas().length, 1);
    assert.equal(historico.getTaxaDeFaltas(), 0.25);
    assert.equal(historico.paraResumo("2026-10-01").faltas, 1);
  });

  test("[C14] sem horários encerrados a taxa é 0", () => {
    const historico = new HistoricoCliente("98988776655", [criar(StatusAgendamento.AGENDADO)]);
    assert.equal(historico.getTaxaDeFaltas(), 0);
  });

  test("[C15] relatório conta as faltas do mês", () => {
    const relatorio = new RelatorioMensal("2026-10", [
      criar(StatusAgendamento.FINALIZADO),
      criar(StatusAgendamento.FALTOU),
      criar(StatusAgendamento.FALTOU, null, DataAgenda.ler("2026-11-02")), // outro mês
    ]);
    assert.equal(relatorio.getQuantidadeFaltas(), 1);
    assert.equal(relatorio.getTaxaDeFaltas(), 0.5);
    assert.equal(relatorio.getQuantidadeAtendimentos(), 1);
  });

  test("[C16] faturamento por forma de pagamento (maior primeiro)", () => {
    const relatorio = new RelatorioMensal("2026-10", [
      criar(StatusAgendamento.FINALIZADO, FormaDePagamento.PIX),
      criar(StatusAgendamento.FINALIZADO, FormaDePagamento.PIX),
      criar(StatusAgendamento.FINALIZADO, null),
      criar(StatusAgendamento.FALTOU, FormaDePagamento.DINHEIRO), // falta não fatura
    ]);
    assert.deepEqual(relatorio.getFaturamentoPorFormaDePagamento(), [
      { formaDePagamento: "PIX", nome: "Pix", atendimentos: 2, faturamento: 240 },
      { formaDePagamento: null, nome: "Não informada", atendimentos: 1, faturamento: 120 },
    ]);
  });
});
