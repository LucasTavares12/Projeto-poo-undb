import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { BloqueioAgendaService } from "../../services/BloqueioAgendaService";
import { ProfissionalService } from "../../services/ProfissionalService";
import type { Agendamento, BloqueioAgenda, Profissional } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { useUsuarioLogado } from "../../hooks/useUsuarioLogado";
import { IconeBloqueio, IconeTelefone } from "../../components/Icones";
import { PerfilDeAcesso } from "../../models/PerfilDeAcesso";
import { OpcaoProfissional } from "../../models/OpcaoProfissional";
import { PeriodoDeDatas } from "../../models/PeriodoDeDatas";
import { HorarioMarcado } from "../../models/HorarioMarcado";

const bloqueioService = new BloqueioAgendaService();
const profissionalService = new ProfissionalService();

// Sugestões do campo "Motivo" (o usuário pode escrever qualquer outro).
const MOTIVOS_SUGERIDOS = ["Férias", "Folga", "Feriado", "Curso ou evento", "Atestado médico"];

interface Formulario {
  agenda: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
}

/** Agendamentos que já estavam marcados no período que acabou de ser bloqueado. */
interface Aviso {
  periodo: string;
  agendamentos: Agendamento[];
}

export function BloqueiosPage() {
  // Conta ligada a profissional: só bloqueia a própria agenda (feriado da clínica é do acesso total).
  const { profissionalId: proprioId } = useUsuarioLogado();
  const perfil = new PerfilDeAcesso({ profissionalId: proprioId });
  const acessoTotal = perfil.temAcessoTotal();
  const hoje = DataAgenda.hoje().toString();

  const formularioVazio = (): Formulario => ({
    // Opção vazia do select = clínica inteira.
    agenda: OpcaoProfissional.paraValor(proprioId),
    dataInicio: hoje,
    dataFim: hoje,
    motivo: "",
  });

  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [mostrarEncerrados, setMostrarEncerrados] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [formulario, setFormulario] = useState<Formulario>(formularioVazio);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoRemocaoId, setConfirmandoRemocaoId] = useState<number | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    profissionalService
      .listar()
      .then(setProfissionais)
      .catch(() => setErro("Não foi possível carregar os profissionais."));
  }, []);

  useEffect(() => {
    let cancelado = false;
    bloqueioService
      .listar(mostrarEncerrados)
      .then((lista) => {
        if (!cancelado) {
          setBloqueios(lista);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setErro("Não foi possível carregar os bloqueios.");
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [mostrarEncerrados]);

  function nomeDaAgenda(profissionalId: number | null): string {
    if (profissionalId === null) {
      return "Clínica inteira";
    }
    return profissionais.find((profissional) => profissional.id === profissionalId)?.nome ?? "—";
  }

  function periodoDe(bloqueio: BloqueioAgenda): PeriodoDeDatas {
    return new PeriodoDeDatas(bloqueio.dataInicio, bloqueio.dataFim);
  }

  function alterarInicio(dataInicio: string): void {
    // A data final acompanha a inicial quando ficaria antes dela (o caso comum: um dia só).
    setFormulario((atual) => ({
      ...atual,
      dataInicio,
      dataFim: atual.dataFim < dataInicio ? dataInicio : atual.dataFim,
    }));
  }

  async function salvar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);
    setMensagem(null);
    setAviso(null);
    try {
      const { bloqueio, agendamentosAfetados } = await bloqueioService.criar({
        profissionalId: OpcaoProfissional.lerId(formulario.agenda),
        dataInicio: formulario.dataInicio,
        dataFim: formulario.dataFim,
        motivo: formulario.motivo.trim(),
      });

      setBloqueios((lista) =>
        [...lista, bloqueio].sort((a, b) => periodoDe(a).compararCom(periodoDe(b)))
      );
      const periodo = periodoDe(bloqueio).formatar();
      setMensagem(
        `Agenda ${bloqueio.profissionalId === null ? "da clínica" : `de ${nomeDaAgenda(bloqueio.profissionalId)}`} ` +
          `bloqueada em ${periodo}. Os clientes não conseguem mais agendar nesse período.`
      );
      if (agendamentosAfetados.length > 0) {
        setAviso({ periodo, agendamentos: agendamentosAfetados });
      }
      setFormulario(formularioVazio());
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number): Promise<void> {
    setConfirmandoRemocaoId(null);
    setErro(null);
    setMensagem(null);
    try {
      await bloqueioService.remover(id);
      setBloqueios((lista) => lista.filter((bloqueio) => bloqueio.id !== id));
      setMensagem("Bloqueio removido. Os horários desse período voltaram a ficar disponíveis.");
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    }
  }

  return (
    <section className="pagina">
      <CabecalhoPagina
        titulo="Folgas e feriados"
        descricao={
          acessoTotal
            ? "Feche a agenda de um profissional ou da clínica inteira em dias específicos."
            : "Feche a sua agenda nos dias em que você não vai atender."
        }
      />

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso admin-mensagem-topo">{mensagem}</p>}

      {aviso && (
        <div className="bloqueio-aviso" role="alert">
          <strong>
            {aviso.agendamentos.length === 1
              ? "Já existe 1 agendamento nesse período."
              : `Já existem ${aviso.agendamentos.length} agendamentos nesse período.`}
          </strong>
          <p>
            Eles <b>não foram cancelados</b>. Avise os clientes e, se for o caso, cancele pelo quadro
            de <Link to="/admin">Agendamentos</Link>.
          </p>
          <ul>
            {aviso.agendamentos.map((agendamento) => (
              <li key={agendamento.id}>
                <span>
                  {HorarioMarcado.de(agendamento).formatar()} ·{" "}
                  <b>{agendamento.cliente.nome}</b>
                  {acessoTotal && ` com ${agendamento.profissional.nome}`}
                </span>
                <span className="bloqueio-aviso-telefone">
                  <IconeTelefone tamanho={13} /> {agendamento.cliente.telefone}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="admin-botao" onClick={() => setAviso(null)}>
            Entendi
          </button>
        </div>
      )}

      <form className="admin-formulario" onSubmit={salvar}>
        <h2>Novo bloqueio</h2>
        <div className="admin-campos">
          <label>
            Agenda de
            {acessoTotal ? (
              <select
                value={formulario.agenda}
                onChange={(evento) => setFormulario({ ...formulario, agenda: evento.target.value })}
              >
                <option value={OpcaoProfissional.NENHUM}>Clínica inteira (feriado, recesso)</option>
                {profissionais.map((profissional) => (
                  <option key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </option>
                ))}
              </select>
            ) : (
              <input type="text" value={nomeDaAgenda(proprioId)} disabled />
            )}
          </label>
          <label>
            Primeiro dia
            <input
              type="date"
              required
              min={hoje}
              value={formulario.dataInicio}
              onChange={(evento) => alterarInicio(evento.target.value)}
            />
          </label>
          <label>
            Último dia
            <input
              type="date"
              required
              min={formulario.dataInicio || hoje}
              value={formulario.dataFim}
              onChange={(evento) => setFormulario({ ...formulario, dataFim: evento.target.value })}
            />
          </label>
          <label>
            Motivo (opcional)
            <input
              type="text"
              list="motivos-bloqueio"
              maxLength={150}
              placeholder="Ex: Férias"
              value={formulario.motivo}
              onChange={(evento) => setFormulario({ ...formulario, motivo: evento.target.value })}
            />
            <datalist id="motivos-bloqueio">
              {MOTIVOS_SUGERIDOS.map((motivo) => (
                <option key={motivo} value={motivo} />
              ))}
            </datalist>
          </label>
        </div>
        <p className="admin-dica">
          Nos dias bloqueados nenhum horário aparece livre, nem na página de agendamento nem no
          "Novo agendamento" do painel. A grade semanal de horários continua a mesma. O motivo é só
          para a equipe: o cliente vê apenas que o dia está fechado.
        </p>
        <div className="admin-acoes">
          <button type="submit" className="admin-botao principal" disabled={salvando}>
            <IconeBloqueio tamanho={16} />
            {salvando ? "Bloqueando..." : "Bloquear agenda"}
          </button>
        </div>
      </form>

      <div className="bloqueios-lista-cabecalho">
        <h2>{mostrarEncerrados ? "Todos os bloqueios" : "Próximos bloqueios"}</h2>
        <label className="bloqueios-filtro">
          <input
            type="checkbox"
            className="admin-interruptor"
            checked={mostrarEncerrados}
            onChange={(evento) => setMostrarEncerrados(evento.target.checked)}
          />
          Mostrar encerrados
        </label>
      </div>

      {carregando ? (
        <p>Carregando...</p>
      ) : bloqueios.length === 0 ? (
        <p className="bloqueios-vazio">
          {mostrarEncerrados
            ? "Nenhum bloqueio cadastrado."
            : "Nenhuma folga ou feriado pela frente: a agenda segue a grade semanal normalmente."}
        </p>
      ) : (
        <table className="admin-tabela admin-tabela-cartoes">
          <thead>
            <tr>
              <th>Período</th>
              <th>Agenda</th>
              <th>Motivo</th>
              <th>Situação</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bloqueios.map((bloqueio) => {
              const periodo = periodoDe(bloqueio);
              const encerrado = periodo.jaTerminou(hoje);
              const emAndamento = periodo.estaEmAndamento(hoje);
              // Conta de profissional não remove o feriado da clínica.
              const podeRemover = perfil.podeGerenciar(bloqueio.profissionalId);
              return (
                <tr key={bloqueio.id} className={encerrado ? "bloqueio-encerrado" : ""}>
                  <td className="admin-tabela-titulo">
                    <span className="bloqueio-periodo">
                      {periodo.formatar()}
                      <span className="admin-etiqueta">
                        {bloqueio.quantidadeDias === 1 ? "1 dia" : `${bloqueio.quantidadeDias} dias`}
                      </span>
                    </span>
                  </td>
                  <td data-rotulo="Agenda">
                    {bloqueio.profissionalId === null ? (
                      <span className="usuarios-acesso profissional">Clínica inteira</span>
                    ) : (
                      nomeDaAgenda(bloqueio.profissionalId)
                    )}
                  </td>
                  <td data-rotulo="Motivo">{bloqueio.motivo || "—"}</td>
                  <td data-rotulo="Situação">
                    <span
                      className={`bloqueio-situacao ${
                        encerrado ? "encerrado" : emAndamento ? "andamento" : "agendado"
                      }`}
                    >
                      {encerrado ? "Encerrado" : emAndamento ? "Em andamento" : "Programado"}
                    </span>
                  </td>
                  <td className="admin-tabela-acoes">
                    {!podeRemover ? null : confirmandoRemocaoId === bloqueio.id ? (
                      <>
                        <button
                          type="button"
                          className="admin-botao perigo"
                          onClick={() => remover(bloqueio.id)}
                        >
                          Confirmar remoção
                        </button>
                        <button
                          type="button"
                          className="admin-botao"
                          onClick={() => setConfirmandoRemocaoId(null)}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="admin-botao perigo"
                        onClick={() => setConfirmandoRemocaoId(bloqueio.id)}
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
