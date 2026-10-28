import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AgendaService } from "../../services/AgendaService";
import { ProfissionalService } from "../../services/ProfissionalService";
import type {
  AgendaSemanal,
  Agendamento,
  BlocoDaAgenda,
  DiaDaAgenda,
  Profissional,
} from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { FaixaHoraria } from "../../models/FaixaHoraria";
import { EtapaAgendamento } from "../../models/EtapaAgendamento";
import { OpcaoProfissional } from "../../models/OpcaoProfissional";
import { PerfilDeAcesso } from "../../models/PerfilDeAcesso";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { ModalAgendamentoManual } from "../../components/admin/ModalAgendamentoManual";
import { ModalResumoAgendamento } from "../../components/admin/ModalResumoAgendamento";
import { ModalRemarcarAgendamento } from "../../components/admin/ModalRemarcarAgendamento";
import { useUsuarioLogado } from "../../hooks/useUsuarioLogado";
import { IconeSetaDireita, IconeSetaEsquerda } from "../../components/Icones";

const agendaService = new AgendaService();
const profissionalService = new ProfissionalService();

/** Agenda carregada, marcada com a consulta (profissional + semana) a que pertence. */
interface Carregada {
  consulta: string;
  agenda: AgendaSemanal;
}

/**
 * Visão de agenda: a semana de um profissional, horário a horário. Mostra quem está marcado,
 * os horários livres (clicar abre o "Novo agendamento" já preenchido), os que já passaram e os
 * dias fechados por folga ou feriado. No celular, mostra um dia por vez.
 */
