import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProfissionalService } from "../../services/ProfissionalService";
import { HorarioDisponivelService } from "../../services/HorarioDisponivelService";
import type { HorarioDisponivel, Profissional } from "../../services/types";
import { GradeSemanal } from "../../models/GradeSemanal";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";

const profissionalService = new ProfissionalService();
const horarioService = new HorarioDisponivelService();

const grade = new GradeSemanal();

export function HorariosPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [profissionalId, setProfissionalId] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarHorarios(id: number): Promise<void> {
    try {
      setHorarios(await horarioService.listarPorProfissional(id));
    } catch {
      setErro("Não foi possível carregar os horários deste profissional.");
    }
  }

  useEffect(() => {
    async function carregar() {
      try {
        const lista = await profissionalService.listar();
        setProfissionais(lista);
        if (lista.length > 0) {
          setProfissionalId(lista[0].id);
          await carregarHorarios(lista[0].id);
        }
      } catch {
        setErro("Não foi possível carregar os profissionais.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const horariosPorChave = useMemo(
    () =>
      new Map(
        horarios.map((horario) => [
          GradeSemanal.chave(horario.diaSemana, horario.horaInicio),
          horario,
        ])
      ),
    [horarios]
  );

  // Inclui horários já liberados que estejam fora da grade padrão, para nunca escondê-los.
  const linhas = useMemo(
    () => grade.getHoras(horarios.map((horario) => horario.horaInicio)),
    [horarios]
  );

  async function selecionarProfissional(id: number): Promise<void> {
    setProfissionalId(id);
    setHorarios([]);
    setErro(null);
    await carregarHorarios(id);
  }

  async function alternarHorario(diaSemana: number, horaInicio: string): Promise<void> {
    if (profissionalId === null) {
      return;
    }

    const chaveCelula = GradeSemanal.chave(diaSemana, horaInicio);
    if (processando.includes(chaveCelula)) {
      return;
    }

    const existente = horariosPorChave.get(chaveCelula);

    setProcessando((atual) => [...atual, chaveCelula]);
    setErro(null);
    try {
      if (existente) {
        await horarioService.remover(existente.id);
        setHorarios((atual) => atual.filter((horario) => horario.id !== existente.id));
      } else {
        const criado = await horarioService.criar({ profissionalId, diaSemana, horaInicio });
        setHorarios((atual) => [...atual, criado]);
      }
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setProcessando((atual) => atual.filter((item) => item !== chaveCelula));
    }
  }

  if (carregando) {
    return (
      <section className="pagina">
        <CabecalhoPagina
          titulo="Horários disponíveis"
          descricao="Defina em quais dias e horários cada profissional atende."
        />
        <p>Carregando...</p>
      </section>
    );
  }

  return (
    <section className="pagina">
      <CabecalhoPagina
        titulo="Horários disponíveis"
        descricao="Defina em quais dias e horários cada profissional atende."
      />

      {erro && <p className="mensagem-erro">{erro}</p>}

      {profissionais.length === 0 ? (
        <p>
          Cadastre um <Link to="/admin/profissionais">profissional</Link> antes de liberar os
          horários.
        </p>
      ) : (
        <>
          <div className="admin-formulario">
            <div className="admin-campos">
              <label>
                Profissional
                <select
                  value={profissionalId ?? ""}
                  onChange={(evento) => selecionarProfissional(Number(evento.target.value))}
                >
                  {profissionais.map((profissional) => (
                    <option key={profissional.id} value={profissional.id}>
                      {profissional.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="admin-dica">
              Clique em um horário para liberá-lo ou bloqueá-lo. Os horários marcados se repetem
              toda semana e são os que aparecem para o cliente agendar.
            </p>
          </div>

          <table className="admin-grade">
            <thead>
              <tr>
                <th />
                {GradeSemanal.DIAS.map((dia) => (
                  <th key={dia.numero}>{dia.nome}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((horaInicio) => (
                <tr key={horaInicio}>
                  <th>{horaInicio}</th>
                  {GradeSemanal.DIAS.map((dia) => {
                    const chaveCelula = GradeSemanal.chave(dia.numero, horaInicio);
                    const liberado = horariosPorChave.has(chaveCelula);
                    return (
                      <td key={dia.numero}>
                        <button
                          type="button"
                          className={`admin-grade-celula ${liberado ? "liberado" : ""}`}
                          aria-pressed={liberado}
                          aria-label={`${dia.nome} ${horaInicio}`}
                          disabled={processando.includes(chaveCelula)}
                          onClick={() => alternarHorario(dia.numero, horaInicio)}
                        >
                          {liberado ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
