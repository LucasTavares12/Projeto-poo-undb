export interface ItemRanking {
  chave: number;
  nome: string;
  /** Valor que define o tamanho da barra. */
  medida: number;
  /** Texto em destaque à direita (ex: "14×", "R$ 535,00"). */
  rotulo: string;
  /** Texto secundário ao lado do rótulo. */
  detalhe: string;
}

interface Props {
  itens: ItemRanking[];
  limite?: number;
  /** Quando informado, cada linha vira um botão (ex: filtrar por aquele profissional). */
  onSelecionar?: (chave: number) => void;
  dicaSelecionar?: string;
}

/** Ranking em barras horizontais, do maior para o menor (os itens já chegam ordenados). */
export function GraficoRanking({ itens, limite = 8, onSelecionar, dicaSelecionar }: Props) {
  const exibidos = itens.slice(0, limite);
  const restantes = itens.length - exibidos.length;
  const maior = Math.max(1, ...exibidos.map((item) => item.medida));

  return (
    <>
      <ol className="ranking">
        {exibidos.map((item, indice) => {
          const conteudo = (
            <>
              <span className="ranking-posicao">{indice + 1}</span>
              <span className="ranking-nome" title={item.nome}>
                {item.nome}
              </span>
              <span className="ranking-trilha" aria-hidden="true">
                <span
                  className="ranking-barra"
                  style={{ width: `${(item.medida / maior) * 100}%` }}
                />
              </span>
              <span className="ranking-valor">
                <strong>{item.rotulo}</strong>
                <span>{item.detalhe}</span>
              </span>
            </>
          );

          return (
            <li key={item.chave}>
              {onSelecionar ? (
                <button
                  type="button"
                  className="ranking-item clicavel"
                  onClick={() => onSelecionar(item.chave)}
                  title={dicaSelecionar}
                >
                  {conteudo}
                </button>
              ) : (
                <div className="ranking-item">{conteudo}</div>
              )}
            </li>
          );
        })}
      </ol>
      {restantes > 0 && <p className="ranking-restantes">+ {restantes} outros</p>}
    </>
  );
}
