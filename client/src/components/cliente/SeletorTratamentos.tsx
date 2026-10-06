import type { Tratamento } from "../../services/types";
import { Dinheiro } from "../../models/Dinheiro";

interface Props {
  tratamentos: Tratamento[];
  selecionadosIds: number[];
  onAlternar: (id: number) => void;
}

export function SeletorTratamentos({ tratamentos, selecionadosIds, onAlternar }: Props) {
  if (tratamentos.length === 0) {
    return <p>Nenhum tratamento cadastrado ainda.</p>;
  }

  return (
    <div className="lista-tratamentos">
      {tratamentos.map((tratamento) => {
        const selecionado = selecionadosIds.includes(tratamento.id);
        return (
          <label
            key={tratamento.id}
            className={`item-tratamento ${selecionado ? "selecionado" : ""}`}
          >
            <input
              type="checkbox"
              checked={selecionado}
              onChange={() => onAlternar(tratamento.id)}
            />
            <div className="item-tratamento-descricao">
              <strong>{tratamento.nome}</strong>
              <p>{tratamento.descricao}</p>
            </div>
            <div className="item-tratamento-info">
              <span>{tratamento.duracaoMinutos} min</span>
              <span>{new Dinheiro(tratamento.valor).formatar()}</span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
