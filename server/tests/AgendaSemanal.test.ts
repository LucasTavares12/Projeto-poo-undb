/**
 * Teste de caixa branca — AgendaSemanal (e a classe interna DiaDaAgenda)
 * Caminhos cobertos:
 *  construtor:     [C1] período fora de 1..31 ou não inteiro lança | [C2] 1 e 31 dias aceitos (valores-limite)
 *  calcularLinhas: [C3] só horários da grade dos dias da semana do período
 *                  [C4] faixas de agendamentos fora da grade também viram linhas, em ordem
 *  montarBlocos:   [C5] agendamento ocupa todas as suas faixas (as cobertas não viram bloco)
 *                  [C6] linha não liberada naquele dia não vira bloco
 *                  [C7] agendamento que começa dentro de outro não aparece (indice > ocupadoAte falso)
 *  situacaoDoHorarioLiberado: [C8] livre (futuro) | [C9] passado (inclusive no instante exato)
 *                             [C10] fechado (bloqueio), mesmo que já tenha passado
 *  toJSON do dia:  [C11] contagens, motivo do fechamento (vazio vira null)
 *  toJSON:         [C12] profissional, início e linhas
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AgendaSemanal } from "../src/module/AgendaSemanal";
import { Agendamento } from "../src/module/Agendamento";
import { BloqueioAgenda } from "../src/module/BloqueioAgenda";
import { Cliente } from "../src/module/Cliente";
import { DataAgenda } from "../src/module/DataAgenda";
import { DiaSemana } from "../src/module/DiaSemana";
import { Horario } from "../src/module/Horario";
import { HorarioDisponivel } from "../src/module/HorarioDisponivel";
import { Profissional } from "../src/module/Profissional";
import { RelogioClinica } from "../src/module/RelogioClinica";
import { Tratamento } from "../src/module/Tratamento";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";

const ana = new Profissional("Ana", "(98) 98111-2222", "Estética", 1);
const cliente = new Cliente("Maria", "(98) 98877-6655", 1);
const umaHora = new Tratamento("Limpeza", "", 100, 60, 10); // 2 faixas
const meiaHora = new Tratamento("Massagem", "", 50, 30, 11); // 1 faixa

const SEGUNDA = DataAgenda.ler("2026-10-19");
const TERCA = DataAgenda.ler("2026-10-20");
/** "Agora" bem antes do período: tudo que está liberado aparece livre. */
const ANTES = RelogioClinica.momento(DataAgenda.ler("2026-10-01"), new Horario("08:00"));

const grade = [
  ...["09:00", "09:30", "10:00", "10:30"].map((h) => new HorarioDisponivel(1, DiaSemana.SEGUNDA, new Horario(h))),
  new HorarioDisponivel(1, DiaSemana.TERCA, new Horario("14:00")),
  new HorarioDisponivel(1, DiaSemana.SABADO, new Horario("08:00")),
];

const ag = (data: Date, horario: string, tratamentos = [umaHora]) =>
  new Agendamento(cliente, ana, tratamentos, data, new Horario(horario));

function agenda(
  dias: number,
  agendamentos: Agendamento[] = [],
  bloqueios: BloqueioAgenda[] = [],
  agora = ANTES,
  inicio = SEGUNDA
) {
  return new AgendaSemanal(ana, inicio, dias, grade, agendamentos, bloqueios, agora);
}

/** Blocos de um dia como "tipo horario/slots", para comparar fácil. */
const blocos = (a: AgendaSemanal, indice = 0) =>
  a.toJSON().dias[indice].toJSON().blocos.map((b) => `${b.tipo} ${b.horario}/${b.slots}`);

describe("AgendaSemanal — período", () => {
  test("[C1] período de 0, 32 ou não inteiro lança erro", () => {
    assert.throws(() => agenda(0), ErroDeValidacao);
    assert.throws(() => agenda(32), ErroDeValidacao);
    assert.throws(() => agenda(1.5), ErroDeValidacao);
  });

  test("[C2] 1 e 31 dias são aceitos (valores-limite)", () => {
    assert.equal(agenda(1).toJSON().dias.length, 1);
    assert.equal(agenda(31).toJSON().dias.length, 31);
  });
});

