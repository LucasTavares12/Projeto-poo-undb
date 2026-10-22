import { PeriodoDoDia } from "../../models/PeriodoDoDia";

interface Props {
  horarios: string[];
  selecionado: string | null;
  onSelecionar: (horario: string) => void;
  carregando: boolean;
}

export function SeletorHorario({ horarios, selecionado, onSelecionar, carregando }: Props) {
  if (carregando) {
    return (
      <div className="grade-horarios carregando" aria-busy="true" aria-label="Carregando horários">
        {Array.from({ length: 8 }, (_, indice) => (
          <span key={indice} className="botao-horario esqueleto" />
        ))}
      </div>
    );
  }

  if (horarios.length === 0) {
    return (
      <p className="aviso-vazio">Nenhum horário disponível para essa combinação. Tente outra data.</p>
    );
  }

  const grupos = PeriodoDoDia.agrupar(horarios);

  return (
    <div className="periodos-horarios">
      {grupos.map((grupo) => (
        <section key={grupo.nome} className="periodo-horarios">
          <h4>
            {grupo.nome} <span>{grupo.horarios.length}</span>
          </h4>
          <div className="grade-horarios">
            {grupo.horarios.map((horario) => (
              <button
                key={horario}
                type="button"
                className={`botao-horario ${selecionado === horario ? "selecionado" : ""}`}
                aria-pressed={selecionado === horario}
                onClick={() => onSelecionar(horario)}
              >
                {horario}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
