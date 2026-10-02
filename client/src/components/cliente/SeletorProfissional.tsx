import type { Profissional } from "../../services/types";

interface Props {
  profissionais: Profissional[];
  selecionadoId: number | null;
  onSelecionar: (id: number) => void;
}

export function SeletorProfissional({ profissionais, selecionadoId, onSelecionar }: Props) {
  if (profissionais.length === 0) {
    return <p>Nenhum profissional cadastrado ainda.</p>;
  }

  return (
    <div className="cartoes">
      {profissionais.map((profissional) => (
        <button
          key={profissional.id}
          type="button"
          className={`cartao ${selecionadoId === profissional.id ? "selecionado" : ""}`}
          onClick={() => onSelecionar(profissional.id)}
        >
          <span className="cartao-avatar">{profissional.nome.charAt(0).toUpperCase()}</span>
          <span className="cartao-texto">
            <strong>{profissional.nome}</strong>
            <span>{profissional.especialidade}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
