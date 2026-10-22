import { useEffect, useState } from "react";
import { AgendamentoService } from "../../services/AgendamentoService";
import { BloqueioAgendaService } from "../../services/BloqueioAgendaService";
import type { Agendamento, PeriodoBloqueado } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { SeletorData } from "./SeletorData";
import { SeletorHorario } from "./SeletorHorario";
import { DiasSemAtendimento } from "../../models/DiasSemAtendimento";
import { HorarioMarcado } from "../../models/HorarioMarcado";

const agendamentoService = new AgendamentoService();
const bloqueioService = new BloqueioAgendaService();

interface Props {
  agendamento: Agendamento;
  /** Telefone da busca: confirma que o agendamento é da pessoa. */
  telefone: string;
  onRemarcado: (atualizado: Agendamento) => void;
  onDesistir: () => void;
}

/** Horários livres de uma data, marcados com a data a que pertencem. */
interface HorariosDaData {
  data: string;
  horarios: string[];
}

/**
 * Escolha do novo dia e horário de um agendamento, na página do cliente. Só aparecem os
 * horários livres na agenda do mesmo profissional, com espaço para todos os tratamentos.
 */
export function RemarcarAgendamento({ agendamento, telefone, onRemarcado, onDesistir }: Props) {
  const hoje = DataAgenda.hoje().toString();
  const [data, setData] = useState(agendamento.data >= hoje ? agendamento.data : hoje);
  const [livres, setLivres] = useState<HorariosDaData | null>(null);
  // O horário escolhido vale só para a data em que foi escolhido.
  const [escolha, setEscolha] = useState<{ data: string; horario: string } | null>(null);
  const [periodosBloqueados, setPeriodosBloqueados] = useState<PeriodoBloqueado[]>([]);
  // Muda quando é preciso buscar de novo os horários da mesma data (ex: o escolhido foi ocupado).
  const [recarga, setRecarga] = useState(0);

  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const profissionalId = agendamento.profissional.id;

  useEffect(() => {
    bloqueioService
      .listarDoProfissional(profissionalId)
      .then(setPeriodosBloqueados)
      // Sem a lista, nenhum dia aparece fechado; o servidor continua recusando os dias bloqueados.
      .catch(() => undefined);
  }, [profissionalId]);

  const diasSemAtendimento = new DiasSemAtendimento(periodosBloqueados);
  const dataEstaBloqueada = (dia: string) => diasSemAtendimento.estaFechado(dia);
  const bloqueada = dataEstaBloqueada(data);

  useEffect(() => {
    if (data === "" || bloqueada) {
      return;
    }
    let cancelado = false;
    agendamentoService
      .horariosParaRemarcarDoCliente(agendamento.id, telefone, data)
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
  }, [agendamento.id, telefone, data, bloqueada, recarga]);

  const carregando = data !== "" && !bloqueada && livres?.data !== data;
  const horarios = livres?.data === data ? livres.horarios : [];
  const horario = escolha?.data === data ? escolha.horario : null;

  function trocarData(novaData: string): void {
    setData(novaData);
    setErro(null);
    setConfirmando(false);
  }

  async function remarcar(): Promise<void> {
    if (horario === null) {
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      onRemarcado(
        await agendamentoService.remarcarDoCliente(agendamento.id, telefone, data, horario)
      );
    } catch (erroRequisicao) {
      // Alguém pode ter pego o horário nesse meio-tempo: recarrega a lista do dia.
      setErro((erroRequisicao as Error).message);
      setConfirmando(false);
      setLivres(null);
      setEscolha(null);
      setRecarga((atual) => atual + 1);
    } finally {
      setEnviando(false);
    }
  }

  const deQuando = HorarioMarcado.de(agendamento).formatarPorExtenso();
  const paraQuando = horario ? new HorarioMarcado(data, horario).formatarPorExtenso() : "";

  return (
    <div className="remarcar">
      <h4>Escolha o novo dia</h4>
      <SeletorData data={data} onSelecionar={trocarData} estaBloqueada={dataEstaBloqueada} />

      {!bloqueada && data !== "" && (
        <>
          <h4>Escolha o novo horário</h4>
          <SeletorHorario
            horarios={horarios}
            selecionado={horario}
            onSelecionar={(novo) => {
              setEscolha({ data, horario: novo });
              setConfirmando(false);
            }}
            carregando={carregando}
          />
        </>
      )}

      {erro && <p className="mensagem-erro remarcar-erro">{erro}</p>}

      {confirmando && horario ? (
        <div className="remarcar-confirmacao" role="alertdialog" aria-label="Confirmar remarcação">
          <p className="remarcar-de-para">
            <span>
              <small>De</small>
              <s>{deQuando}</s>
            </span>
            <span>
              <small>Para</small>
              <strong>{paraQuando}</strong>
            </span>
          </p>
          <p>O horário antigo será liberado para outras pessoas.</p>
          <div className="agendamento-cliente-acoes">
            <button
              type="button"
              className="botao-contorno"
              disabled={enviando}
              onClick={() => setConfirmando(false)}
            >
              Voltar
            </button>
            <button type="button" className="botao-primario" disabled={enviando} onClick={remarcar}>
              {enviando ? "Remarcando..." : "Sim, remarcar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="agendamento-cliente-acoes">
          <button type="button" className="botao-contorno" onClick={onDesistir}>
            Manter como está
          </button>
          <button
            type="button"
            className="botao-primario"
            disabled={horario === null}
            onClick={() => setConfirmando(true)}
          >
            Remarcar
          </button>
        </div>
      )}
    </div>
  );
}
