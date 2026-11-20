import { useState } from "react";
import type { FormEvent } from "react";
import { AgendamentoService } from "../../services/AgendamentoService";
import type { Agendamento } from "../../services/types";
import { Dinheiro } from "../../models/Dinheiro";
import { Duracao } from "../../models/Duracao";
import { Telefone } from "../../models/Telefone";
import { RemarcarAgendamento } from "./RemarcarAgendamento";
import {
  IconeBrilho,
  IconeCalendario,
  IconeCliente,
  IconePessoas,
  IconeRelogio,
  IconeSetaEsquerda,
} from "../Icones";
import { HorarioMarcado } from "../../models/HorarioMarcado";
import { Clinica } from "../../models/Clinica";
import { AgendamentosDoTelefone } from "../../models/AgendamentosDoTelefone";
import { PessoasDoAgendamento } from "../../models/PessoasDoAgendamento";

const agendamentoService = new AgendamentoService();

interface Props {
  onVoltar: () => void;
}

/**
 * "Meus agendamentos" da página do cliente: a pessoa informa o telefone usado ao agendar,
 * vê os agendamentos que ainda não foram atendidos e pode remarcar para outro horário livre
 * ou cancelar o que não vai poder comparecer. Quem marcou para outras pessoas com o próprio
 * telefone (a mãe para a filha) vê e gerencia os horários delas também, com o nome de cada uma.
 */
