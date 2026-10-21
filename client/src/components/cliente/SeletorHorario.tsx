interface Props {
  horarios: string[];
  selecionado: string | null;
  onSelecionar: (horario: string) => void;
  carregando: boolean;
}

// Períodos do dia: separar os horários deixa a lista mais fácil de percorrer no celular.
const PERIODOS = [
  { nome: "Manhã", ate: "12:00" },
  { nome: "Tarde", ate: "18:00" },
  { nome: "Noite", ate: "24:00" },
];

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

  // "HH:MM" compara certo como texto.
  const grupos = PERIODOS.map((periodo, indice) => ({
    nome: periodo.nome,
    horarios: horarios.filter(
      (horario) => horario < periodo.ate && (indice === 0 || horario >= PERIODOS[indice - 1].ate)
    ),
  })).filter((grupo) => grupo.horarios.length > 0);

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
