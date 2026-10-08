import { useState } from "react";
import type { FormEvent } from "react";
import { AgendamentoService } from "../../services/AgendamentoService";
import type { Agendamento } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { Dinheiro } from "../../models/Dinheiro";
import { Duracao } from "../../models/Duracao";
import { Telefone } from "../../models/Telefone";
import {
  IconeBrilho,
  IconeCalendario,
  IconePessoas,
  IconeRelogio,
  IconeSetaEsquerda,
} from "../Icones";

const agendamentoService = new AgendamentoService();

interface Props {
  onVoltar: () => void;
}

/** Agendamentos achados para um telefone: o cancelamento usa o mesmo telefone da busca. */
interface Busca {
  telefone: string;
  agendamentos: Agendamento[];
}

/**
 * "Cancelar agendamento" da página do cliente: a pessoa informa o telefone usado ao agendar,
 * vê os agendamentos que ainda não foram atendidos e cancela o que não vai poder comparecer.
 */
export function CancelarAgendamento({ onVoltar }: Props) {
  const [telefone, setTelefone] = useState("");
  const [busca, setBusca] = useState<Busca | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
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
    try {
      const agendamentos = await agendamentoService.listarDoCliente(telefone);
      setBusca({ telefone, agendamentos });
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
      await agendamentoService.cancelarDoCliente(agendamento.id, busca.telefone);
      setBusca({
        telefone: busca.telefone,
        agendamentos: busca.agendamentos.filter((item) => item.id !== agendamento.id),
      });
      setMensagem(
        `Agendamento de ${new DataAgenda(agendamento.data).formatar()} às ` +
          `${agendamento.horarioInicio} cancelado. O horário foi liberado.`
      );
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setCancelandoId(null);
      setConfirmandoId(null);
    }
  }

  return (
    <section className="passo">
      <header className="passo-cabecalho">
        <h2>Cancelar Agendamento</h2>
      </header>

      <div className="passo-corpo">
        <p className="passo-dica">
          Não vai poder comparecer? Informe o telefone usado no agendamento para encontrá-lo e
          cancelar. Assim o horário fica livre para outra pessoa.
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

        {busca !== null && busca.agendamentos.length === 0 && (
          <p className="passo-dica">
            Nenhum agendamento em aberto para o telefone {busca.telefone}. Confira se é o mesmo
            número informado ao agendar.
          </p>
        )}

        {busca !== null && busca.agendamentos.length > 0 && (
          <>
            <h3>
              {busca.agendamentos.length === 1
                ? "Encontramos 1 agendamento"
                : `Encontramos ${busca.agendamentos.length} agendamentos`}
            </h3>
            <div className="lista-agendamentos-cliente">
              {busca.agendamentos.map((agendamento) => (
                <article key={agendamento.id} className="agendamento-cliente">
                  <ul className="agendamento-cliente-detalhes">
                    <li>
                      <IconeCalendario tamanho={16} />
                      <strong>
                        {new DataAgenda(agendamento.data).formatar()} às {agendamento.horarioInicio}
                      </strong>
                    </li>
                    <li>
                      <IconePessoas tamanho={16} /> {agendamento.profissional.nome}
                    </li>
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

                  {confirmandoId === agendamento.id ? (
                    <div className="agendamento-cliente-confirmacao">
                      <p>
                        <strong>Tem certeza que deseja cancelar?</strong> O horário será liberado
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
                          setConfirmandoId(agendamento.id);
                        }}
                      >
                        Cancelar este agendamento
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
