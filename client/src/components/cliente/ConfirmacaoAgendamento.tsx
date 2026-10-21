import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";
import { ResumoAgendamento } from "./ResumoAgendamento";

interface Props {
  resumo: ComponentProps<typeof ResumoAgendamento>;
  clienteNome: string;
  clienteTelefone: string;
  enviando: boolean;
  erro: string | null;
  onRevisar: () => void;
  onConfirmar: () => void;
}

/** Última conferência antes de gravar o agendamento: mostra tudo e pede a confirmação. */
export function ConfirmacaoAgendamento({
  resumo,
  clienteNome,
  clienteTelefone,
  enviando,
  erro,
  onRevisar,
  onConfirmar,
}: Props) {
  const botaoConfirmar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botaoConfirmar.current?.focus();
    // Com a janela aberta, a página de trás não rola e o Esc volta para revisar.
    const fecharComEsc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !enviando) {
        onRevisar();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", fecharComEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [enviando, onRevisar]);

  return (
    <div className="confirmacao-fundo" onMouseDown={enviando ? undefined : onRevisar}>
      <div
        className="confirmacao"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        aria-describedby="confirmacao-descricao"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="confirmacao-cabecalho">
          <h2 id="confirmacao-titulo">Está tudo certo?</h2>
          <p id="confirmacao-descricao">
            Confira as informações do seu agendamento antes de confirmar.
          </p>
        </header>

        <div className="confirmacao-corpo">
          {erro && <p className="mensagem-erro">{erro}</p>}

          <ResumoAgendamento {...resumo} />

          <dl className="confirmacao-cliente">
            <div>
              <dt>Nome</dt>
              <dd>{clienteNome.trim()}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{clienteTelefone}</dd>
            </div>
          </dl>
        </div>

        <footer className="confirmacao-rodape">
          <button type="button" className="botao-contorno" onClick={onRevisar} disabled={enviando}>
            Não, quero revisar
          </button>
          <button
            ref={botaoConfirmar}
            type="button"
            className="botao-primario"
            onClick={onConfirmar}
            disabled={enviando}
          >
            {enviando ? "Agendando..." : "Sim, confirmar agendamento"}
          </button>
        </footer>
      </div>
    </div>
  );
}
