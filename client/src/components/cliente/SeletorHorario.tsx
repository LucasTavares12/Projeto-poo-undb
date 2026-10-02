interface Props {
  horarios: string[];
  selecionado: string | null;
  onSelecionar: (horario: string) => void;
  carregando: boolean;
}

export function SeletorHorario({ horarios, selecionado, onSelecionar, carregando }: Props) {
  if (carregando) {
    return <p>Carregando horários...</p>;
  }

  if (horarios.length === 0) {
    return <p>Nenhum horário disponível para essa combinação. Tente outra data.</p>;
  }

  return (
    <div className="grade-horarios">
      {horarios.map((horario) => (
        <button
          key={horario}
          type="button"
          className={`botao-horario ${selecionado === horario ? "selecionado" : ""}`}
          onClick={() => onSelecionar(horario)}
        >
          {horario}
        </button>
      ))}
    </div>
  );
}
