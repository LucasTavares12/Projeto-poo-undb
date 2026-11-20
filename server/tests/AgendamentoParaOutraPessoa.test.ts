/**
 * Teste de caixa branca — agendamento feito para outra pessoa com o mesmo telefone
 * (ex.: a mãe marca para ela e para a filha usando o próprio número).
 *
 *  Pessoa.normalizarNome / temNome:
 *    [P1] ignora acentos, maiúsculas e espaços a mais | [P2] nomes diferentes não batem
 *    [P3] nome vazio nunca bate
 *  Agendamento.definirResponsavel:
 *    [R1] vazio/ausente = a própria pessoa marcou | [R2] mesmo nome do atendido = a própria pessoa
 *    [R3] outro nome fica guardado (sem espaços a mais) | [R4] nome longo demais lança
 *    [R5] toJSON leva o responsável
 *  HistoricoCliente:
 *    [H1] mesmo telefone + nomes diferentes = fichas separadas
 *    [H2] mesmo telefone + mesmo nome (com variação de acento/maiúscula) = uma ficha
 *    [H3] responsáveis sem repetir | [H4] busca pelo nome de quem marcou acha a pessoa
 *    [H5] ehDe reconhece a pessoa da ficha
 *  Responsavel (subclasse de Pessoa):
 *    [S1] usa o telefone do cliente | [S2] polimorfismo: apresentar() próprio
 *  Agendamento.getContato / pertenceAoTelefone (remarcar e cancelar pelo site):
 *    [T1] marcado pela própria pessoa: o contato é o cliente
 *    [T2] marcado por outra pessoa: o contato é o responsável (mesmo telefone)
 *    [T3] pertence ao telefone do agendamento, com ou sem máscara | [T4] outro telefone não
 *  Cliente.ehAMesmaPessoaQue:
 *    [I1] mesmo telefone e nome (variação de acento) | [I2] mesmo telefone, outro nome
 *  ClientesDoTelefone:
 *    [D1] acha a pessoa pelo nome | [D2] sem nome = a atendida mais recentemente
 *    [D3] nome que não existe lança | [D4] outras pessoas em ordem alfabética
 *  Notificacao (pelo site, marcado por outra pessoa):
 *    [N1] cancelado cita quem cancelou e de quem era | [N2] remarcado idem
 *    [N3] pela equipe continua citando só a pessoa atendida
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Agendamento } from "../src/module/Agendamento";
import { Cliente } from "../src/module/Cliente";
import { Pessoa } from "../src/module/Pessoa";
import { Profissional } from "../src/module/Profissional";
import { Tratamento } from "../src/module/Tratamento";
import { Horario } from "../src/module/Horario";
import { DataAgenda } from "../src/module/DataAgenda";
import { HistoricoCliente } from "../src/module/HistoricoCliente";
import { ErroDeValidacao } from "../src/erros/ErroDeValidacao";
import { ErroNaoEncontrado } from "../src/erros/ErroNaoEncontrado";
import { Responsavel } from "../src/module/Responsavel";
import { ClientesDoTelefone } from "../src/module/ClientesDoTelefone";
import { Notificacao } from "../src/module/Notificacao";
import { OrigemDaAcao } from "../src/module/OrigemDaAcao";

const TELEFONE = "(98) 98877-6655";
const profissional = new Profissional("Bia", "(98) 98111-2222", "Estética", 2);
const limpeza = new Tratamento("Limpeza", "", 120, 60, 10);

function agendar(nomeCliente: string, dia: string, responsavel: string | null = null) {
  const agendamento = new Agendamento(
    new Cliente(nomeCliente, TELEFONE),
    profissional,
    [limpeza],
    DataAgenda.ler(dia),
    new Horario("09:00")
  );
  agendamento.definirResponsavel(responsavel);
  return agendamento;
}

describe("Pessoa.normalizarNome / temNome", () => {
  test("[P1] ignora acentos, maiúsculas e espaços a mais", () => {
    assert.equal(Pessoa.normalizarNome("  Mônica   SILVA "), "monica silva");
    assert.ok(new Cliente("Mônica Silva", TELEFONE).temNome("monica  silva"));
  });

  test("[P2] nomes diferentes não batem", () => {
    assert.equal(new Cliente("Maria", TELEFONE).temNome("Ana"), false);
  });

  test("[P3] nome vazio nunca bate", () => {
    assert.equal(new Cliente("Maria", TELEFONE).temNome("   "), false);
  });
});

describe("Agendamento.definirResponsavel", () => {
  test("[R1] vazio ou ausente = a própria pessoa marcou", () => {
    assert.equal(agendar("Ana", "2026-10-22", "  ").getResponsavelNome(), null);
    assert.equal(agendar("Ana", "2026-10-22", null).foiMarcadoPorOutraPessoa(), false);
  });

  test("[R2] mesmo nome de quem vai ser atendido = a própria pessoa marcou", () => {
    assert.equal(agendar("Ana Clara", "2026-10-22", "ana  clara").getResponsavelNome(), null);
  });

  test("[R3] outro nome fica guardado, sem espaços a mais", () => {
    const agendamento = agendar("Ana", "2026-10-22", "  Maria   Souza ");
    assert.equal(agendamento.getResponsavelNome(), "Maria Souza");
    assert.equal(agendamento.foiMarcadoPorOutraPessoa(), true);
  });

  test("[R4] nome longo demais lança", () => {
    assert.throws(
      () => agendar("Ana", "2026-10-22", "x".repeat(Pessoa.TAMANHO_MAXIMO_NOME + 1)),
      ErroDeValidacao
    );
  });

  test("[R5] toJSON leva o responsável", () => {
    assert.equal(agendar("Ana", "2026-10-22", "Maria").toJSON().responsavelNome, "Maria");
    assert.equal(agendar("Ana", "2026-10-22").toJSON().responsavelNome, null);
  });
});

describe("HistoricoCliente com várias pessoas no mesmo telefone", () => {
  const agendamentos = [
    agendar("Maria", "2026-10-20"),
    agendar("Ana", "2026-10-21", "MARIA"),
    agendar("ANA", "2026-10-22", "Maria"),
    agendar("Maria", "2026-10-23"),
  ];
  const fichas = HistoricoCliente.agrupar(agendamentos);
  const ana = fichas.find((ficha) => ficha.ehDe("Ana"))!;
  const maria = fichas.find((ficha) => ficha.ehDe("Maria"))!;

  test("[H1] mesmo telefone com nomes diferentes = fichas separadas", () => {
    assert.equal(fichas.length, 2);
    assert.equal(ana.getTelefone(), maria.getTelefone());
  });

  test("[H2] mesmo nome com variação de maiúscula = a mesma ficha", () => {
    assert.equal(ana.paraFicha("2026-10-01").agendamentos.length, 2);
    assert.equal(maria.paraFicha("2026-10-01").agendamentos.length, 2);
  });

  test("[H3] quem marcou aparece uma vez só, como foi escrito por último", () => {
    assert.deepEqual(ana.getResponsaveis(), ["Maria"]);
    assert.deepEqual(maria.getResponsaveis(), []);
  });

  test("[H4] buscar pelo nome de quem marcou também acha a pessoa atendida", () => {
    assert.ok(ana.combinaCom("mari"));
    assert.equal(maria.combinaCom("ana"), false);
  });

  test("[H5] ehDe reconhece a pessoa da ficha", () => {
    assert.ok(ana.ehDe("  ana "));
    assert.equal(ana.ehDe("Maria"), false);
  });
});

describe("Responsavel", () => {
  const ana = new Cliente("Ana", TELEFONE);

  test("[S1] usa o telefone de quem vai ser atendido (é o mesmo número)", () => {
    const responsavel = Responsavel.para("Maria", ana)!;
    assert.equal(responsavel.getTelefone(), TELEFONE);
  });

  test("[S2] apresentar() é o da subclasse", () => {
    const pessoa: Pessoa = Responsavel.para("Maria", ana)!;
    assert.match(pessoa.apresentar(), /^Responsável: Maria/);
  });
});

describe("Agendamento.getContato / pertenceAoTelefone", () => {
  test("[T1] marcado pela própria pessoa: o contato é ela", () => {
    const agendamento = agendar("Maria", "2026-10-22");
    assert.equal(agendamento.getContato(), agendamento.getCliente());
  });

  test("[T2] marcado por outra pessoa: o contato é quem marcou", () => {
    const agendamento = agendar("Ana", "2026-10-22", "Maria");
    assert.ok(agendamento.getContato() instanceof Responsavel);
    assert.equal(agendamento.getContato().getNome(), "Maria");
  });

  test("[T3] pertence ao telefone do agendamento, com ou sem máscara", () => {
    const agendamento = agendar("Ana", "2026-10-22", "Maria");
    assert.ok(agendamento.pertenceAoTelefone("98988776655"));
    assert.ok(agendamento.pertenceAoTelefone(TELEFONE));
  });

  test("[T4] outro telefone não", () => {
    assert.equal(agendar("Ana", "2026-10-22").pertenceAoTelefone("98911112222"), false);
  });
});

describe("Cliente.ehAMesmaPessoaQue", () => {
  test("[I1] mesmo telefone e mesmo nome (variação de acento e maiúscula)", () => {
    assert.ok(new Cliente("Mônica", TELEFONE).ehAMesmaPessoaQue(new Cliente("MONICA", "98988776655")));
  });

  test("[I2] mesmo telefone com outro nome é outra pessoa", () => {
    assert.equal(new Cliente("Maria", TELEFONE).ehAMesmaPessoaQue(new Cliente("Ana", TELEFONE)), false);
  });
});

describe("ClientesDoTelefone", () => {
  // Do mais recente para o mais antigo, como vem do banco.
  const doTelefone = new ClientesDoTelefone([
    agendar("Bruna", "2026-10-25", "Maria"),
    agendar("Ana", "2026-10-24", "Maria"),
    agendar("Maria", "2026-10-23"),
  ]);

  test("[D1] acha a pessoa pelo nome", () => {
    assert.equal(doTelefone.pessoa("ana").getNome(), "Ana");
  });

  test("[D2] sem nome, a atendida mais recentemente", () => {
    assert.equal(doTelefone.pessoa("").getNome(), "Bruna");
  });

  test("[D3] nome que não existe no telefone lança", () => {
    assert.throws(() => doTelefone.pessoa("Carla"), ErroNaoEncontrado);
  });

  test("[D4] outras pessoas do telefone em ordem alfabética", () => {
    assert.deepEqual(doTelefone.outrasPessoasAlemDe(doTelefone.pessoa("Maria")), ["Ana", "Bruna"]);
  });
});

describe("Notificacao de agendamento marcado por outra pessoa", () => {
  const comId = () => {
    const agendamento = agendar("Ana", "2026-10-22", "Maria");
    return new Agendamento(
      agendamento.getCliente(),
      new Profissional("Bia", "(98) 98111-2222", "Estética", 2),
      [limpeza],
      agendamento.getData(),
      agendamento.getHorarioInicio(),
      undefined,
      7,
      false,
      null,
      null,
      null,
      agendamento.getResponsavel()
    );
  };

  test("[N1] cancelado pelo site cita quem cancelou e de quem era o horário", () => {
    const aviso = Notificacao.cancelado(comId(), OrigemDaAcao.CLIENTE, null);
    assert.match(aviso.getMensagem(), /^Maria cancelou o horário de Ana: /);
  });

  test("[N2] remarcado pelo site também", () => {
    const aviso = Notificacao.remarcado(
      comId(),
      DataAgenda.ler("2026-10-21"),
      new Horario("10:00"),
      OrigemDaAcao.CLIENTE,
      null
    );
    assert.match(aviso.getMensagem(), /^Maria remarcou o horário de Ana: de /);
  });

  test("[N3] pela equipe cita só a pessoa atendida", () => {
    const aviso = Notificacao.cancelado(comId(), OrigemDaAcao.EQUIPE, 1);
    assert.match(aviso.getMensagem(), /^Cancelado o agendamento de Ana: /);
  });
});