export function AgendaPage() {
  const usuario = useUsuarioLogado();
  const proprioId = usuario.profissionalId;
  const hoje = DataAgenda.hoje();

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [escolhido, setEscolhido] = useState<number | null>(proprioId);
  const [inicio, setInicio] = useState(() => hoje.inicioDaSemana().toString());
  const [diaNoCelular, setDiaNoCelular] = useState(hoje.toString());

  const [carregada, setCarregada] = useState<Carregada | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [novoEm, setNovoEm] = useState<{ data: string; horario: string } | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  // Agendamento aberto no resumo (com quantas faixas ocupa) e o que está sendo remarcado.
  const [aberto, setAberto] = useState<{ agendamento: Agendamento; slots: number } | null>(null);
  const [remarcando, setRemarcando] = useState<Agendamento | null>(null);
  const fecharResumo = useCallback(() => setAberto(null), []);
  const fecharRemarcacao = useCallback(() => setRemarcando(null), []);

  function abrirResumo(bloco: BlocoDaAgenda): void {
    if (bloco.agendamento) {
      setMensagem(null);
      setAberto({ agendamento: bloco.agendamento, slots: bloco.slots });
    }
  }

  useEffect(() => {
    profissionalService
      .listar()
      .then((lista) => {
        const visiveis = new PerfilDeAcesso({ profissionalId: proprioId }).filtrarProfissionais(lista);
        setProfissionais(visiveis);
        setEscolhido((atual) => atual ?? visiveis[0]?.id ?? null);
      })
      .catch(() => setErro("Não foi possível carregar os profissionais."));
  }, [proprioId]);

  const consulta = escolhido === null ? null : `${escolhido}|${inicio}|${recarga}`;

  useEffect(() => {
    if (escolhido === null || consulta === null) {
      return;
    }
    let cancelado = false;
    agendaService
      .semana(escolhido, inicio)
      .then((agenda) => {
        if (!cancelado) {
          setCarregada({ consulta, agenda });
          setErro(null);
        }
      })
      .catch((erroRequisicao: Error) => {
        if (!cancelado) {
          setErro(erroRequisicao.message);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [escolhido, inicio, consulta]);

  function mudarSemana(semanas: number): void {
    const novoInicio = new DataAgenda(inicio).somarDias(semanas * 7);
    setInicio(novoInicio.toString());
    setDiaNoCelular(novoInicio.toString());
  }

  function irParaHoje(): void {
    setInicio(hoje.inicioDaSemana().toString());
    setDiaNoCelular(hoje.toString());
  }

  const agenda = carregada?.agenda ?? null;
  const atualizando = carregada !== null && carregada.consulta !== consulta;
  const primeiro = new DataAgenda(inicio);
  const ultimo = primeiro.somarDias(6);
  const titulo =
    `${primeiro.getDia()} ${primeiro.getMesCurto()} – ${ultimo.getDia()} ${ultimo.getMesCurto()} ` +
    ultimo.toString().slice(0, 4);
  const diaSelecionado =
    agenda?.dias.find((dia) => dia.data === diaNoCelular) ?? agenda?.dias[0] ?? null;

  const filtros = (
    <div className="agenda-filtros">
      {profissionais.length > 1 && (
        <label className="filtro-profissional">
          <span>Profissional</span>
          <select
            value={OpcaoProfissional.paraValor(escolhido)}
            onChange={(evento) => setEscolhido(OpcaoProfissional.lerId(evento.target.value))}
          >
            {profissionais.map((profissional) => (
              <option key={profissional.id} value={profissional.id}>
                {profissional.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="seletor-mes">
        <button
          type="button"
          className="admin-botao"
          onClick={() => mudarSemana(-1)}
          aria-label="Semana anterior"
        >
          <IconeSetaEsquerda tamanho={16} />
        </button>
        <span className="seletor-mes-nome">{titulo}</span>
        <button
          type="button"
          className="admin-botao"
          onClick={() => mudarSemana(1)}
          aria-label="Próxima semana"
        >
          <IconeSetaDireita tamanho={16} />
        </button>
      </div>
      <button type="button" className="admin-botao" onClick={irParaHoje}>
        Hoje
      </button>
    </div>
  );

  return (
    <section className="pagina pagina-larga">
      <CabecalhoPagina
        titulo="Agenda"
        descricao="A semana horário a horário. Clique num horário livre para agendar."
        acoes={filtros}
      />

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso admin-mensagem-topo">{mensagem}</p>}

      {novoEm && escolhido !== null && (
        <ModalAgendamentoManual
          profissionalFixo={proprioId}
          inicial={{ profissionalId: escolhido, data: novoEm.data, horario: novoEm.horario }}
          onFechar={() => setNovoEm(null)}
          onCriado={(criado) => {
            setNovoEm(null);
            setRecarga((atual) => atual + 1);
            setMensagem(
              `Agendamento de ${criado.cliente.nome} criado para ` +
                `${new DataAgenda(criado.data).formatar()} às ${criado.horarioInicio}.`
            );
          }}
        />
      )}

      {aberto && (
        <ModalResumoAgendamento
          agendamento={aberto.agendamento}
          slots={aberto.slots}
          onFechar={fecharResumo}
          onAtualizado={(atualizado) => {
            setAberto({ agendamento: atualizado, slots: aberto.slots });
            setRecarga((atual) => atual + 1);
          }}
          onRemarcar={(agendamento) => {
            setAberto(null);
            setRemarcando(agendamento);
          }}
          onErro={setErro}
        />
      )}

      {remarcando && (
        <ModalRemarcarAgendamento
          agendamento={remarcando}
          onFechar={fecharRemarcacao}
          onRemarcado={(atualizado) => {
            setRemarcando(null);
            setRecarga((atual) => atual + 1);
            setMensagem(
              `Agendamento de ${atualizado.cliente.nome} remarcado para ` +
                `${new DataAgenda(atualizado.data).formatar()} às ${atualizado.horarioInicio}.`
            );
          }}
        />
      )}

      <ul className="agenda-legenda" aria-label="Legenda">
        <li className="livre">Livre</li>
        <li className="agendado">Agendado</li>
        <li className="em-atendimento">Em atendimento</li>
        <li className="finalizado">Finalizado</li>
        <li className="fechado">Folga / feriado</li>
        <li className="passado">Já passou</li>
      </ul>

      {!agenda ? (
        !erro && <p>Carregando...</p>
      ) : agenda.horarios.length === 0 ? (
        <p className="bloqueios-vazio">
          {agenda.profissional.nome} ainda não tem horários liberados. Libere em{" "}
          <Link to="/admin/horarios">Horários</Link>.
        </p>
      ) : (
        <div className={`agenda ${atualizando ? "atualizando" : ""}`}>
          <SemanaNaGrade
            agenda={agenda}
            hoje={hoje.toString()}
            onLivre={(data, horario) => {
              setMensagem(null);
              setNovoEm({ data, horario });
            }}
            onAbrir={abrirResumo}
          />

          {/* Celular: um dia por vez. */}
          <div className="agenda-celular">
            <div className="agenda-dias" role="tablist" aria-label="Dias da semana">
              {agenda.dias.map((dia) => {
                const data = new DataAgenda(dia.data);
                return (
                  <button
                    key={dia.data}
                    type="button"
                    role="tab"
                    aria-selected={dia.data === diaSelecionado?.data}
                    className={`agenda-dia-aba ${dia.data === hoje.toString() ? "hoje" : ""} ${
                      dia.fechado ? "fechado" : ""
                    }`}
                    onClick={() => setDiaNoCelular(dia.data)}
                  >
                    <span>{data.getDiaDaSemanaCurto()}</span>
                    <strong>{data.getDia()}</strong>
                    <small>{dia.fechado ? "fechado" : `${dia.agendamentos} ag.`}</small>
                  </button>
                );
              })}
            </div>
            {diaSelecionado && (
              <DiaEmLista
                dia={diaSelecionado}
                onLivre={(horario) => {
                  setMensagem(null);
                  setNovoEm({ data: diaSelecionado.data, horario });
                }}
                onAbrir={abrirResumo}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

interface SemanaProps {
  agenda: AgendaSemanal;
  hoje: string;
  onLivre: (data: string, horario: string) => void;
  onAbrir: (bloco: BlocoDaAgenda) => void;
}

/** Computador/tablet: dias em colunas, horários em linhas; o atendimento ocupa as linhas da sua duração. */
function SemanaNaGrade({ agenda, hoje, onLivre, onAbrir }: SemanaProps) {
  const linhaDo = new Map(agenda.horarios.map((horario, indice) => [horario, indice + 2]));

  return (
    <div
      className="agenda-grade"
      style={{
        gridTemplateColumns: `56px repeat(${agenda.dias.length}, minmax(120px, 1fr))`,
        gridTemplateRows: `auto repeat(${agenda.horarios.length}, var(--agenda-linha))`,
      }}
    >
      <div className="agenda-canto" style={{ gridColumn: 1, gridRow: 1 }} />
      {agenda.dias.map((dia, coluna) => {
        const data = new DataAgenda(dia.data);
        return (
          <div
            key={dia.data}
            className={`agenda-cabecalho-dia ${dia.data === hoje ? "hoje" : ""} ${
              dia.fechado ? "fechado" : ""
            }`}
            style={{ gridColumn: coluna + 2, gridRow: 1 }}
          >
            <span>
              {data.getDiaDaSemanaCurto()} <strong>{data.getDia()}</strong>
            </span>
            <small title={dia.motivoFechado ?? undefined}>
              {dia.fechado
                ? `Fechado${dia.motivoFechado ? ` · ${dia.motivoFechado}` : ""}`
                : `${dia.agendamentos} agend. · ${dia.livres} livres`}
            </small>
          </div>
        );
      })}

      {agenda.horarios.map((horario, indice) => (
        <div
          key={horario}
          className="agenda-hora"
          style={{ gridColumn: 1, gridRow: indice + 2 }}
        >
          {horario}
        </div>
      ))}

      {/* Fundo quadriculado: uma célula por dia e horário. */}
      {agenda.dias.map((dia, coluna) =>
        agenda.horarios.map((horario, indice) => (
          <div
            key={`${dia.data}-${horario}`}
            className={`agenda-celula ${dia.data === hoje ? "hoje" : ""}`}
            style={{ gridColumn: coluna + 2, gridRow: indice + 2 }}
          />
        ))
      )}

      {agenda.dias.map((dia, coluna) =>
        dia.blocos.map((bloco) => (
          <div
            key={`${dia.data}-${bloco.horario}`}
            className="agenda-posicao"
            style={{
              gridColumn: coluna + 2,
              gridRow: `${linhaDo.get(bloco.horario)} / span ${bloco.slots}`,
            }}
          >
            <Bloco
              bloco={bloco}
              onLivre={() => onLivre(dia.data, bloco.horario)}
              onAbrir={() => onAbrir(bloco)}
            />
          </div>
        ))
      )}
    </div>
  );
}

/** Celular: os blocos do dia, um embaixo do outro. */
interface DiaProps {
  dia: DiaDaAgenda;
  onLivre: (horario: string) => void;
  onAbrir: (bloco: BlocoDaAgenda) => void;
}

function DiaEmLista({ dia, onLivre, onAbrir }: DiaProps) {
  if (dia.blocos.length === 0) {
    return <p className="bloqueios-vazio">Sem atendimento neste dia.</p>;
  }
  return (
    <ol className="agenda-lista">
      {dia.fechado && (
        <li className="agenda-lista-aviso">
          Dia fechado{dia.motivoFechado ? `: ${dia.motivoFechado}` : ""}.
        </li>
      )}
      {dia.blocos.map((bloco) => (
        <li key={bloco.horario} className="agenda-lista-linha">
          <span className="agenda-hora">{bloco.horario}</span>
          <Bloco
            bloco={bloco}
            onLivre={() => onLivre(bloco.horario)}
            onAbrir={() => onAbrir(bloco)}
          />
        </li>
      ))}
    </ol>
  );
}

/** Um bloco da agenda: atendimento marcado ou horário livre/passado/fechado. */
interface BlocoProps {
  bloco: BlocoDaAgenda;
  onLivre: () => void;
  onAbrir: () => void;
}

function Bloco({ bloco, onLivre, onAbrir }: BlocoProps) {
  if (bloco.tipo === "livre") {
    return (
      <button
        type="button"
        className="agenda-bloco livre"
        onClick={onLivre}
        aria-label={`Agendar às ${bloco.horario}`}
      >
        + Livre
      </button>
    );
  }
  if (bloco.tipo !== "agendamento" || !bloco.agendamento) {
    return (
      <div
        className={`agenda-bloco ${bloco.tipo}`}
        title={bloco.tipo === "fechado" ? "Folga ou feriado" : "Horário que já passou"}
      />
    );
  }

  const agendamento = bloco.agendamento;
  const etapa = new EtapaAgendamento(agendamento.status);
  const faixa = new FaixaHoraria(bloco.horario, bloco.slots).formatar();
  // Atendimento de 30min tem pouca altura na grade: tudo numa linha só.
  const curto = bloco.slots === 1;
  return (
    <button
      type="button"
      className={`agenda-bloco agendamento ${etapa.getClasse()} ${curto ? "curto" : ""}`}
      onClick={onAbrir}
      aria-label={`${agendamento.cliente.nome}, ${faixa}, ${etapa.getNome()}. Ver detalhes`}
    >
      <span className="agenda-bloco-topo">
        <span className="agenda-bloco-hora">{faixa}</span>
        <span className="agenda-bloco-etapa" title={etapa.getNome()} aria-hidden="true" />
      </span>
      <strong className="agenda-bloco-cliente">{agendamento.cliente.nome}</strong>
      {!curto && (
        <span className="agenda-bloco-servicos">
          {agendamento.tratamentos.map((tratamento) => tratamento.nome).join(" · ")}
        </span>
      )}
    </button>
  );
}
