import { DataAgenda } from "../../models/DataAgenda";

interface Props {
  data: string;
  onSelecionar: (data: string) => void;
}

/** Quantos dias aparecem na faixa de escolha rápida (a partir de hoje). */
const DIAS_RAPIDOS = 14;

/** Faixa com os próximos dias para tocar e escolher; outras datas pelo calendário. */
export function SeletorData({ data, onSelecionar }: Props) {
  const hoje = DataAgenda.hoje();
  const dias = Array.from({ length: DIAS_RAPIDOS }, (_, indice) => hoje.somarDias(indice));
  const foraDaFaixa = data !== "" && !dias.some((dia) => dia.toString() === data);

  return (
    <div className="seletor-data">
      <div className="faixa-dias" role="group" aria-label="Próximos dias">
        {dias.map((dia, indice) => {
          const selecionado = dia.toString() === data;
          return (
            <button
              key={dia.toString()}
              type="button"
              className={`dia-rapido ${selecionado ? "selecionado" : ""}`}
              aria-pressed={selecionado}
              aria-label={dia.formatarPorExtenso()}
              onClick={() => onSelecionar(dia.toString())}
            >
              <span className="dia-rapido-semana">
                {indice === 0 ? "Hoje" : indice === 1 ? "Amanhã" : dia.getDiaDaSemanaCurto()}
              </span>
              <strong>{dia.getDia()}</strong>
              <span className="dia-rapido-mes">{dia.getMesCurto()}</span>
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

      {data !== "" && (
        <p className="data-escolhida">
          Data escolhida: <strong>{new DataAgenda(data).formatarPorExtenso()}</strong>
        </p>
      )}
    </div>
  );
}
