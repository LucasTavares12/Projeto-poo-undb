import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { DataAgenda } from "../../models/DataAgenda";
import { IconeSetaBaixo, IconeSetaCima } from "../Icones";

interface Props {
  data: string;
  onSelecionar: (data: string) => void;
  /** Dias em que o profissional não atende (folga, férias, feriado). */
  estaBloqueada: (data: string) => boolean;
}

/** Quantos dias aparecem na lista (a partir de hoje). */
const DIAS_NA_LISTA = 60;

/** Quanto a lista anda ao tocar numa setinha (px). */
const PASSO_DA_SETA = 220;

/**
 * Lista vertical com os próximos dias, um embaixo do outro, separados por mês: o cliente
 * rola para cima/para baixo e toca no dia. As setinhas mostram que há mais datas e também
 * rolam a lista.
 */
export function SeletorData({ data, onSelecionar, estaBloqueada }: Props) {
  const hoje = DataAgenda.hoje();
  const dias = Array.from({ length: DIAS_NA_LISTA }, (_, indice) => hoje.somarDias(indice));

  const lista = useRef<HTMLDivElement>(null);
  const [temAcima, setTemAcima] = useState(false);
  const [temAbaixo, setTemAbaixo] = useState(true);

  const conferirRolagem = useCallback(() => {
    const elemento = lista.current;
    if (!elemento) {
      return;
    }
    setTemAcima(elemento.scrollTop > 4);
    setTemAbaixo(elemento.scrollTop + elemento.clientHeight < elemento.scrollHeight - 4);
  }, []);

  // Ao abrir (ou voltar para a etapa), mostra o dia já escolhido.
  useEffect(() => {
    const elemento = lista.current;
    const escolhido = elemento?.querySelector<HTMLElement>(".dia-lista.selecionado");
    if (elemento && escolhido) {
      elemento.scrollTop = escolhido.offsetTop - elemento.clientHeight / 2 + escolhido.clientHeight / 2;
    }
    conferirRolagem();
    // Só na montagem: depois o cliente rola como quiser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rolar(direcao: -1 | 1): void {
    lista.current?.scrollBy({ top: direcao * PASSO_DA_SETA, behavior: "smooth" });
  }

  return (
    <div className="seletor-data">
      <div className="lista-dias-moldura">
        <button
          type="button"
          className={`lista-dias-seta acima ${temAcima ? "visivel" : ""}`}
          aria-label="Ver datas anteriores"
          tabIndex={temAcima ? 0 : -1}
          onClick={() => rolar(-1)}
        >
          <IconeSetaCima tamanho={18} />
        </button>

        <div
          ref={lista}
          className="lista-dias"
          role="group"
          aria-label="Próximos dias"
          onScroll={conferirRolagem}
        >
          {dias.map((dia, indice) => {
            const selecionado = dia.toString() === data;
            const fechado = estaBloqueada(dia.toString());
            const comecaMes = indice === 0 || dia.getDia() === 1;
            const etiqueta = indice === 0 ? "Hoje" : indice === 1 ? "Amanhã" : null;
            return (
              <Fragment key={dia.toString()}>
                {comecaMes && <p className="lista-dias-mes">{dia.getNomeDoMes()}</p>}
                <button
                  type="button"
                  className={`dia-lista ${selecionado ? "selecionado" : ""} ${fechado ? "fechado" : ""}`}
                  aria-pressed={selecionado}
                  aria-label={`${dia.formatarPorExtenso()}${fechado ? " (sem atendimento)" : ""}`}
                  disabled={fechado}
                  title={fechado ? "Sem atendimento neste dia" : undefined}
                  onClick={() => onSelecionar(dia.toString())}
                >
                  <span className="dia-lista-numero">
                    <strong>{dia.getDia()}</strong>
                    <small>{dia.getMesCurto()}</small>
                  </span>
                  <span className="dia-lista-semana">{dia.getDiaDaSemana()}</span>
                  {fechado ? (
                    <span className="dia-lista-etiqueta fechado">Fechado</span>
                  ) : (
                    etiqueta && <span className="dia-lista-etiqueta">{etiqueta}</span>
                  )}
                </button>
              </Fragment>
            );
          })}
        </div>

        <button
          type="button"
          className={`lista-dias-seta abaixo ${temAbaixo ? "visivel" : ""}`}
          aria-label="Ver mais datas"
          tabIndex={temAbaixo ? 0 : -1}
          onClick={() => rolar(1)}
        >
          <IconeSetaBaixo tamanho={18} />
        </button>
      </div>
      <p className="lista-dias-dica">Role para cima ou para baixo para ver mais datas.</p>

      {data !== "" &&
        (estaBloqueada(data) ? (
          <p className="data-fechada" role="alert">
            Não há atendimento em <strong>{new DataAgenda(data).formatarPorExtenso()}</strong>.
            Escolha outro dia.
          </p>
        ) : (
          <p className="data-escolhida">
            Data escolhida: <strong>{new DataAgenda(data).formatarPorExtenso()}</strong>
          </p>
        ))}
    </div>
  );
}
