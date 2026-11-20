import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";
import { ResumoAgendamento } from "./ResumoAgendamento";
import type { QuemAgenda } from "../../models/QuemAgenda";

interface Props {
  resumo: ComponentProps<typeof ResumoAgendamento>;
  /** Quem vai ser atendido, quem está marcando e o telefone. */
  quemAgenda: QuemAgenda;
  enviando: boolean;
  erro: string | null;
  onRevisar: () => void;
  onConfirmar: () => void;
}

/** Última conferência antes de gravar o agendamento: mostra tudo e pede a confirmação. */
export function ConfirmacaoAgendamento({
  resumo,
  quemAgenda,
  enviando,
  erro,
  onRevisar,
  onConfirmar,
}: Props) {
  const botaoConfirmar = useRef<HTMLButtonElement>(null);
  const dados = quemAgenda.paraEnvio();
  const paraOutraPessoa = quemAgenda.ehParaOutraPessoa();

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
              <dt>{paraOutraPessoa ? "Quem vai ser atendido" : "Nome"}</dt>
              <dd>{dados.clienteNome}</dd>
            </div>
            {paraOutraPessoa && (
              <div>
                <dt>Agendado por</dt>
                <dd>{dados.responsavelNome}</dd>
              </div>
            )}
            <div>
              <dt>{paraOutraPessoa ? "Seu telefone" : "Telefone"}</dt>
              <dd>{dados.clienteTelefone}</dd>
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
