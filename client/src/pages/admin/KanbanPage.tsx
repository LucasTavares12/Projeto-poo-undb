import { useCallback, useEffect, useState } from "react";
import type { DragEvent } from "react";
import { AgendamentoService } from "../../services/AgendamentoService";
import { RelatorioService } from "../../services/RelatorioService";
import type { Agendamento, StatusAgendamento } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { Duracao } from "../../models/Duracao";
import { Dinheiro } from "../../models/Dinheiro";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { ModalAgendamentoManual } from "../../components/admin/ModalAgendamentoManual";
import { ModalRemarcarAgendamento } from "../../components/admin/ModalRemarcarAgendamento";
import { useUsuarioLogado } from "../../hooks/useUsuarioLogado";
import {
  IconeAtualizar,
  IconeBrilho,
  IconeCalendario,
  IconeConfirmado,
  IconeDinheiro,
  IconeMais,
  IconePessoas,
  IconeRelogio,
  IconeTelefone,
} from "../../components/Icones";
import { HorarioMarcado } from "../../models/HorarioMarcado";
import { PerfilDeAcesso } from "../../models/PerfilDeAcesso";

const agendamentoService = new AgendamentoService();
const relatorioService = new RelatorioService();

// A ordem das colunas é também a ordem em que o atendimento avança.
// Agendados e em atendimento: o mais próximo de acontecer fica no topo.
// Finalizados: o mais recente fica no topo (os antigos vão descendo).
const COLUNAS: { status: StatusAgendamento; titulo: string; maisRecentePrimeiro: boolean }[] = [
  { status: "AGENDADO", titulo: "Agendados", maisRecentePrimeiro: false },
  { status: "EM_ATENDIMENTO", titulo: "Em atendimento", maisRecentePrimeiro: false },
  { status: "FINALIZADO", titulo: "Finalizados", maisRecentePrimeiro: true },
];

