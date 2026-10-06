import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { AgendamentoService } from "../../services/AgendamentoService";
import type { Agendamento, StatusAgendamento } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { Duracao } from "../../models/Duracao";
import { Dinheiro } from "../../models/Dinheiro";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { ModalAgendamentoManual } from "../../components/admin/ModalAgendamentoManual";
import {
  IconeAtualizar,
  IconeBrilho,
  IconeCalendario,
  IconeDinheiro,
  IconeMais,
  IconePessoas,
  IconeRelogio,
  IconeTelefone,
} from "../../components/Icones";

const agendamentoService = new AgendamentoService();

// A ordem das colunas é também a ordem em que o atendimento avança.
// Agendados e em atendimento: o mais próximo de acontecer fica no topo.
// Finalizados: o mais recente fica no topo (os antigos vão descendo).
const COLUNAS: { status: StatusAgendamento; titulo: string; maisRecentePrimeiro: boolean }[] = [
  { status: "AGENDADO", titulo: "Agendados", maisRecentePrimeiro: false },
  { status: "EM_ATENDIMENTO", titulo: "Em atendimento", maisRecentePrimeiro: false },
  { status: "FINALIZADO", titulo: "Finalizados", maisRecentePrimeiro: true },
];

export function KanbanPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<StatusAgendamento | null>(null);
  const [confirmandoCancelamentoId, setConfirmandoCancelamentoId] = useState<number | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  /** O card novo entra direto na coluna "Agendados", já na posição do seu horário. */
  function aoCriarManual(criado: Agendamento): void {
    setAgendamentos((lista) => [...lista, criado]);
    setModalAberto(false);
    setMensagem(
      `Agendamento de ${criado.cliente.nome} criado para ` +
        `${new DataAgenda(criado.data).formatar()} às ${criado.horarioInicio}.`
    );
  }

  useEffect(() => {
    async function carregar() {
      try {
        setAgendamentos(await agendamentoService.listar());
      } catch {
        setErro("Não foi possível carregar os agendamentos.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function atualizarLista(): Promise<void> {
    setErro(null);
    try {
      setAgendamentos(await agendamentoService.listar());
    } catch {
      setErro("Não foi possível carregar os agendamentos.");
    }
  }

  async function mover(id: number, novoStatus: StatusAgendamento): Promise<void> {
    const atual = agendamentos.find((agendamento) => agendamento.id === id);
    if (!atual || atual.status === novoStatus) {
      return;
    }

    // Move o card na hora e desfaz se o servidor recusar.
    const statusAnterior = atual.status;
    const aplicarStatus = (status: StatusAgendamento) =>
      setAgendamentos((lista) =>
        lista.map((agendamento) => (agendamento.id === id ? { ...agendamento, status } : agendamento))
      );

    aplicarStatus(novoStatus);
    setErro(null);
    try {
      await agendamentoService.atualizarStatus(id, novoStatus);
    } catch (erroRequisicao) {
      aplicarStatus(statusAnterior);
      setErro((erroRequisicao as Error).message);
    }
  }

  async function cancelar(id: number): Promise<void> {
    setConfirmandoCancelamentoId(null);
    setErro(null);
    try {
      await agendamentoService.cancelar(id);
      setAgendamentos((lista) => lista.filter((agendamento) => agendamento.id !== id));
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    }
  }

  function iniciarArraste(evento: DragEvent, id: number): void {
    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", String(id));
    setArrastandoId(id);
  }

  function encerrarArraste(): void {
    setArrastandoId(null);
    setColunaAlvo(null);
  }

  function permitirSoltar(evento: DragEvent, status: StatusAgendamento): void {
    if (arrastandoId === null) {
      return;
    }
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "move";
    setColunaAlvo(status);
  }

  function soltar(evento: DragEvent, status: StatusAgendamento): void {
    evento.preventDefault();
    const id = arrastandoId;
    encerrarArraste();
    if (id !== null) {
      mover(id, status);
    }
  }

  const hoje = DataAgenda.hoje().toString();
  const resumo = [
    {
      rotulo: "Hoje",
      valor: String(agendamentos.filter((agendamento) => agendamento.data === hoje).length),
      detalhe: "agendamentos para hoje",
      icone: <IconeCalendario />,
    },
    {
      rotulo: "Na fila",
      valor: String(agendamentos.filter((agendamento) => agendamento.status === "AGENDADO").length),
      detalhe: "aguardando atendimento",
      icone: <IconeRelogio />,
    },
    {
      rotulo: "Em atendimento",
      valor: String(
        agendamentos.filter((agendamento) => agendamento.status === "EM_ATENDIMENTO").length
      ),
      detalhe: "acontecendo agora",
      icone: <IconeBrilho />,
    },
    {
      rotulo: "Faturado",
      valor: new Dinheiro(
        agendamentos
          .filter((agendamento) => agendamento.status === "FINALIZADO")
          .reduce((total, agendamento) => total + agendamento.valorTotal, 0)
      ).formatar(),
      detalhe: "em atendimentos finalizados",
      icone: <IconeDinheiro />,
    },
  ];

  return (
    <section className="pagina pagina-larga">
      <CabecalhoPagina
        titulo="Agendamentos"
        descricao="Acompanhe os atendimentos e arraste os cards para mudar de etapa."
        acoes={
          <>
            <button type="button" className="admin-botao" onClick={atualizarLista}>
              <IconeAtualizar tamanho={16} /> Atualizar
            </button>
            <button
              type="button"
              className="admin-botao principal"
              onClick={() => {
                setMensagem(null);
                setModalAberto(true);
              }}
            >
              <IconeMais tamanho={16} /> Novo agendamento
            </button>
          </>
        }
      />

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso kanban-mensagem">{mensagem}</p>}

      {modalAberto && (
        <ModalAgendamentoManual onFechar={() => setModalAberto(false)} onCriado={aoCriarManual} />
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div className="admin-resumo">
            {resumo.map((item) => (
              <div key={item.rotulo} className="admin-resumo-cartao">
                <span className="admin-resumo-icone">{item.icone}</span>
                <span className="admin-resumo-rotulo">{item.rotulo}</span>
                <strong className="admin-resumo-valor">{item.valor}</strong>
                <span className="admin-resumo-detalhe">{item.detalhe}</span>
              </div>
            ))}
          </div>

          <div className="kanban">
            {COLUNAS.map((coluna, indice) => {
              // "AAAA-MM-DD HH:MM" ordena certo como texto: data primeiro, depois o horário.
              const momento = (agendamento: Agendamento) =>
                `${agendamento.data.slice(0, 10)} ${agendamento.horarioInicio}`;
              const cartoes = agendamentos
                .filter((agendamento) => agendamento.status === coluna.status)
                .sort((a, b) =>
                  coluna.maisRecentePrimeiro
                    ? momento(b).localeCompare(momento(a))
                    : momento(a).localeCompare(momento(b))
                );
              const anterior = COLUNAS[indice - 1];
              const proxima = COLUNAS[indice + 1];

              return (
                <div
                  key={coluna.status}
                  className={`kanban-coluna ${colunaAlvo === coluna.status ? "alvo" : ""}`}
                  data-status={coluna.status}
                  onDragOver={(evento) => permitirSoltar(evento, coluna.status)}
                  onDrop={(evento) => soltar(evento, coluna.status)}
                >
                  <header className="kanban-coluna-cabecalho">
                    <h2>{coluna.titulo}</h2>
                    <span className="kanban-contador">{cartoes.length}</span>
                  </header>

                  {cartoes.length === 0 && <p className="kanban-vazio">Nenhum agendamento.</p>}

                  {cartoes.map((agendamento) => (
                    <article
                      key={agendamento.id}
                      className={`kanban-cartao ${arrastandoId === agendamento.id ? "arrastando" : ""}`}
                      draggable
                      onDragStart={(evento) => iniciarArraste(evento, agendamento.id)}
                      onDragEnd={encerrarArraste}
                    >
                      <div className="kanban-cartao-topo">
                        <span className="kanban-cartao-quando">
                          <IconeCalendario tamanho={13} />
                          {new DataAgenda(agendamento.data).formatar()} · {agendamento.horarioInicio}
                        </span>
                        <span className="kanban-cartao-valor">
                          {new Dinheiro(agendamento.valorTotal).formatar()}
                        </span>
                      </div>

                      <div className="kanban-cartao-cliente">
                        <span className="admin-avatar pequeno">
                          {agendamento.cliente.nome.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <strong>{agendamento.cliente.nome}</strong>
                          <span className="kanban-cartao-telefone">
                            <IconeTelefone tamanho={12} /> {agendamento.cliente.telefone}
                          </span>
                        </span>
                      </div>

                      <ul className="kanban-cartao-detalhes">
                        <li>
                          <IconePessoas tamanho={14} /> {agendamento.profissional.nome}
                        </li>
                        <li>
                          <IconeBrilho tamanho={14} />
                          {agendamento.tratamentos.map((tratamento) => tratamento.nome).join(", ")}
                        </li>
                        <li>
                          <IconeRelogio tamanho={14} />
                          {new Duracao(agendamento.duracaoTotalMinutos).formatar()}
                        </li>
                      </ul>
                      {confirmandoCancelamentoId === agendamento.id ? (
                        <div className="kanban-cartao-confirmacao">
                          <p>Cancelar este agendamento? O horário volta a ficar livre.</p>
                          <div className="kanban-cartao-acoes">
                            <button
                              type="button"
                              className="admin-botao"
                              onClick={() => setConfirmandoCancelamentoId(null)}
                            >
                              Voltar
                            </button>
                            <button
                              type="button"
                              className="admin-botao perigo"
                              onClick={() => cancelar(agendamento.id)}
                            >
                              Confirmar cancelamento
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="kanban-cartao-acoes">
                          {agendamento.status === "AGENDADO" && (
                            <button
                              type="button"
                              className="admin-botao perigo"
                              onClick={() => setConfirmandoCancelamentoId(agendamento.id)}
                            >
                              Cancelar
                            </button>
                          )}
                          {anterior && (
                            <button
                              type="button"
                              className="admin-botao"
                              onClick={() => mover(agendamento.id, anterior.status)}
                            >
                              ← {anterior.titulo}
                            </button>
                          )}
                          {proxima && (
                            <button
                              type="button"
                              className="admin-botao principal"
                              onClick={() => mover(agendamento.id, proxima.status)}
                            >
                              {proxima.titulo} →
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
