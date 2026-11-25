import type { Profissional } from "../../services/types";
import { IconeCheck } from "../Icones";

interface Props {
  profissionais: Profissional[];
  selecionadoId: number | null;
  onSelecionar: (id: number) => void;
}

export function SeletorProfissional({ profissionais, selecionadoId, onSelecionar }: Props) {
  if (profissionais.length === 0) {
    return <p className="aviso-vazio">Nenhum profissional cadastrado ainda.</p>;
  }

  return (
    <div className="cartoes" role="radiogroup" aria-label="Profissional">
      {profissionais.map((profissional) => {
        const selecionado = selecionadoId === profissional.id;
        return (
          <button
            key={profissional.id}
            type="button"
            role="radio"
            aria-checked={selecionado}
            className={`cartao ${selecionado ? "selecionado" : ""}`}
            onClick={() => onSelecionar(profissional.id)}
          >
            <span className="cartao-avatar">{profissional.nome.charAt(0).toUpperCase()}</span>
            <span className="cartao-texto">
              <strong>{profissional.nome}</strong>
              {profissional.especialidade && <span>{profissional.especialidade}</span>}
            </span>
            <span className="marca-selecao" aria-hidden="true">
              <IconeCheck tamanho={14} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
