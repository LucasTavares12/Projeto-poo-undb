import { useEffect, useId, useState } from "react";
import type { Configuracoes } from "../../services/types";
import { HorarioDeFuncionamento } from "../../models/HorarioDeFuncionamento";
import { ContatosDaClinica } from "../../models/ContatosDaClinica";
import {
  IconeInstagram,
  IconeMapa,
  IconeSetaBaixo,
  IconeWhatsApp,
} from "../Icones";

interface Props {
  configuracoes: Configuracoes;
}

/** De quanto em quanto tempo o "aberto/fechado" é recalculado. */
const ATUALIZAR_A_CADA_MS = 30_000;

/**
 * Cartão da tela inicial do cliente: se a clínica está aberta agora (com os horários da
 * semana numa lista que abre pela setinha), o endereço e os botões de WhatsApp, Instagram
 * e mapa. Só aparece o que a clínica preencheu. É só informativo: pelo site dá para
 * agendar a qualquer hora.
 */
export function InfoDaClinica({ configuracoes }: Props) {
  const funcionamento = HorarioDeFuncionamento.de(
    configuracoes.horarioFuncionamento,
  );
  const contatos = new ContatosDaClinica(configuracoes);
  const [agora, setAgora] = useState(() => new Date());
  const [horariosAbertos, setHorariosAbertos] = useState(false);
  const idDaLista = useId();

  useEffect(() => {
    const intervalo = window.setInterval(
      () => setAgora(new Date()),
      ATUALIZAR_A_CADA_MS,
    );
    return () => window.clearInterval(intervalo);
  }, []);

  if (!funcionamento && !contatos.temAlgum()) {
    return null;
  }

  const situacao = funcionamento?.situacao(agora);
  const endereco = contatos.getEndereco();
  const linkMapa = contatos.linkMapa();
  const linkWhatsApp = contatos.linkWhatsApp();
  const linkInstagram = contatos.linkInstagram();

  return (
    <section className="clinica-info" aria-label="Informações da clínica">
      {funcionamento && situacao && (
        <div className="clinica-funcionamento">
          <button
            type="button"
            className={`clinica-status ${situacao.aberto ? "aberto" : "fechado"}`}
            aria-expanded={horariosAbertos}
            aria-controls={idDaLista}
            onClick={() => setHorariosAbertos((aberto) => !aberto)}
          >
            <span className="clinica-status-ponto" aria-hidden="true" />
            <strong>
              {situacao.aberto ? "Aberto agora" : "Fechado agora"}
            </strong>
            {situacao.detalhe && (
              <span className="clinica-status-detalhe">{situacao.detalhe}</span>
            )}
            <span className="clinica-status-seta" aria-hidden="true">
              <IconeSetaBaixo tamanho={16} />
            </span>
            <span className="visualmente-oculto">
              {horariosAbertos
                ? "Esconder os horários"
                : "Ver os dias e horários"}
            </span>
          </button>

          <div
            id={idDaLista}
            className={`clinica-horarios ${horariosAbertos ? "aberta" : ""}`}
          >
            <ul>
              {funcionamento.linhasDaSemana(agora).map((linha) => (
                <li
                  key={linha.dia.numero}
                  className={`${linha.hoje ? "hoje" : ""} ${linha.aberto ? "" : "fechado"}`}
                >
                  <span>
                    {linha.dia.nome}
                    {linha.hoje && <small>hoje</small>}
                  </span>
                  <span>{linha.texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Endereço à esquerda e os ícones de contato ao lado, na mesma linha. */}
      {(endereco || linkWhatsApp || linkInstagram || linkMapa) && (
        <div className="clinica-local">
          {endereco && linkMapa && (
            <a
              className="clinica-endereco"
              href={linkMapa}
              target="_blank"
              rel="noreferrer"
            >
              <IconeMapa tamanho={15} />
              <span>{endereco}</span>
            </a>
          )}

          {(linkWhatsApp || linkInstagram || linkMapa) && (
            <div className="clinica-contatos">
              {linkWhatsApp && (
                <a
                  className="clinica-contato whatsapp"
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noreferrer"
                  title={`WhatsApp ${contatos.whatsappFormatado() ?? ""}`.trim()}
                  aria-label="Falar no WhatsApp"
                >
                  <IconeWhatsApp tamanho={15} />
                </a>
              )}
              {linkInstagram && (
                <a
                  className="clinica-contato instagram"
                  href={linkInstagram}
                  target="_blank"
                  rel="noreferrer"
                  title={`Instagram ${contatos.instagramComArroba() ?? ""}`.trim()}
                  aria-label="Abrir o Instagram"
                >
                  <IconeInstagram tamanho={15} />
                </a>
              )}
              {linkMapa && (
                <a
                  className="clinica-contato mapa"
                  href={linkMapa}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir no Google Maps"
                  aria-label="Abrir a localização no Google Maps"
                >
                  <IconeMapa tamanho={15} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
