import { AgendamentoService } from "../../services/AgendamentoService";
import type { Agendamento } from "../../services/types";
import { MensagemWhatsApp } from "../../models/MensagemWhatsApp";
import type { TipoMensagem } from "../../models/MensagemWhatsApp";
import { IconeConfirmado, IconeWhatsApp } from "../Icones";

const agendamentoService = new AgendamentoService();

interface Props {
  agendamento: Agendamento;
  tipo: TipoMensagem;
  onRegistrado: (atualizado: Agendamento) => void;
  onErro: (mensagem: string) => void;
}

const TEXTOS: Record<TipoMensagem, { acao: string; enviado: string; dica: string }> = {
  LEMBRETE: {
    acao: "Enviar lembrete",
    enviado: "Lembrete enviado",
    dica: "Abre o WhatsApp do cliente com o lembrete do horário já escrito",
  },
  AGRADECIMENTO: {
    acao: "Agradecer",
    enviado: "Agradecimento enviado",
    dica: "Abre o WhatsApp do cliente com uma mensagem de agradecimento já escrita",
  },
};

/**
 * Abre a conversa do cliente no WhatsApp com a mensagem pronta e anota o envio no
 * agendamento, para a equipe ver no card que aquele cliente já recebeu a mensagem.
 */
export function BotaoWhatsApp({ agendamento, tipo, onRegistrado, onErro }: Props) {
  const mensagem = new MensagemWhatsApp(tipo, agendamento);
  const enviadaEm = mensagem.getEnviadaEm();
  const textos = TEXTOS[tipo];

  // O link abre normalmente (é um <a>); a anotação vai para o servidor em paralelo.
  function registrar(): void {
    agendamentoService
      .registrarMensagem(agendamento.id, tipo)
      .then(onRegistrado)
      .catch((erro: Error) => onErro(erro.message));
  }

  const link = (
    <a
      href={mensagem.getLink()}
      target="_blank"
      rel="noreferrer"
      draggable={false}
      title={textos.dica}
      className={enviadaEm ? "whatsapp-reenviar" : "whatsapp-acao"}
      onClick={registrar}
    >
      {enviadaEm ? (
        "Reenviar"
      ) : (
        <>
          <IconeWhatsApp tamanho={16} /> {textos.acao}
        </>
      )}
    </a>
  );

  return (
    <div className={`whatsapp-linha ${enviadaEm ? "enviada" : ""}`}>
      {enviadaEm ? (
        <>
          <span className="whatsapp-enviada">
            <IconeConfirmado tamanho={14} /> {textos.enviado}{" "}
            {MensagemWhatsApp.descreverEnvio(enviadaEm)}
          </span>
          {link}
        </>
      ) : (
        link
      )}
    </div>
  );
}
