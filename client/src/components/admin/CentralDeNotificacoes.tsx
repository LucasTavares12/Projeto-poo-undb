import { useEffect, useRef, useState } from "react";
import type { Notificacao, TipoNotificacao } from "../../services/types";
import { TempoDecorrido } from "../../models/TempoDecorrido";
import { AlertaDoNavegador } from "../../models/AlertaDoNavegador";
import {
  IconeAtualizar,
  IconeCalendario,
  IconeConfirmado,
  IconeFechar,
  IconeSino,
} from "../Icones";

interface BotaoProps {
  naoLidas: number;
  aberto: boolean;
  onClick: () => void;
  className?: string;
  /** Mostra "Notificações" ao lado do ícone (barra lateral). */
  comTexto?: boolean;
}

/** O sino com o número de avisos que a conta ainda não fechou. */
export function BotaoSino({
  naoLidas,
  aberto,
  onClick,
  className = "",
  comTexto = false,
}: BotaoProps) {
  const rotulo =
    naoLidas === 0
      ? "Notificações"
      : `Notificações: ${naoLidas} ${naoLidas === 1 ? "pendente" : "pendentes"}`;
  return (
    <button
      type="button"
      className={`sino ${naoLidas > 0 ? "com-novidade" : ""} ${className}`}
      onClick={onClick}
      aria-label={rotulo}
      aria-expanded={aberto}
      aria-haspopup="dialog"
      title={rotulo}
    >
      <IconeSino tamanho={20} />
      {comTexto && <span className="sino-texto">Notificações</span>}
      {naoLidas > 0 && <span className="sino-contador">{naoLidas > 9 ? "9+" : naoLidas}</span>}
    </button>
  );
}

const ICONES: Record<TipoNotificacao, typeof IconeCalendario> = {
  NOVO_AGENDAMENTO: IconeCalendario,
  AGENDAMENTO_REMARCADO: IconeAtualizar,
  AGENDAMENTO_CANCELADO: IconeFechar,
};

/** Um aviso da lista (no modal ou no sino). */
function ItemNotificacao({
  notificacao,
  onClick,
}: {
  notificacao: Notificacao;
  onClick: () => void;
}) {
  const Icone = ICONES[notificacao.tipo];
  return (
    <li>
      <button
        type="button"
        className={`notificacao ${notificacao.tipo.toLowerCase()}`}
        onClick={onClick}
      >
        <span className="notificacao-icone">
          <Icone tamanho={16} />
        </span>
        <span className="notificacao-texto">
          <strong>{notificacao.titulo}</strong>
          <span>{notificacao.mensagem}</span>
          <small>{new TempoDecorrido(notificacao.criadaEm).formatar()}</small>
        </span>
      </button>
    </li>
  );
}

/** Botão para ligar a notificação do sistema (só aparece enquanto a pessoa não respondeu). */
function PedirPermissao() {
  const [podePedir, setPodePedir] = useState(AlertaDoNavegador.podePedirPermissao);

  async function ativarAlertas(): Promise<void> {
    await AlertaDoNavegador.pedirPermissao();
    setPodePedir(AlertaDoNavegador.podePedirPermissao());
  }

  if (!podePedir) {
    return null;
  }
  return (
    <button type="button" className="notificacoes-permissao" onClick={ativarAlertas}>
      <IconeSino tamanho={16} />
      Ativar alertas do navegador para saber de novos agendamentos mesmo com o painel em outra
      aba
    </button>
  );
}

interface ModalProps {
  notificacoes: Notificacao[];
  /** Fechar = a pessoa viu: os avisos saem do sino. */
  onFechar: () => void;
  onVerAgendamentos: () => void;
}

/** De quanto em quanto tempo o som do modal se repete (ms). */
const REPETIR_SOM = 3_000;

/**
 * Modal que abre por cima de qualquer página do painel quando chega agendamento novo.
 * O alerta sonoro fica se repetindo até a pessoa marcar como visto.
 */
export function ModalDeNotificacoes({ notificacoes, onFechar, onVerAgendamentos }: ModalProps) {
  const botaoOk = useRef<HTMLButtonElement>(null);
  const titulo =
    notificacoes.length === 1 ? notificacoes[0].titulo : `${notificacoes.length} novos agendamentos`;

  useEffect(() => {
    botaoOk.current?.focus();
  }, []);

  // Toca ao abrir e repete enquanto o modal estiver na tela (fechar desmonta e para o som).
  useEffect(() => {
    AlertaDoNavegador.tocarSom();
    const repetir = setInterval(AlertaDoNavegador.tocarSom, REPETIR_SOM);
    return () => clearInterval(repetir);
  }, []);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onFechar();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="modal-fundo modal-notificacoes-fundo">
      <div
        className="modal modal-notificacoes"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-notificacoes-titulo"
      >
        <header className="modal-cabecalho">
          <span className="modal-notificacoes-sino" aria-hidden="true">
            <IconeSino tamanho={22} />
          </span>
          <h2 id="modal-notificacoes-titulo">{titulo}</h2>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <IconeFechar tamanho={18} />
          </button>
        </header>

        <div className="modal-corpo">
          <ul className="notificacoes-lista">
            {notificacoes.map((notificacao) => (
              <ItemNotificacao
                key={notificacao.id}
                notificacao={notificacao}
                onClick={onVerAgendamentos}
              />
            ))}
          </ul>
          <PedirPermissao />
        </div>

        <footer className="modal-rodape">
          <button type="button" className="admin-botao" onClick={onVerAgendamentos}>
            Ver agendamentos
          </button>
          <button
            type="button"
            className="admin-botao principal modal-notificacoes-confirmar"
            onClick={onFechar}
            ref={botaoOk}
          >
            <IconeConfirmado tamanho={16} />
            Marcar como visto
          </button>
        </footer>
      </div>
    </div>
  );
}

interface PainelProps {
  notificacoes: Notificacao[];
  onFechar: () => void;
  onAbrirAgendamentos: () => void;
}

/** Lista que abre ao clicar no sino: remarcações e cancelamentos ainda não vistos. */
export function PainelDeNotificacoes({ notificacoes, onFechar, onAbrirAgendamentos }: PainelProps) {
  const painel = useRef<HTMLDivElement>(null);

  // Fecha com Esc ou clicando fora (o próprio botão do sino alterna sozinho).
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onFechar();
      }
    };
    const aoClicar = (evento: MouseEvent) => {
      const alvo = evento.target as HTMLElement;
      if (!painel.current?.contains(alvo) && !alvo.closest(".sino")) {
        onFechar();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicar);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicar);
    };
  }, [onFechar]);

  return (
    <div ref={painel} className="notificacoes" role="dialog" aria-label="Notificações">
      <header className="notificacoes-topo">
        <h2>Notificações</h2>
        <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
          <IconeFechar tamanho={18} />
        </button>
      </header>

      <PedirPermissao />

      {notificacoes.length === 0 ? (
        <p className="notificacoes-vazio">
          Nenhuma notificação pendente. Remarcações e cancelamentos aparecem aqui; agendamentos
          novos abrem um aviso na tela.
        </p>
      ) : (
        <ul className="notificacoes-lista">
          {notificacoes.map((notificacao) => (
            <ItemNotificacao
              key={notificacao.id}
              notificacao={notificacao}
              onClick={onAbrirAgendamentos}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