export function KanbanPage() {
  const usuario = useUsuarioLogado();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  // Finalizados que foram limpos da tela (continuam guardados e podem voltar).
  const [quantidadeOcultos, setQuantidadeOcultos] = useState(0);
  const [faturadoHoje, setFaturadoHoje] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<StatusAgendamento | null>(null);
  const [confirmandoCancelamentoId, setConfirmandoCancelamentoId] = useState<number | null>(null);

  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);

  // No celular aparece uma coluna por vez, escolhida pelas abas acima do quadro.
  const [colunaVisivel, setColunaVisivel] = useState<StatusAgendamento>("AGENDADO");

  // Botão "Atualizar": girando enquanto busca, depois um "Atualizado" rápido de confirmação.
  const [atualizacao, setAtualizacao] = useState<"parado" | "atualizando" | "atualizado">("parado");

  const [modalAberto, setModalAberto] = useState(false);
  // Agendamento aberto na janela "Remarcar" (null = janela fechada).
  const [remarcando, setRemarcando] = useState<Agendamento | null>(null);
  const fecharRemarcacao = useCallback(() => setRemarcando(null), []);
  const [mensagem, setMensagem] = useState<string | null>(null);

  /** O card novo entra direto na coluna "Agendados", já na posição do seu horário. */
  function aoCriarManual(criado: Agendamento): void {
    setAgendamentos((lista) => [...lista, criado]);
    setModalAberto(false);
    setMensagem(
      `Agendamento de ${criado.cliente.nome} criado para ` +
        `${HorarioMarcado.de(criado).formatar()}.`
    );
  }

  /** O card fica na mesma coluna, já no lugar do novo dia/horário. */
  function aoRemarcar(anterior: Agendamento, atualizado: Agendamento): void {
    setAgendamentos((lista) =>
      lista.map((agendamento) => (agendamento.id === atualizado.id ? atualizado : agendamento))
    );
    setRemarcando(null);
    setMensagem(
      `Agendamento de ${atualizado.cliente.nome} remarcado: ` +
        `${HorarioMarcado.de(anterior).formatar()} → ${HorarioMarcado.de(atualizado).formatar()}.`
    );
  }

  useEffect(() => {
    async function carregar() {
      try {
        const [lista, ocultos, faturado] = await Promise.all([
          agendamentoService.listar(),
          agendamentoService.contarArquivados(),
          relatorioService.faturadoNoDia(DataAgenda.hoje()),
        ]);
        setAgendamentos(lista);
        setQuantidadeOcultos(ocultos);
        setFaturadoHoje(faturado);
      } catch {
        setErro("Não foi possível carregar os agendamentos.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  /** Devolve se deu certo (o erro já fica na tela). */
  async function atualizarLista(): Promise<boolean> {
    setErro(null);
    try {
      const [lista, ocultos, faturado] = await Promise.all([
        agendamentoService.listar(),
        agendamentoService.contarArquivados(),
        relatorioService.faturadoNoDia(DataAgenda.hoje()),
      ]);
      setAgendamentos(lista);
      setQuantidadeOcultos(ocultos);
      setFaturadoHoje(faturado);
      return true;
    } catch {
      setErro("Não foi possível carregar os agendamentos.");
      return false;
    }
  }

  async function atualizarPeloBotao(): Promise<void> {
    if (atualizacao === "atualizando") {
      return;
    }
    setAtualizacao("atualizando");
    // Tempo mínimo da animação: com o servidor rápido, o giro nem chegaria a aparecer.
    const [deuCerto] = await Promise.all([
      atualizarLista(),
      new Promise((resolver) => setTimeout(resolver, 700)),
    ]);
    if (!deuCerto) {
      setAtualizacao("parado");
      return;
    }
    setAtualizacao("atualizado");
    setTimeout(() => setAtualizacao((atual) => (atual === "atualizado" ? "parado" : atual)), 1500);
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
      // Entrar ou sair de "Finalizados" muda o faturado do dia.
      if (statusAnterior === "FINALIZADO" || novoStatus === "FINALIZADO") {
        // Falha aqui não desfaz o movimento: o card já mudou de etapa no servidor.
        relatorioService
          .faturadoNoDia(DataAgenda.hoje())
          .then(setFaturadoHoje)
          .catch(() => undefined);
      }
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

  /** Tira os finalizados da tela. Nada é apagado: os relatórios continuam contando com eles. */
  async function limparFinalizados(): Promise<void> {
    setLimpando(true);
    setErro(null);
    try {
      const quantidade = await agendamentoService.arquivarFinalizados();
      // Recarrega em vez de filtrar a lista local: o servidor é quem sabe o que saiu do quadro.
      await atualizarLista();
      setMensagem(
        quantidade === 1
          ? "1 agendamento finalizado foi retirado do quadro. Ele continua nos relatórios."
          : `${quantidade} agendamentos finalizados foram retirados do quadro. ` +
              "Eles continuam nos relatórios."
      );
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setLimpando(false);
      setConfirmandoLimpeza(false);
    }
  }

  /** Traz de volta para a coluna "Finalizados" tudo o que tinha sido limpo da tela. */
  async function mostrarOcultos(): Promise<void> {
    setRestaurando(true);
    setErro(null);
    setConfirmandoLimpeza(false);
    try {
      const quantidade = await agendamentoService.restaurarArquivados();
      await atualizarLista();
      setMensagem(
        quantidade === 1
          ? "1 agendamento finalizado voltou para o quadro."
          : `${quantidade} agendamentos finalizados voltaram para o quadro.`
      );
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setRestaurando(false);
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
      rotulo: "Faturado hoje",
      valor: new Dinheiro(faturadoHoje).formatar(),
      detalhe: "em atendimentos finalizados hoje",
      icone: <IconeDinheiro />,
    },
  ];

  return (
    <section className="pagina pagina-larga">
      <CabecalhoPagina
        titulo="Agendamentos"
        descricao={
          new PerfilDeAcesso(usuario).temAcessoTotal()
            ? "Acompanhe os atendimentos e arraste os cards para mudar de etapa."
            : "Seus atendimentos. Arraste os cards para mudar de etapa."
        }
        acoes={
          <>
            <button
              type="button"
              className={`admin-botao botao-atualizar ${atualizacao}`}
              onClick={atualizarPeloBotao}
              disabled={atualizacao === "atualizando"}
              aria-busy={atualizacao === "atualizando"}
            >
              {atualizacao === "atualizado" ? (
                <>
                  <IconeConfirmado tamanho={16} /> Atualizado
                </>
              ) : (
                <>
                  <IconeAtualizar tamanho={16} />
                  {atualizacao === "atualizando" ? "Atualizando..." : "Atualizar"}
                </>
              )}
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
        <ModalAgendamentoManual
          profissionalFixo={usuario.profissionalId}
          onFechar={() => setModalAberto(false)}
          onCriado={aoCriarManual}
        />
      )}

      {remarcando && (
        <ModalRemarcarAgendamento
          agendamento={remarcando}
          onFechar={fecharRemarcacao}
          onRemarcado={(atualizado) => aoRemarcar(remarcando, atualizado)}
        />
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div
            className={`kanban-area ${atualizacao === "atualizando" ? "recarregando" : ""}`}
            aria-busy={atualizacao === "atualizando"}
          >
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

          <div className="kanban-abas" role="tablist" aria-label="Etapas do atendimento">
            {COLUNAS.map((coluna) => (
              <button
                key={coluna.status}
                type="button"
                role="tab"
                className="kanban-aba"
                data-status={coluna.status}
                aria-selected={colunaVisivel === coluna.status}
                onClick={() => setColunaVisivel(coluna.status)}
              >
                {coluna.titulo}
                <span className="kanban-contador">
                  {agendamentos.filter((agendamento) => agendamento.status === coluna.status).length}
                </span>
              </button>
            ))}
          </div>

          <div className="kanban">
            {COLUNAS.map((coluna, indice) => {
              const cartoes = agendamentos
                .filter((agendamento) => agendamento.status === coluna.status)
                .sort((a, b) =>
                  coluna.maisRecentePrimeiro
                    ? HorarioMarcado.de(b).compararCom(HorarioMarcado.de(a))
                    : HorarioMarcado.de(a).compararCom(HorarioMarcado.de(b))
                );
              const anterior = COLUNAS[indice - 1];
              const proxima = COLUNAS[indice + 1];

              return (
                <div
                  key={coluna.status}
                  className={`kanban-coluna ${colunaAlvo === coluna.status ? "alvo" : ""} ${
                    colunaVisivel === coluna.status ? "visivel" : ""
                  }`}
                  data-status={coluna.status}
                  onDragOver={(evento) => permitirSoltar(evento, coluna.status)}
                  onDrop={(evento) => soltar(evento, coluna.status)}
                >
                  <header className="kanban-coluna-cabecalho">
                    <h2>{coluna.titulo}</h2>
                    <span className="kanban-coluna-acoes">
                      {coluna.status === "FINALIZADO" && quantidadeOcultos > 0 && (
                        <button
                          type="button"
                          className="admin-botao"
                          title="Trazer de volta os finalizados que foram limpos da tela"
                          disabled={restaurando}
                          onClick={mostrarOcultos}
                        >
                          {restaurando ? "Carregando..." : `Mostrar ocultos (${quantidadeOcultos})`}
                        </button>
                      )}
                      {coluna.status === "FINALIZADO" && cartoes.length > 0 && (
                        <button
                          type="button"
                          className="admin-botao"
                          title="Tirar os finalizados da tela (continuam nos relatórios)"
                          onClick={() => {
                            setMensagem(null);
                            setConfirmandoLimpeza(true);
                          }}
                        >
                          Limpar
                        </button>
                      )}
                      <span className="kanban-contador">{cartoes.length}</span>
                    </span>
                  </header>

                  {coluna.status === "FINALIZADO" && confirmandoLimpeza && cartoes.length > 0 && (
                    <div className="kanban-limpeza">
                      <p>
                        {cartoes.length === 1
                          ? "Tirar o agendamento finalizado da tela?"
                          : `Tirar os ${cartoes.length} agendamentos finalizados da tela?`}{" "}
                        Nada é apagado: os valores continuam nos relatórios.
                      </p>
                      <div className="kanban-cartao-acoes">
                        <button
                          type="button"
                          className="admin-botao"
                          disabled={limpando}
                          onClick={() => setConfirmandoLimpeza(false)}
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          className="admin-botao principal"
                          disabled={limpando}
                          onClick={limparFinalizados}
                        >
                          {limpando ? "Limpando..." : "Limpar finalizados"}
                        </button>
                      </div>
                    </div>
                  )}

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
                            <>
                              <button
                                type="button"
                                className="admin-botao perigo"
                                onClick={() => setConfirmandoCancelamentoId(agendamento.id)}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="admin-botao"
                                title="Mudar o dia ou o horário"
                                onClick={() => {
                                  setMensagem(null);
                                  setRemarcando(agendamento);
                                }}
                              >
                                <IconeCalendario tamanho={13} /> Remarcar
                              </button>
                            </>
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
          </div>
        </>
      )}
    </section>
  );
}
