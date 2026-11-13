/**
 * Teste de caixa branca — Agendamento (a classe com mais desvios do domínio)
 *
 * Grafo de fluxo resumido dos métodos testados:
 *  construtor:       [C1] sem tratamentos lança | [C2] com tratamentos
 *  somatórios:       [C3] valor, duração e slots somam todos os tratamentos
 *  getHorariosOcupados: [C4] laço executa N vezes (N = slots)
 *  avancarStatus:    [C5] AGENDADO→EM_ATENDIMENTO | [C6] EM_ATENDIMENTO→FINALIZADO | [C7] FINALIZADO não muda
 *  podeSerAlteradoPeloCliente: [C8] AGENDADO e com antecedência | [C9] AGENDADO sem antecedência
 *                              [C10] não AGENDADO (curto-circuito do &&)
 *  remarcar:         [C11] status ≠ AGENDADO lança | [C12] mesmo dia e horário lança
 *                    [C13] mesmo dia, outro horário ok e zera lembrete | [C14] outro dia, mesmo horário ok
 *  registrarMensagem:[C15] LEMBRETE em AGENDADO | [C16] LEMBRETE fora de AGENDADO lança
 *                    [C17] AGRADECIMENTO em FINALIZADO | [C18] AGRADECIMENTO fora de FINALIZADO lança
 *                    [C19] tipo desconhecido lança (else final)
 *  arquivar:         [C20] finalizado e não arquivado | [C21] não finalizado lança | [C22] já arquivado lança
 *  desarquivar:      [C23] não arquivado lança | [C24] arquivado volta e reinicia finalizadoEm
 *  moverPara:        [C25] status inválido lança | [C26] mesmo status não altera nada
 *                    [C27] para FINALIZADO marca finalizadoEm | [C28] sair de FINALIZADO zera finalizadoEm
 *  toJSON:           [C29] datas null | [C30] datas preenchidas viram ISO
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
import { TipoMensagem } from "../src/module/TipoMensagem";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const cliente = new Cliente("Maria", "(98) 98877-6655", 1);
const profissional = new Profissional("Ana", "(98) 98111-2222", "Estética", 2);
const limpeza = new Tratamento("Limpeza", "", 120, 60, 10); // 2 slots
const massagem = new Tratamento("Massagem", "", 80.5, 30, 11); // 1 slot
const DATA = DataAgenda.ler("2026-10-22");

function criar(status = StatusAgendamento.AGENDADO, extras: Partial<{
  arquivado: boolean;
  lembrete: Date | null;
  agradecimento: Date | null;
  finalizadoEm: Date | null;
}> = {}) {
  return new Agendamento(
    cliente,
    profissional,
    [limpeza, massagem],
    DATA,
    new Horario("09:00"),
    status,
    100,
    extras.arquivado ?? false,
    extras.lembrete ?? null,
    extras.agradecimento ?? null,
    extras.finalizadoEm ?? null
  );
}

describe("Agendamento construtor e somatórios", () => {
  test("[C1] lista de tratamentos vazia lança erro", () => {
    assert.throws(
      () => new Agendamento(cliente, profissional, [], DATA, new Horario("09:00")),
      ErroDeValidacao
    );
  });

  test("[C2] valores padrão do construtor", () => {
    const a = new Agendamento(cliente, profissional, [limpeza], DATA, new Horario("09:00"));
    assert.equal(a.getStatus(), StatusAgendamento.AGENDADO);
    assert.equal(a.getId(), undefined);
    assert.equal(a.estaArquivado(), false);
    assert.equal(a.getLembreteEnviadoEm(), null);
    assert.equal(a.getFinalizadoEm(), null);
  });

  test("[C3] soma valor, duração e slots de todos os tratamentos", () => {
    const a = criar();
    assert.equal(a.getValorTotal(), 200.5);
    assert.equal(a.getDuracaoTotalMinutos(), 90);
    assert.equal(a.getQuantidadeSlots(), 3);
  });

  test("[C4] horários ocupados seguem a quantidade de slots", () => {
    assert.deepEqual(
      criar().getHorariosOcupados().map(String),
      ["09:00", "09:30", "10:00"]
    );
  });
});

describe("Agendamento.avancarStatus", () => {
  test("[C5] AGENDADO avança para EM_ATENDIMENTO", () => {
    const a = criar();
    a.avancarStatus();
    assert.equal(a.getStatus(), StatusAgendamento.EM_ATENDIMENTO);
    assert.equal(a.getFinalizadoEm(), null);
  });

  test("[C6] EM_ATENDIMENTO avança para FINALIZADO e marca finalizadoEm", () => {
    const a = criar(StatusAgendamento.EM_ATENDIMENTO);
    a.avancarStatus();
    assert.equal(a.getStatus(), StatusAgendamento.FINALIZADO);
    assert.ok(a.getFinalizadoEm() instanceof Date);
  });

  test("[C7] FINALIZADO não muda (nenhum ramo do if executa)", () => {
    const marca = new Date("2026-01-01T00:00:00Z");
    const a = criar(StatusAgendamento.FINALIZADO, { finalizadoEm: marca });
    a.avancarStatus();
    assert.equal(a.getStatus(), StatusAgendamento.FINALIZADO);
    assert.equal(a.getFinalizadoEm(), marca);
  });
});

describe("Agendamento.podeSerAlteradoPeloCliente", () => {
  const inicio = RelogioClinica.momento(DATA, new Horario("09:00")).getTime();

  test("[C8] AGENDADO e com 3h de antecedência → true", () => {
    assert.equal(criar().podeSerAlteradoPeloCliente(new Date(inicio - 3 * 3600_000)), true);
  });

  test("[C9] AGENDADO a 1h do horário → false", () => {
    assert.equal(criar().podeSerAlteradoPeloCliente(new Date(inicio - 3600_000)), false);
  });

  test("[C10] EM_ATENDIMENTO → false mesmo com antecedência", () => {
    const a = criar(StatusAgendamento.EM_ATENDIMENTO);
    assert.equal(a.podeSerCancelado(), false);
    assert.equal(a.podeSerAlteradoPeloCliente(new Date(inicio - 48 * 3600_000)), false);
  });
});

describe("Agendamento.remarcar", () => {
  test("[C11] não remarca o que não está AGENDADO", () => {
    const a = criar(StatusAgendamento.FINALIZADO);
    assert.equal(a.podeSerRemarcado(), false);
    assert.throws(() => a.remarcar(DataAgenda.ler("2026-10-23"), new Horario("10:00")), ErroDeValidacao);
  });

  test("[C12] mesmo dia e mesmo horário lança erro", () => {
    assert.throws(() => criar().remarcar(DATA, new Horario("09:00")), ErroDeValidacao);
  });

  test("[C13] mesmo dia, outro horário: muda e zera o lembrete", () => {
    const a = criar(StatusAgendamento.AGENDADO, { lembrete: new Date() });
    a.remarcar(DATA, new Horario("15:00"));
    assert.equal(a.getHorarioInicio().toString(), "15:00");
    assert.equal(a.getLembreteEnviadoEm(), null);
  });

  test("[C14] outro dia, mesmo horário: é aceito", () => {
    const a = criar();
    const novaData = DataAgenda.ler("2026-10-25");
    a.remarcar(novaData, new Horario("09:00"));
    assert.ok(a.estaMarcadoEm(novaData, new Horario("09:00")));
  });
});

describe("Agendamento.registrarMensagem", () => {
  const quando = new Date("2026-10-21T12:00:00Z");

  test("[C15] lembrete em AGENDADO é registrado", () => {
    const a = criar();
    a.registrarMensagem(TipoMensagem.LEMBRETE, quando);
    assert.equal(a.getLembreteEnviadoEm(), quando);
  });

  test("[C16] lembrete fora de AGENDADO lança erro", () => {
    assert.throws(
      () => criar(StatusAgendamento.FINALIZADO).registrarMensagem(TipoMensagem.LEMBRETE),
      ErroDeValidacao
    );
  });

  test("[C17] agradecimento em FINALIZADO é registrado", () => {
    const a = criar(StatusAgendamento.FINALIZADO);
    a.registrarMensagem(TipoMensagem.AGRADECIMENTO, quando);
    assert.equal(a.getAgradecimentoEnviadoEm(), quando);
  });

  test("[C18] agradecimento fora de FINALIZADO lança erro", () => {
    assert.throws(
      () => criar(StatusAgendamento.EM_ATENDIMENTO).registrarMensagem(TipoMensagem.AGRADECIMENTO),
      ErroDeValidacao
    );
  });

  test("[C19] tipo de mensagem desconhecido cai no else e lança erro", () => {
    assert.throws(
      () => criar().registrarMensagem("SPAM" as TipoMensagem),
      { name: "ErroDeValidacao", message: /Tipo de mensagem inválido: SPAM/ }
    );
  });
});

describe("Agendamento.arquivar / desarquivar", () => {
  test("[C20] finalizado e não arquivado pode ser arquivado", () => {
    const a = criar(StatusAgendamento.FINALIZADO);
    assert.ok(a.podeSerArquivado());
    a.arquivar();
    assert.ok(a.estaArquivado());
  });

  test("[C21] não finalizado não pode ser arquivado", () => {
    const a = criar();
    assert.equal(a.podeSerArquivado(), false);
    assert.throws(() => a.arquivar(), ErroDeValidacao);
  });

  test("[C22] já arquivado não pode ser arquivado de novo", () => {
    const a = criar(StatusAgendamento.FINALIZADO, { arquivado: true });
    assert.equal(a.podeSerArquivado(), false);
    assert.throws(() => a.arquivar(), ErroDeValidacao);
  });

  test("[C23] desarquivar o que não está arquivado lança erro", () => {
    assert.throws(() => criar(StatusAgendamento.FINALIZADO).desarquivar(), ErroDeValidacao);
  });

  test("[C24] desarquivar devolve ao quadro e reinicia finalizadoEm", () => {
    const antigo = new Date("2020-01-01T00:00:00Z");
    const a = criar(StatusAgendamento.FINALIZADO, { arquivado: true, finalizadoEm: antigo });
    const antes = Date.now();
    a.desarquivar();
    assert.equal(a.estaArquivado(), false);
    assert.ok(a.getFinalizadoEm()!.getTime() >= antes);
  });
});

describe("Agendamento.moverPara", () => {
  test("[C25] status inexistente lança erro", () => {
    assert.throws(() => criar().moverPara("CANCELADO" as StatusAgendamento), ErroDeValidacao);
  });

  test("[C26] mover para o mesmo status não altera finalizadoEm (return antecipado)", () => {
    const marca = new Date("2026-01-01T00:00:00Z");
    const a = criar(StatusAgendamento.FINALIZADO, { finalizadoEm: marca });
    a.moverPara(StatusAgendamento.FINALIZADO);
    assert.equal(a.getFinalizadoEm(), marca);
  });

  test("[C27] mover direto de AGENDADO para FINALIZADO marca finalizadoEm", () => {
    const a = criar();
    a.moverPara(StatusAgendamento.FINALIZADO);
    assert.ok(a.getFinalizadoEm() instanceof Date);
  });

  test("[C28] voltar de FINALIZADO zera finalizadoEm", () => {
    const a = criar(StatusAgendamento.FINALIZADO, { finalizadoEm: new Date() });
    a.moverPara(StatusAgendamento.AGENDADO);
    assert.equal(a.getStatus(), StatusAgendamento.AGENDADO);
    assert.equal(a.getFinalizadoEm(), null);
  });
});

describe("Agendamento.toJSON", () => {
  test("[C29] mensagens não enviadas aparecem como null", () => {
    const json = criar().toJSON();
    assert.equal(json.id, 100);
    assert.equal(json.data, "2026-10-22");
    assert.equal(json.valorTotal, 200.5);
    assert.equal(json.duracaoTotalMinutos, 90);
    assert.equal(json.lembreteEnviadoEm, null);
    assert.equal(json.agradecimentoEnviadoEm, null);
  });

  test("[C30] mensagens enviadas aparecem em ISO", () => {
    const quando = new Date("2026-10-21T12:00:00Z");
    const json = criar(StatusAgendamento.FINALIZADO, { lembrete: quando, agradecimento: quando }).toJSON();
    assert.equal(json.lembreteEnviadoEm, "2026-10-21T12:00:00.000Z");
    assert.equal(json.agradecimentoEnviadoEm, "2026-10-21T12:00:00.000Z");
  });
});