describe("AgendaSemanal — linhas (horários)", () => {
  test("[C3] só entram os horários da grade dos dias da semana do período", () => {
    assert.deepEqual(agenda(1).toJSON().horarios, ["09:00", "09:30", "10:00", "10:30"]); // só segunda
    assert.deepEqual(agenda(2).toJSON().horarios, ["09:00", "09:30", "10:00", "10:30", "14:00"]); // + terça
  });

  test("[C4] faixas de agendamento fora da grade também viram linhas, em ordem", () => {
    const a = agenda(1, [ag(SEGUNDA, "11:00")]); // ocupa 11:00 e 11:30
    assert.deepEqual(a.toJSON().horarios, ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
  });
});

describe("AgendaSemanal — blocos do dia", () => {
  test("[C5] agendamento ocupa todas as faixas da sua duração", () => {
    assert.deepEqual(blocos(agenda(1, [ag(SEGUNDA, "09:00")])), [
      "agendamento 09:00/2",
      "livre 10:00/1",
      "livre 10:30/1",
    ]);
  });

  test("[C6] linha que não está liberada naquele dia não vira bloco", () => {
    // 14:00 é linha (terça), mas na segunda não está liberado.
    assert.deepEqual(blocos(agenda(2), 0), ["livre 09:00/1", "livre 09:30/1", "livre 10:00/1", "livre 10:30/1"]);
    assert.deepEqual(blocos(agenda(2), 1), ["livre 14:00/1"]);
  });

  test("[C7] agendamento que começa no meio de outro não aparece na agenda", () => {
    const a = agenda(1, [ag(SEGUNDA, "09:00"), ag(SEGUNDA, "09:30", [meiaHora])]);
    // Caixa branca: 09:30 tem agendamento, mas indice <= ocupadoAte, então ele é pulado.
    assert.deepEqual(blocos(a), ["agendamento 09:00/2", "livre 10:00/1", "livre 10:30/1"]);
    assert.equal(a.toJSON().dias[0].toJSON().agendamentos, 1);
  });

  test("[C8] horário liberado no futuro fica livre", () => {
    assert.ok(blocos(agenda(1)).every((b) => b.startsWith("livre")));
  });

  test("[C9] horário que já começou fica passado (inclusive no instante exato)", () => {
    const agora = RelogioClinica.momento(SEGUNDA, new Horario("09:30"));
    assert.deepEqual(blocos(agenda(1, [], [], agora)), [
      "passado 09:00/1",
      "passado 09:30/1",
      "livre 10:00/1",
      "livre 10:30/1",
    ]);
  });

  test("[C10] dia com bloqueio fica fechado (mesmo já passado), mas o agendamento continua", () => {
    const folga = new BloqueioAgenda(1, SEGUNDA, SEGUNDA, "Folga");
    const depois = RelogioClinica.momento(TERCA, new Horario("12:00"));
    const a = agenda(2, [ag(SEGUNDA, "10:00")], [folga], depois);
    assert.deepEqual(blocos(a, 0), ["fechado 09:00/1", "fechado 09:30/1", "agendamento 10:00/2"]);
    assert.deepEqual(blocos(a, 1), ["livre 14:00/1"]); // terça não está no bloqueio
  });
});

describe("AgendaSemanal — toJSON", () => {
  test("[C11] dia traz contagens e o motivo do fechamento (vazio vira null)", () => {
    const comMotivo = agenda(1, [ag(SEGUNDA, "09:00")], [new BloqueioAgenda(null, SEGUNDA, SEGUNDA, "Feriado")]);
    const dia = comMotivo.toJSON().dias[0].toJSON();
    assert.equal(dia.data, "2026-10-19");
    assert.equal(dia.fechado, true);
    assert.equal(dia.motivoFechado, "Feriado");
    assert.equal(dia.agendamentos, 1);
    assert.equal(dia.livres, 0);

    const semMotivo = agenda(1, [], [new BloqueioAgenda(1, SEGUNDA, SEGUNDA, "")]).toJSON().dias[0].toJSON();
    assert.equal(semMotivo.fechado, true);
    assert.equal(semMotivo.motivoFechado, null);

    const aberto = agenda(1).toJSON().dias[0].toJSON();
    assert.equal(aberto.fechado, false);
    assert.equal(aberto.motivoFechado, null);
    assert.equal(aberto.livres, 4);
  });

  test("[C12] agenda traz profissional, início e linhas", () => {
    const json = agenda(7, [], [], ANTES, TERCA).toJSON();
    assert.equal(json.profissional, ana);
    assert.equal(json.inicio, "2026-10-20");
    assert.equal(json.dias.length, 7);
    assert.deepEqual(json.horarios, ["08:00", "09:00", "09:30", "10:00", "10:30", "14:00"]);
  });
});
