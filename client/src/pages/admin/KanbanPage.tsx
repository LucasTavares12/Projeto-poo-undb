import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { AgendamentoService } from "../../services/AgendamentoService";
import type { Agendamento, StatusAgendamento } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";

const agendamentoService = new AgendamentoService();

// A ordem das colunas é também a ordem em que o atendimento avança.
const COLUNAS: { status: StatusAgendamento; titulo: string }[] = [
  { status: "AGENDADO", titulo: "Agendados" },
  { status: "EM_ATENDIMENTO", titulo: "Em atendimento" },
  { status: "FINALIZADO", titulo: "Finalizados" },
];

export function KanbanPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<StatusAgendamento | null>(null);
  const [confirmandoCancelamentoId, setConfirmandoCancelamentoId] = useState<number | null>(null);

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

  return (
    <section className="pagina pagina-larga">
      <div className="kanban-cabecalho">
        <h1>Agendamentos</h1>
        <button type="button" className="admin-botao" onClick={atualizarLista}>
          Atualizar
        </button>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <div className="kanban">
          {COLUNAS.map((coluna, indice) => {
            const cartoes = agendamentos.filter(
              (agendamento) => agendamento.status === coluna.status
            );
            const anterior = COLUNAS[indice - 1];
            const proxima = COLUNAS[indice + 1];

            return (
              <div
                key={coluna.status}
                className={`kanban-coluna ${colunaAlvo === coluna.status ? "alvo" : ""}`}
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
                    <p className="kanban-cartao-quando">
                      {new DataAgenda(agendamento.data).formatar()} às {agendamento.horarioInicio}
                    </p>
                    <strong>{agendamento.cliente.nome}</strong>
                    <p>{agendamento.cliente.telefone}</p>
                    <p>Profissional: {agendamento.profissional.nome}</p>
                    <p>
                      {agendamento.tratamentos.map((tratamento) => tratamento.nome).join(", ")}
                    </p>
                    <p>
                      {agendamento.duracaoTotalMinutos} min — R$ {agendamento.valorTotal.toFixed(2)}
                    </p>
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
      )}
    </section>
  );
}
