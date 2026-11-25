import type { Tratamento } from "../../services/types";
import { Dinheiro } from "../../models/Dinheiro";
import { Duracao } from "../../models/Duracao";
import { IconeCheck } from "../Icones";

interface Props {
  tratamentos: Tratamento[];
  selecionadosIds: number[];
  onAlternar: (id: number) => void;
}

/** Lista de serviços para marcar (dá para escolher mais de um). */
export function SeletorTratamentos({ tratamentos, selecionadosIds, onAlternar }: Props) {
  if (tratamentos.length === 0) {
    return <p className="aviso-vazio">Nenhum serviço cadastrado ainda.</p>;
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
              className="visualmente-oculto"
              checked={selecionado}
              onChange={() => onAlternar(tratamento.id)}
            />
            <span className="marca-selecao quadrada" aria-hidden="true">
              <IconeCheck tamanho={14} />
            </span>
            <span className="item-tratamento-descricao">
              <strong>{tratamento.nome}</strong>
              {tratamento.descricao && <small>{tratamento.descricao}</small>}
            </span>
            <span className="item-tratamento-info">
              <strong>{new Dinheiro(tratamento.valor).formatar()}</strong>
              <span>{new Duracao(tratamento.duracaoMinutos).formatar()}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
