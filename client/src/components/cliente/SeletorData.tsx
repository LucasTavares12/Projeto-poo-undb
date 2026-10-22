import { DataAgenda } from "../../models/DataAgenda";

interface Props {
  data: string;
  onSelecionar: (data: string) => void;
  /** Dias em que o profissional não atende (folga, férias, feriado). */
  estaBloqueada: (data: string) => boolean;
}

/** Quantos dias aparecem na faixa de escolha rápida (a partir de hoje). */
const DIAS_RAPIDOS = 14;

/** Faixa com os próximos dias para tocar e escolher; outras datas pelo calendário. */
export function SeletorData({ data, onSelecionar, estaBloqueada }: Props) {
  const hoje = DataAgenda.hoje();
  const dias = Array.from({ length: DIAS_RAPIDOS }, (_, indice) => hoje.somarDias(indice));
  const foraDaFaixa = data !== "" && !dias.some((dia) => dia.toString() === data);

  return (
    <div className="seletor-data">
      <div className="faixa-dias" role="group" aria-label="Próximos dias">
        {dias.map((dia, indice) => {
          const selecionado = dia.toString() === data;
          const fechado = estaBloqueada(dia.toString());
          return (
            <button
              key={dia.toString()}
              type="button"
              className={`dia-rapido ${selecionado ? "selecionado" : ""} ${fechado ? "fechado" : ""}`}
              aria-pressed={selecionado}
              aria-label={`${dia.formatarPorExtenso()}${fechado ? " (sem atendimento)" : ""}`}
              disabled={fechado}
              title={fechado ? "Sem atendimento neste dia" : undefined}
              onClick={() => onSelecionar(dia.toString())}
            >
              <span className="dia-rapido-semana">
                {indice === 0 ? "Hoje" : indice === 1 ? "Amanhã" : dia.getDiaDaSemanaCurto()}
              </span>
              <strong>{dia.getDia()}</strong>
              <span className="dia-rapido-mes">{fechado ? "fechado" : dia.getMesCurto()}</span>
            </button>
          );
        })}
      </div>

      <label className={`campo-rotulo outra-data ${foraDaFaixa ? "ativa" : ""}`}>
        <span>Ou escolha outra data no calendário</span>
        <input
          type="date"
          className="campo"
          min={hoje.toString()}
          value={data}
          onChange={(evento) => onSelecionar(evento.target.value)}
        />
      </label>

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
