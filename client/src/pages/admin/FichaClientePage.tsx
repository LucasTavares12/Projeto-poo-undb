import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClienteService } from "../../services/ClienteService";
import type { FichaDoCliente } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { Dinheiro } from "../../models/Dinheiro";
import { Duracao } from "../../models/Duracao";
import { Telefone } from "../../models/Telefone";
import { HorarioMarcado } from "../../models/HorarioMarcado";
import { EtapaAgendamento } from "../../models/EtapaAgendamento";
import {
  IconeBrilho,
  IconeCalendario,
  IconeConfirmado,
  IconeDinheiro,
  IconePessoas,
  IconeSetaEsquerda,
  IconeTendencia,
  IconeWhatsApp,
} from "../../components/Icones";

const clienteService = new ClienteService();

/** Ficha do cliente: resumo, preferências e todos os agendamentos. */
export function FichaClientePage() {
  const { telefone = "" } = useParams();
  const [ficha, setFicha] = useState<FichaDoCliente | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    clienteService
      .ficha(telefone)
      .then((resposta) => {
        if (!cancelado) {
          setFicha(resposta);
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
  }, [telefone]);

  const voltar = (
    <Link to="/admin/clientes" className="ficha-voltar">
      <IconeSetaEsquerda tamanho={16} /> Clientes
    </Link>
  );

  if (!ficha) {
    return (
      <section className="pagina">
        {voltar}
        {erro ? <p className="mensagem-erro">{erro}</p> : <p>Carregando...</p>}
      </section>
    );
  }

  const fone = new Telefone(ficha.telefone);

  return (
    <section className="pagina">
      {voltar}

      <header className="ficha-cabecalho">
        <span className="admin-avatar ficha-avatar">{ficha.nome.charAt(0).toUpperCase()}</span>
        <div>
          <h1>{ficha.nome}</h1>
          <p className="admin-subtitulo">
            {fone.formatar()}
            {ficha.primeiroAtendimento &&
              ` · Cliente desde ${new DataAgenda(ficha.primeiroAtendimento).formatar()}`}
          </p>
        </div>
        <a
          className="admin-botao ficha-whatsapp"
          href={fone.linkWhatsApp()}
          target="_blank"
          rel="noreferrer"
        >
          <IconeWhatsApp tamanho={17} /> WhatsApp
        </a>
      </header>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="admin-resumo">
        <div className="admin-resumo-cartao">
          <span className="admin-resumo-icone">
            <IconeConfirmado />
          </span>
          <span className="admin-resumo-rotulo">Atendimentos</span>
          <strong className="admin-resumo-valor">{ficha.atendimentos}</strong>
          <span className="admin-resumo-detalhe">finalizados</span>
        </div>
        <div className="admin-resumo-cartao">
          <span className="admin-resumo-icone">
            <IconeDinheiro />
          </span>
          <span className="admin-resumo-rotulo">Total gasto</span>
          <strong className="admin-resumo-valor">{new Dinheiro(ficha.totalGasto).formatar()}</strong>
          <span className="admin-resumo-detalhe">em atendimentos finalizados</span>
        </div>
        <div className="admin-resumo-cartao">
          <span className="admin-resumo-icone">
            <IconeTendencia />
          </span>
          <span className="admin-resumo-rotulo">Ticket médio</span>
          <strong className="admin-resumo-valor">{new Dinheiro(ficha.ticketMedio).formatar()}</strong>
          <span className="admin-resumo-detalhe">por atendimento</span>
        </div>
        <div className="admin-resumo-cartao">
          <span className="admin-resumo-icone">
            <IconeCalendario />
          </span>
          <span className="admin-resumo-rotulo">Último atendimento</span>
          <strong className="admin-resumo-valor">
            {ficha.ultimoAtendimento ? new DataAgenda(ficha.ultimoAtendimento).formatar() : "—"}
          </strong>
          <span className="admin-resumo-detalhe">
            {ficha.proximoAgendamento
              ? `Próximo: ${HorarioMarcado.de(ficha.proximoAgendamento).formatar()}`
              : "nenhum horário marcado"}
          </span>
        </div>
      </div>

      <div className="ficha-grade">
        <div className="admin-formulario">
          <h2>Tratamentos mais feitos</h2>
          {ficha.tratamentosMaisFeitos.length === 0 ? (
            <p className="admin-dica">Nenhum atendimento finalizado ainda.</p>
          ) : (
            <ul className="ficha-chips">
              {ficha.tratamentosMaisFeitos.map((tratamento) => (
                <li key={tratamento.nome}>
                  {tratamento.nome} <b>{tratamento.quantidade}×</b>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-formulario">
          <h2>Profissionais que atenderam</h2>
          {ficha.profissionais.length === 0 ? (
            <p className="admin-dica">—</p>
          ) : (
            <ul className="ficha-chips">
              {ficha.profissionais.map((nome) => (
                <li key={nome}>{nome}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="ficha-titulo-historico">
        Histórico{" "}
        <span className="kanban-contador">{ficha.agendamentos.length}</span>
      </h2>
      <ol className="ficha-historico">
        {ficha.agendamentos.map((agendamento) => {
          const etapa = new EtapaAgendamento(agendamento.status);
          return (
            <li key={agendamento.id} className={`ficha-historico-item ${etapa.getClasse()}`}>
              <div className="ficha-historico-topo">
                <strong>{HorarioMarcado.de(agendamento).formatar()}</strong>
                <span className={`ficha-etapa ${etapa.getClasse()}`}>{etapa.getNome()}</span>
              </div>
              <ul className="kanban-cartao-detalhes">
                <li>
                  <IconeBrilho tamanho={14} />
                  {agendamento.tratamentos.map((tratamento) => tratamento.nome).join(", ")}
                </li>
                <li>
                  <IconePessoas tamanho={14} /> {agendamento.profissional.nome}
                </li>
                <li>
                  <IconeDinheiro tamanho={14} />
                  {new Dinheiro(agendamento.valorTotal).formatar()} ·{" "}
                  {new Duracao(agendamento.duracaoTotalMinutos).formatar()}
                </li>
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
