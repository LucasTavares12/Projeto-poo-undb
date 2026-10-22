import { useState } from "react";
import type { FaturamentoDoDia } from "../../services/types";
import { EscalaGrafico } from "../../models/EscalaGrafico";
import { Dinheiro } from "../../models/Dinheiro";
import { DataAgenda } from "../../models/DataAgenda";

interface Props {
  dias: FaturamentoDoDia[];
}

/** Colunas com o faturamento de cada dia do mês; passar o mouse (ou focar) mostra os detalhes. */
export function GraficoFaturamentoDiario({ dias }: Props) {
  const [ativo, setAtivo] = useState<number | null>(null);

  const maiorValor = Math.max(0, ...dias.map((dia) => dia.valor));
  const escala = new EscalaGrafico(maiorValor);
  // Rótulo fixo só no melhor dia; os outros valores ficam na dica e na tabela.
  const indiceMelhorDia = maiorValor > 0 ? dias.findIndex((dia) => dia.valor === maiorValor) : -1;

  const diaAtivo = ativo !== null ? dias[ativo] : null;
  // Perto das bordas a dica abre para dentro do gráfico, senão sai da tela no celular.
  const ladoDaDica =
    ativo === null ? "" : ativo < dias.length / 4 ? "inicio" : ativo >= (dias.length * 3) / 4 ? "fim" : "";

  return (
    <div className="grafico">
      <div className="grafico-eixo-y" aria-hidden="true">
        {escala.getMarcas().map((marca) => (
          <span key={marca} style={{ bottom: `${escala.percentual(marca)}%` }}>
            {new Dinheiro(marca).formatarCompacto()}
          </span>
        ))}
      </div>

      <div className="grafico-area" onMouseLeave={() => setAtivo(null)}>
        {escala.getMarcas().map((marca) => (
          <span
            key={marca}
            className="grafico-grade"
            style={{ bottom: `${escala.percentual(marca)}%` }}
            aria-hidden="true"
          />
        ))}

        <div className="grafico-colunas">
          {dias.map((dia, indice) => {
            const altura = escala.percentual(dia.valor);
            const numeroDia = Number(dia.data.slice(8, 10));
            return (
              <button
                key={dia.data}
                type="button"
                className={`grafico-faixa ${ativo === indice ? "ativa" : ""}`}
                aria-label={`Dia ${numeroDia}: ${new Dinheiro(dia.valor).formatar()}, ${dia.atendimentos} atendimento(s)`}
                onMouseEnter={() => setAtivo(indice)}
                onClick={() => setAtivo(indice)}
                onFocus={() => setAtivo(indice)}
                onBlur={() => setAtivo(null)}
              >
                {dia.valor > 0 && <span className="grafico-coluna" style={{ height: `${altura}%` }} />}
                {indice === indiceMelhorDia && (
                  <span className="grafico-rotulo" style={{ bottom: `${altura}%` }}>
                    {new Dinheiro(dia.valor).formatarCompacto()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {diaAtivo && ativo !== null && (
          <div
            className={`grafico-dica ${ladoDaDica}`}
            style={{
              left: `${((ativo + 0.5) / dias.length) * 100}%`,
              bottom: `${Math.min(escala.percentual(diaAtivo.valor), 78)}%`,
            }}
            role="status"
          >
            <span className="grafico-dica-titulo">
              {new DataAgenda(diaAtivo.data).getDiaDaSemanaCurto()},{" "}
              {new DataAgenda(diaAtivo.data).formatar()}
            </span>
            <strong>{new Dinheiro(diaAtivo.valor).formatar()}</strong>
            <span>
              {diaAtivo.atendimentos === 1
                ? "1 atendimento"
                : `${diaAtivo.atendimentos} atendimentos`}
            </span>
          </div>
        )}
      </div>

      <div className="grafico-eixo-x" aria-hidden="true">
        {dias.map((dia, indice) => {
          const numeroDia = indice + 1;
          // Marca o dia 1, a cada 5 dias e o último dia, para o eixo não ficar poluído.
          // O último dia só aparece se não ficar colado na marca anterior (ex: 30 e 31).
          const ultimoDia = numeroDia === dias.length && numeroDia % 5 > 1;
          const mostrar = numeroDia === 1 || numeroDia % 5 === 0 || ultimoDia;
          return <span key={dia.data}>{mostrar ? numeroDia : ""}</span>;
        })}
      </div>
    </div>
  );
}
