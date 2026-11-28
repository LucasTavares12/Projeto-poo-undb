/**
 * Teste de caixa branca — Notificacao
 * Caminhos cobertos:
 *  novoAgendamento: [C1] origem CLIENTE ("agendou", "pelo site") | [C2] origem EQUIPE ("Agendado para", "pelo painel")
 *  servicos:        [C3] 1 serviço | 2 serviços ("A e B") | 3 serviços ("A, B e C")
 *  remarcado:       [C4] mensagem "de ... para ..."
 *  cancelado:       [C5] CLIENTE e EQUIPE; não fica ligado ao agendamento (ligarAoAgendamento = false)
 *  sobre:           [C6] agendamento sem id → agendamentoId null
 *  podeSerVistaPor: [C7] conta de outro profissional não vê (curto-circuito do &&)
 *                   [C8] agendamento novo: vê mesmo tendo sido o autor
 *                   [C9] remarcado/cancelado pela própria conta: não vê | [C10] feito por outro ou pelo cliente: vê
 *  toJSON:          [C11] não expõe o autor; data em ISO
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Notificacao } from "../src/module/Notificacao";
import { Agendamento } from "../src/module/Agendamento";
import { Cliente } from "../src/module/Cliente";
import { Profissional } from "../src/module/Profissional";
import { Tratamento } from "../src/module/Tratamento";
import { Horario } from "../src/module/Horario";
import { DataAgenda } from "../src/module/DataAgenda";
import { PerfilDeAcesso } from "../src/module/PerfilDeAcesso";
import { TipoNotificacao } from "../src/module/TipoNotificacao";
import { OrigemDaAcao } from "../src/module/OrigemDaAcao";

const cliente = new Cliente("Ana Souza", "(98) 98877-6655", 1);
const mariana = new Profissional("Mariana", "(98) 98111-2222", "Estética", 3);
const limpeza = new Tratamento("Limpeza de pele", "", 100, 60, 10);
const massagem = new Tratamento("Massagem", "", 50, 30, 11);
const drenagem = new Tratamento("Drenagem", "", 70, 30, 12);

const ag = (tratamentos = [limpeza], id: number | null = 50) =>
  new Agendamento(cliente, mariana, tratamentos, DataAgenda.ler("2026-11-05"), new Horario("10:00"), undefined, id ?? undefined);

describe("Notificacao.novoAgendamento", () => {
  test("[C1] feito pelo cliente no site", () => {
    const n = Notificacao.novoAgendamento(ag(), OrigemDaAcao.CLIENTE, null);
    assert.equal(n.getTipo(), TipoNotificacao.NOVO_AGENDAMENTO);
    assert.equal(n.getTitulo(), "Novo agendamento");
    assert.equal(n.getMensagem(), "Ana Souza agendou Limpeza de pele em qui, 05/11 às 10:00 com Mariana (pelo site).");
    assert.equal(n.getProfissionalId(), 3);
    assert.equal(n.getAgendamentoId(), 50);
    assert.equal(n.getOrigem(), OrigemDaAcao.CLIENTE);
    assert.equal(n.getAutorId(), null);
    assert.equal(n.getId(), undefined);
  });

  test("[C2] feito pela equipe no painel", () => {
    const n = Notificacao.novoAgendamento(ag(), OrigemDaAcao.EQUIPE, 7);
    assert.equal(n.getMensagem(), "Agendado para Ana Souza: Limpeza de pele em qui, 05/11 às 10:00 com Mariana (pelo painel).");
    assert.equal(n.getAutorId(), 7);
  });

  test("[C3] lista de serviços com 2 e com 3 nomes", () => {
    assert.match(
      Notificacao.novoAgendamento(ag([limpeza, massagem]), OrigemDaAcao.CLIENTE, null).getMensagem(),
      /agendou Limpeza de pele e Massagem em/
    );
    assert.match(
      Notificacao.novoAgendamento(ag([limpeza, massagem, drenagem]), OrigemDaAcao.CLIENTE, null).getMensagem(),
      /agendou Limpeza de pele, Massagem e Drenagem em/
    );
  });
});

describe("Notificacao.remarcado e cancelado", () => {
  test("[C4] remarcado mostra de quando para quando", () => {
    const n = Notificacao.remarcado(ag(), DataAgenda.ler("2026-11-02"), new Horario("09:30"), OrigemDaAcao.CLIENTE, null);
    assert.equal(n.getTipo(), TipoNotificacao.AGENDAMENTO_REMARCADO);
    assert.equal(n.getTitulo(), "Agendamento remarcado");
    assert.equal(n.getMensagem(), "Ana Souza: de seg, 02/11 às 09:30 para qui, 05/11 às 10:00 com Mariana (pelo site).");
    assert.equal(n.getAgendamentoId(), 50);
  });

  test("[C5] cancelado (cliente e equipe) não aponta mais para o agendamento", () => {
    const peloCliente = Notificacao.cancelado(ag(), OrigemDaAcao.CLIENTE, null);
    assert.equal(peloCliente.getTipo(), TipoNotificacao.AGENDAMENTO_CANCELADO);
    assert.equal(peloCliente.getMensagem(), "Ana Souza cancelou Limpeza de pele de qui, 05/11 às 10:00 com Mariana (pelo site).");
    assert.equal(peloCliente.getAgendamentoId(), null);

    const pelaEquipe = Notificacao.cancelado(ag(), OrigemDaAcao.EQUIPE, 7);
    assert.equal(
      pelaEquipe.getMensagem(),
      "Cancelado o agendamento de Ana Souza: Limpeza de pele de qui, 05/11 às 10:00 com Mariana (pelo painel)."
    );
  });

  test("[C6] agendamento ainda sem id gera agendamentoId null", () => {
    assert.equal(Notificacao.novoAgendamento(ag([limpeza], null), OrigemDaAcao.CLIENTE, null).getAgendamentoId(), null);
  });
});

describe("Notificacao.podeSerVistaPor", () => {
  const total = new PerfilDeAcesso(null);
  const daMariana = new PerfilDeAcesso(3);
  const deOutro = new PerfilDeAcesso(4);

  test("[C7] conta de outro profissional não vê", () => {
    assert.equal(Notificacao.novoAgendamento(ag(), OrigemDaAcao.CLIENTE, null).podeSerVistaPor(deOutro, 9), false);
  });

  test("[C8] agendamento novo aparece até para quem fez", () => {
    const n = Notificacao.novoAgendamento(ag(), OrigemDaAcao.EQUIPE, 7);
    assert.ok(n.podeSerVistaPor(total, 7));
    assert.ok(n.podeSerVistaPor(daMariana, 7));
  });

  test("[C9] remarcação e cancelamento feitos pela própria conta não aparecem para ela", () => {
    const remarcou = Notificacao.remarcado(ag(), DataAgenda.ler("2026-11-02"), new Horario("09:30"), OrigemDaAcao.EQUIPE, 7);
    assert.equal(remarcou.podeSerVistaPor(total, 7), false);
    assert.equal(Notificacao.cancelado(ag(), OrigemDaAcao.EQUIPE, 7).podeSerVistaPor(daMariana, 7), false);
  });

  test("[C10] feitos por outra conta ou pelo cliente aparecem", () => {
    assert.ok(Notificacao.cancelado(ag(), OrigemDaAcao.EQUIPE, 7).podeSerVistaPor(total, 8));
    assert.ok(Notificacao.cancelado(ag(), OrigemDaAcao.CLIENTE, null).podeSerVistaPor(daMariana, 7));
  });
});

describe("Notificacao.toJSON", () => {
  test("[C11] não expõe o autor e manda a data em ISO", () => {
    const criadaEm = new Date("2026-11-01T12:00:00Z");
    const n = new Notificacao(TipoNotificacao.NOVO_AGENDAMENTO, 3, 50, "T", "M", OrigemDaAcao.EQUIPE, 7, criadaEm, 1);
    assert.equal(n.getCriadaEm(), criadaEm);
    assert.deepEqual(n.toJSON(), {
      id: 1,
      tipo: TipoNotificacao.NOVO_AGENDAMENTO,
      profissionalId: 3,
      agendamentoId: 50,
      titulo: "T",
      mensagem: "M",
      origem: OrigemDaAcao.EQUIPE,
      criadaEm: "2026-11-01T12:00:00.000Z",
    });
  });
});
