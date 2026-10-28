import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { Agendamento } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { Dinheiro } from "../../models/Dinheiro";
import { Duracao } from "../../models/Duracao";
import { Telefone } from "../../models/Telefone";
import { FaixaHoraria } from "../../models/FaixaHoraria";
import { EtapaAgendamento } from "../../models/EtapaAgendamento";
import { MensagemWhatsApp } from "../../models/MensagemWhatsApp";
import { BotaoWhatsApp } from "./BotaoWhatsApp";
import {
  IconeBrilho,
  IconeCalendario,
  IconeCliente,
  IconeFechar,
  IconePessoas,
  IconeRelogio,
  IconeTelefone,
} from "../Icones";

interface Props {
  agendamento: Agendamento;
  /** Quantas faixas de 30min o atendimento ocupa (para mostrar "09:30–11:00"). */
  slots: number;
  onFechar: () => void;
  /** O agendamento voltou do servidor alterado (ex: lembrete anotado). */
  onAtualizado: (atualizado: Agendamento) => void;
  /** Só para agendamentos ainda não atendidos. */
  onRemarcar: (agendamento: Agendamento) => void;
  onErro: (mensagem: string) => void;
}

/** Resumo de um agendamento, aberto ao clicar nele na agenda. */
export function ModalResumoAgendamento({
  agendamento,
  slots,
  onFechar,
  onAtualizado,
  onRemarcar,
  onErro,
}: Props) {
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fechar.current?.focus();
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onFechar();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const etapa = new EtapaAgendamento(agendamento.status);
  const telefone = new Telefone(agendamento.cliente.telefone);
  const data = new DataAgenda(agendamento.data).formatarPorExtenso();
  const tipoDeMensagem =
    agendamento.status === "AGENDADO"
      ? "LEMBRETE"
      : agendamento.status === "FINALIZADO"
        ? "AGRADECIMENTO"
        : null;
  const mensagemEnviada = tipoDeMensagem
    ? new MensagemWhatsApp(tipoDeMensagem, agendamento).getEnviadaEm()
    : null;

  return (
    <div className="modal-fundo" onMouseDown={onFechar}>
      <div
        className={`modal resumo-agendamento ${etapa.getClasse()}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resumo-agendamento-titulo"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="resumo-agendamento-topo">
          <span className="admin-avatar">{agendamento.cliente.nome.charAt(0).toUpperCase()}</span>
          <div>
            <h2 id="resumo-agendamento-titulo">{agendamento.cliente.nome}</h2>
            <span className={`ficha-etapa ${etapa.getClasse()}`}>{etapa.getNome()}</span>
          </div>
          <button
            ref={fechar}
            type="button"
            className="modal-fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <IconeFechar tamanho={18} />
          </button>
        </header>

        <div className="modal-corpo">
          <div className="resumo-agendamento-quando">
            <IconeCalendario tamanho={20} />
            <div>
              <strong>{data.charAt(0).toUpperCase() + data.slice(1)}</strong>
              <span>
                {new FaixaHoraria(agendamento.horarioInicio, slots).formatar()} ·{" "}
                {new Duracao(agendamento.duracaoTotalMinutos).formatar()}
              </span>
            </div>
          </div>

          <ul className="resumo-agendamento-dados">
            <li>
              <IconePessoas tamanho={16} />
              <span>
                <small>Profissional</small>
                {agendamento.profissional.nome}
              </span>
            </li>
            <li>
              <IconeTelefone tamanho={16} />
              <span>
                <small>Telefone</small>
                {telefone.formatar()}
              </span>
            </li>
            {tipoDeMensagem && (
              <li>
                <IconeRelogio tamanho={16} />
                <span>
                  <small>{tipoDeMensagem === "LEMBRETE" ? "Lembrete" : "Agradecimento"}</small>
                  {mensagemEnviada
                    ? `Enviado ${MensagemWhatsApp.descreverEnvio(mensagemEnviada)}`
                    : "Ainda não enviado"}
                </span>
              </li>
            )}
          </ul>

          <div className="resumo-agendamento-servicos">
            <h3>
              <IconeBrilho tamanho={15} />
              {agendamento.tratamentos.length === 1 ? "Serviço" : "Serviços"}
            </h3>
            <ul>
              {agendamento.tratamentos.map((tratamento) => (
                <li key={tratamento.id}>
                  <span>
                    {tratamento.nome}
                    <small>{new Duracao(tratamento.duracaoMinutos).formatar()}</small>
                  </span>
                  <b>{new Dinheiro(tratamento.valor).formatar()}</b>
                </li>
              ))}
            </ul>
            <p className="resumo-agendamento-total">
              <span>Total</span>
              <strong>{new Dinheiro(agendamento.valorTotal).formatar()}</strong>
            </p>
          </div>

          {tipoDeMensagem && (
            <BotaoWhatsApp
              agendamento={agendamento}
              tipo={tipoDeMensagem}
              onRegistrado={onAtualizado}
              onErro={onErro}
            />
          )}
        </div>

        <footer className="modal-rodape resumo-agendamento-acoes">
          <Link
            to={`/admin/clientes/${telefone.getDigitos()}`}
            className="admin-botao"
            onClick={onFechar}
          >
            <IconeCliente tamanho={16} /> Ficha do cliente
          </Link>
          {agendamento.status === "AGENDADO" && (
            <button
              type="button"
              className="admin-botao principal"
              onClick={() => onRemarcar(agendamento)}
            >
              <IconeCalendario tamanho={16} /> Remarcar
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
