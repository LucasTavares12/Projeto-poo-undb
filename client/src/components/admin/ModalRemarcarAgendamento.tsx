import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AgendamentoService } from "../../services/AgendamentoService";
import { BloqueioAgendaService } from "../../services/BloqueioAgendaService";
import type { Agendamento, PeriodoBloqueado } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { Duracao } from "../../models/Duracao";
import { IconeFechar } from "../Icones";
import { DiasSemAtendimento } from "../../models/DiasSemAtendimento";
import { HorarioMarcado } from "../../models/HorarioMarcado";

const agendamentoService = new AgendamentoService();
const bloqueioService = new BloqueioAgendaService();

interface Props {
  agendamento: Agendamento;
  onFechar: () => void;
  onRemarcado: (atualizado: Agendamento) => void;
}

/** Horários livres de uma data, marcados com a data a que pertencem. */
interface HorariosDaData {
  data: string;
  horarios: string[];
}

/**
 * Botão "Remarcar" do Kanban: muda o dia e o horário de um agendamento sem cancelar e criar
 * outro. Mostra só os horários livres na agenda do mesmo profissional, com espaço para a
 * duração de todos os tratamentos.
 */
export function ModalRemarcarAgendamento({ agendamento, onFechar, onRemarcado }: Props) {
  const hoje = DataAgenda.hoje().toString();
  const [data, setData] = useState(agendamento.data >= hoje ? agendamento.data : hoje);
  const [livres, setLivres] = useState<HorariosDaData | null>(null);
  // O horário escolhido vale só para a data em que foi escolhido.
  const [escolha, setEscolha] = useState<{ data: string; horario: string } | null>(null);
  const [periodosBloqueados, setPeriodosBloqueados] = useState<PeriodoBloqueado[]>([]);
  // Muda quando é preciso buscar de novo os horários da mesma data (ex: o escolhido foi ocupado).
  const [recarga, setRecarga] = useState(0);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const profissionalId = agendamento.profissional.id;

  useEffect(() => {
    bloqueioService
      .listarDoProfissional(profissionalId)
      .then(setPeriodosBloqueados)
      .catch(() => undefined);
  }, [profissionalId]);

  // Esc fecha a janela.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        onFechar();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  useEffect(() => {
    if (data === "" || data < hoje) {
      return;
    }
    let cancelado = false;
    agendamentoService
      .horariosParaRemarcar(agendamento.id, data)
      .then((horarios) => {
        if (!cancelado) {
          setLivres({ data, horarios });
        }
      })
      .catch((erroRequisicao: Error) => {
        if (!cancelado) {
          setLivres({ data, horarios: [] });
          setErro(erroRequisicao.message);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [agendamento.id, data, hoje, recarga]);

  const dataValida = data !== "" && data >= hoje;
  const carregando = dataValida && livres?.data !== data;
  const horarios = livres?.data === data ? livres.horarios : [];
  const horario = escolha?.data === data ? escolha.horario : null;
  const bloqueada = new DiasSemAtendimento(periodosBloqueados).estaFechado(data);

  async function remarcar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    if (horario === null || enviando) {
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      onRemarcado(await agendamentoService.remarcar(agendamento.id, data, horario));
    } catch (erroRequisicao) {
      // Alguém pode ter pego o horário nesse meio-tempo: recarrega a lista do dia.
      setErro((erroRequisicao as Error).message);
      setEscolha(null);
      setLivres(null);
      setRecarga((atual) => atual + 1);
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fundo" onMouseDown={onFechar}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-remarcar-titulo"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={remarcar}
      >
        <header className="modal-cabecalho">
          <div>
            <h2 id="modal-remarcar-titulo">Remarcar agendamento</h2>
            <p>Escolha o novo dia e horário. O resto do agendamento continua igual.</p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <IconeFechar tamanho={18} />
          </button>
        </header>

        <div className="modal-corpo">
          {erro && <p className="mensagem-erro">{erro}</p>}

          <div className="remarcar-atual">
            <span className="admin-avatar pequeno">
              {agendamento.cliente.nome.charAt(0).toUpperCase()}
            </span>
            <span>
              <strong>{agendamento.cliente.nome}</strong>
              <small>
                {agendamento.profissional.nome} ·{" "}
                {agendamento.tratamentos.map((tratamento) => tratamento.nome).join(", ")} ·{" "}
                {new Duracao(agendamento.duracaoTotalMinutos).formatar()}
              </small>
              <small>
                Marcado para{" "}
                <b>
                  {HorarioMarcado.de(agendamento).formatar()}
                </b>
              </small>
            </span>
          </div>

          <div className="admin-campos">
            <label>
              Novo dia
              <input
                type="date"
                required
                min={hoje}
                value={data}
                onChange={(evento) => {
                  setData(evento.target.value);
                  setErro(null);
                }}
              />
            </label>
          </div>

          <fieldset className="modal-grupo">
            <legend>Novo horário</legend>
            {!dataValida ? (
              <p className="admin-dica">Escolha um dia a partir de hoje.</p>
            ) : carregando ? (
              <p className="admin-dica">Carregando horários...</p>
            ) : horarios.length === 0 ? (
              <p className="admin-dica">
                {bloqueada
                  ? `${agendamento.profissional.nome} não atende nesse dia (folga ou feriado).`
                  : "Nenhum horário livre nesse dia com espaço para todos os tratamentos. " +
                    "Escolha outra data."}
              </p>
            ) : (
              <div className="modal-opcoes">
                {horarios.map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    className={`modal-opcao ${horario === opcao ? "marcada" : ""}`}
                    aria-pressed={horario === opcao}
                    onClick={() => setEscolha({ data, horario: opcao })}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          {horario && (
            <p className="remarcar-resumo">
              <s>{HorarioMarcado.de(agendamento).formatar()}</s>
              <span aria-hidden="true">→</span>
              <strong>{new HorarioMarcado(data, horario).formatar()}</strong>
            </p>
          )}
        </div>

        <footer className="modal-rodape">
          <button type="button" className="admin-botao" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-botao principal"
            disabled={horario === null || enviando}
          >
            {enviando ? "Remarcando..." : "Remarcar"}
          </button>
        </footer>
      </form>
    </div>
  );
}