export function MeusAgendamentos({ onVoltar }: Props) {
  const [telefone, setTelefone] = useState("");
  const [busca, setBusca] = useState<AgendamentosDoTelefone | null>(null);
  // Telefone com horários de várias pessoas: mostrar só os de uma (null = de todas).
  const [pessoaEscolhida, setPessoaEscolhida] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [remarcandoId, setRemarcandoId] = useState<number | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const telefoneValido = new Telefone(telefone).ehValido();

  async function buscar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    if (!telefoneValido || buscando) {
      return;
    }

    setBuscando(true);
    setErro(null);
    setMensagem(null);
    setConfirmandoId(null);
    setRemarcandoId(null);
    try {
      const agendamentos = await agendamentoService.listarDoCliente(telefone);
      setBusca(new AgendamentosDoTelefone(telefone, agendamentos));
      setPessoaEscolhida(null);
    } catch (erroRequisicao) {
      setBusca(null);
      setErro((erroRequisicao as Error).message);
    } finally {
      setBuscando(false);
    }
  }

  async function cancelar(agendamento: Agendamento): Promise<void> {
    if (busca === null) {
      return;
    }

    setCancelandoId(agendamento.id);
    setErro(null);
    setMensagem(null);
    try {
      await agendamentoService.cancelarDoCliente(agendamento.id, busca.getTelefone());
      setBusca(busca.sem(agendamento));
      setMensagem(
        `Agendamento de ${HorarioMarcado.de(agendamento).formatar()}${new PessoasDoAgendamento(agendamento).paraQuem()} ` +
          "cancelado. O horário foi liberado."
      );
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setCancelandoId(null);
      setConfirmandoId(null);
    }
  }

  function aoRemarcar(anterior: Agendamento, atualizado: Agendamento): void {
    if (busca === null) {
      return;
    }
    setBusca(busca.comAtualizado(atualizado));
    setRemarcandoId(null);
    setMensagem(
      `Pronto! O agendamento de ${HorarioMarcado.de(anterior).formatar()}${new PessoasDoAgendamento(anterior).paraQuem()} ` +
        `foi remarcado para ${HorarioMarcado.de(atualizado).formatar()}.`
    );
  }

  // A pessoa escolhida pode ter saído da lista (cancelou o último horário dela).
  const pessoaDoFiltro =
    busca !== null && pessoaEscolhida !== null && busca.pessoas().includes(pessoaEscolhida)
      ? pessoaEscolhida
      : null;
  const visiveis = busca?.de(pessoaDoFiltro) ?? [];

  return (
    <section className="passo">
      <header className="passo-cabecalho">
        <h2>Meus Agendamentos</h2>
      </header>

      <div className="passo-corpo">
        <p className="passo-dica">
          Precisa mudar o dia ou não vai poder comparecer? Informe o telefone usado no agendamento
          para encontrá-lo. Você pode remarcar para outro horário livre ou cancelar até{" "}
          {Clinica.ANTECEDENCIA_MINIMA_HORAS} horas antes do horário marcado. Se agendou para
          outras pessoas com o seu telefone, os horários delas também aparecem aqui.
        </p>

        <form className="busca-agendamento" onSubmit={buscar}>
          <label className="campo-rotulo">
            <span>Telefone usado no agendamento</span>
            <input
              type="tel"
              className="campo"
              placeholder="(00) 00000-0000"
              autoComplete="tel"
              inputMode="tel"
              autoFocus
              value={telefone}
              onChange={(evento) => setTelefone(new Telefone(evento.target.value).formatar())}
            />
          </label>
          <button type="submit" className="botao-primario" disabled={!telefoneValido || buscando}>
            {buscando ? "Buscando..." : "Buscar agendamentos"}
          </button>
        </form>

        {erro && <p className="mensagem-erro">{erro}</p>}
        {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}

        {busca !== null && busca.quantidade() === 0 && (
          <p className="passo-dica">
            Nenhum agendamento em aberto para o telefone {busca.getTelefone()}. Confira se é o mesmo
            número informado ao agendar. Se outra pessoa agendou para você, use o telefone que
            ela informou.
          </p>
        )}

        {busca !== null && busca.quantidade() > 0 && (
          <>
            <h3>
              {visiveis.length === 1
                ? "Encontramos 1 agendamento"
                : `Encontramos ${visiveis.length} agendamentos`}
            </h3>
            {busca.temVariasPessoas() && (
              <div className="filtro-pessoas" role="group" aria-label="Mostrar os horários de">
                {[null, ...busca.pessoas()].map((pessoa) => (
                  <button
                    key={pessoa ?? "todas"}
                    type="button"
                    className={`filtro-pessoa ${pessoaDoFiltro === pessoa ? "selecionada" : ""}`}
                    aria-pressed={pessoaDoFiltro === pessoa}
                    onClick={() => setPessoaEscolhida(pessoa)}
                  >
                    {pessoa ?? "Todas as pessoas"}
                  </button>
                ))}
              </div>
            )}
            <div className="lista-agendamentos-cliente">
              {visiveis.map((agendamento) => (
                <article key={agendamento.id} className="agendamento-cliente">
                  <ul className="agendamento-cliente-detalhes">
                    <li>
                      <IconeCalendario tamanho={16} />
                      <strong>
                        {HorarioMarcado.de(agendamento).formatar()}
                      </strong>
                    </li>
                    <li>
                      <IconePessoas tamanho={16} /> {agendamento.profissional.nome}
                    </li>
                    {(busca.temVariasPessoas() ||
                      new PessoasDoAgendamento(agendamento).foiMarcadoPorOutraPessoa()) && (
                      <li>
                        <IconeCliente tamanho={16} /> Para{" "}
                        <strong>{agendamento.cliente.nome}</strong>
                      </li>
                    )}
                    <li>
                      <IconeBrilho tamanho={16} />
                      {agendamento.tratamentos.map((tratamento) => tratamento.nome).join(", ")}
                    </li>
                    <li>
                      <IconeRelogio tamanho={16} />
                      {new Duracao(agendamento.duracaoTotalMinutos).formatar()} ·{" "}
                      {new Dinheiro(agendamento.valorTotal).formatar()}
                    </li>
                  </ul>

                  {agendamento.podeAlterarPeloSite === false ? (
                    <p className="agendamento-cliente-aviso">
                      Faltam menos de {Clinica.ANTECEDENCIA_MINIMA_HORAS} horas para o seu horário.
                      Para remarcar ou cancelar agora, fale direto com a clínica.
                    </p>
                  ) : remarcandoId === agendamento.id ? (
                    <RemarcarAgendamento
                      agendamento={agendamento}
                      telefone={busca.getTelefone()}
                      onRemarcado={(atualizado) => aoRemarcar(agendamento, atualizado)}
                      onDesistir={() => setRemarcandoId(null)}
                    />
                  ) : confirmandoId === agendamento.id ? (
                    <div className="agendamento-cliente-confirmacao">
                      <p>
                        <strong>
                          Tem certeza que deseja cancelar{" "}
                          {new PessoasDoAgendamento(agendamento).horarioDe()}?
                        </strong>{" "}
                        O horário será liberado
                        para outras pessoas e não dá para desfazer: se mudar de ideia, será
                        preciso agendar de novo.
                      </p>
                      <div className="agendamento-cliente-acoes">
                        <button
                          type="button"
                          className="botao-contorno"
                          disabled={cancelandoId !== null}
                          onClick={() => setConfirmandoId(null)}
                        >
                          Não, manter
                        </button>
                        <button
                          type="button"
                          className="botao-perigo"
                          disabled={cancelandoId !== null}
                          onClick={() => cancelar(agendamento)}
                        >
                          {cancelandoId === agendamento.id ? "Cancelando..." : "Sim, cancelar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="agendamento-cliente-acoes">
                      <button
                        type="button"
                        className="botao-perigo contorno"
                        disabled={cancelandoId !== null}
                        onClick={() => {
                          setMensagem(null);
                          setRemarcandoId(null);
                          setConfirmandoId(agendamento.id);
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="botao-primario"
                        disabled={cancelandoId !== null}
                        onClick={() => {
                          setMensagem(null);
                          setErro(null);
                          setConfirmandoId(null);
                          setRemarcandoId(agendamento.id);
                        }}
                      >
                        <IconeCalendario tamanho={16} /> Remarcar
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="passo-rodape">
        <button type="button" className="botao-contorno" onClick={onVoltar}>
          <IconeSetaEsquerda /> Voltar ao início
        </button>
        <span />
      </footer>
    </section>
  );
}
