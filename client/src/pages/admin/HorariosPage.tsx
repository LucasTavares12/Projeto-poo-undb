import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProfissionalService } from "../../services/ProfissionalService";
import { HorarioDisponivelService } from "../../services/HorarioDisponivelService";
import type { HorarioDisponivel, Profissional } from "../../services/types";
import { GradeSemanal } from "../../models/GradeSemanal";
import { useUsuarioLogado } from "../../hooks/useUsuarioLogado";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { PerfilDeAcesso } from "../../models/PerfilDeAcesso";
import { HorarioDeFuncionamento } from "../../models/HorarioDeFuncionamento";
import { EditorDeFuncionamento } from "../../components/admin/EditorDeFuncionamento";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";

const profissionalService = new ProfissionalService();
const horarioService = new HorarioDisponivelService();

const grade = new GradeSemanal();

export function HorariosPage() {
  const perfil = new PerfilDeAcesso(useUsuarioLogado());
  // Na gestão, o profissional administrador age como acesso total.
  const proprioId = perfil.naGestao().getProfissionalId();
  // Funcionamento da clínica: limita a grade (null = ainda não definido, sem limite).
  const configuracoes = useConfiguracoes();
  const funcionamentoSalvo = configuracoes?.horarioFuncionamento ?? null;
  const funcionamento = useMemo(
    () => HorarioDeFuncionamento.de(funcionamentoSalvo),
    [funcionamentoSalvo]
  );
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
        // Conta ligada a um profissional: só a agenda dele.
        const visiveis =
          new PerfilDeAcesso({ profissionalId: proprioId }).filtrarProfissionais(lista);
        setProfissionais(visiveis);
        if (visiveis.length > 0) {
          setProfissionalId(visiveis[0].id);
          await carregarHorarios(visiveis[0].id);
        }
      } catch {
        setErro("Não foi possível carregar os profissionais.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [proprioId]);

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

  // Com o funcionamento definido, as linhas vão da abertura ao fechamento. Horários já
  // liberados fora dele também aparecem (marcados), para poderem ser removidos.
  const linhas = useMemo(() => {
    const liberados = horarios.map((horario) => horario.horaInicio);
    return funcionamento
      ? GradeSemanal.unir(funcionamento.horasDaGrade(), liberados)
      : grade.getHoras(liberados);
  }, [horarios, funcionamento]);

  const foraDoFuncionamento = funcionamento
    ? horarios.filter((horario) => !funcionamento.permite(horario.diaSemana, horario.horaInicio)).length
    : 0;

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

      {configuracoes && (
        <EditorDeFuncionamento salvo={funcionamentoSalvo} podeEditar={perfil.administraClinica()} />
      )}

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
              {funcionamento && " Só dá para liberar horários dentro do funcionamento da clínica."}
            </p>
            {foraDoFuncionamento > 0 && (
              <p className="admin-dica grade-aviso-fora">
                {foraDoFuncionamento === 1
                  ? "1 horário liberado está fora do funcionamento"
                  : `${foraDoFuncionamento} horários liberados estão fora do funcionamento`}{" "}
                (marcados em cinza): ele não aparece para o cliente. Clique para remover.
              </p>
            )}
            <p className="admin-dica">
              Vai tirar folga, férias ou é feriado? Feche só aqueles dias em{" "}
              <Link to="/admin/bloqueios">Folgas e feriados</Link>, sem mexer na grade.
            </p>
          </div>

          <div className="admin-grade-rolagem">
          <table className="admin-grade">
            <thead>
              <tr>
                <th />
                {GradeSemanal.DIAS.map((dia) => {
                  const fechado = funcionamento !== null && !funcionamento.abreNo(dia.numero);
                  return (
                    <th key={dia.numero} className={fechado ? "dia-fechado" : ""}>
                      {dia.nome}
                      {fechado && <small>fechado</small>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {linhas.map((horaInicio) => (
                <tr key={horaInicio}>
                  <th>{horaInicio}</th>
                  {GradeSemanal.DIAS.map((dia) => {
                    const chaveCelula = GradeSemanal.chave(dia.numero, horaInicio);
                    const liberado = horariosPorChave.has(chaveCelula);
                    const dentro = !funcionamento || funcionamento.permite(dia.numero, horaInicio);
                    return (
                      <td key={dia.numero}>
                        <button
                          type="button"
                          className={`admin-grade-celula ${liberado ? "liberado" : ""} ${
                            dentro ? "" : "fora"
                          }`}
                          aria-pressed={liberado}
                          aria-label={`${dia.nome} ${horaInicio}${dentro ? "" : " (fora do funcionamento)"}`}
                          title={
                            dentro
                              ? undefined
                              : liberado
                                ? "Fora do funcionamento: não aparece para o cliente. Clique para remover."
                                : "Fora do funcionamento da clínica"
                          }
                          disabled={processando.includes(chaveCelula) || (!dentro && !liberado)}
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
          </div>
        </>
      )}
    </section>
  );
}
