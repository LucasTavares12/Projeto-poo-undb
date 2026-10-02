import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ProfissionalService } from "../../services/ProfissionalService";
import type { DadosProfissional } from "../../services/ProfissionalService";
import type { Profissional } from "../../services/types";

const profissionalService = new ProfissionalService();

const FORMULARIO_VAZIO: DadosProfissional = { nome: "", telefone: "", especialidade: "" };

export function ProfissionaisPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [formulario, setFormulario] = useState<DadosProfissional>(FORMULARIO_VAZIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<number | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setProfissionais(await profissionalService.listar());
      } catch {
        setErro("Não foi possível carregar os profissionais.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  function alterarCampo(campo: keyof DadosProfissional, valor: string): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function iniciarEdicao(profissional: Profissional): void {
    setEditandoId(profissional.id);
    setFormulario({
      nome: profissional.nome,
      telefone: profissional.telefone,
      especialidade: profissional.especialidade,
    });
    setConfirmandoExclusaoId(null);
    setErro(null);
  }

  function limparFormulario(): void {
    setEditandoId(null);
    setFormulario(FORMULARIO_VAZIO);
  }

  async function salvar(evento: FormEvent): Promise<void> {
    evento.preventDefault();

    const dados: DadosProfissional = {
      nome: formulario.nome.trim(),
      telefone: formulario.telefone.trim(),
      especialidade: formulario.especialidade.trim(),
    };

    setSalvando(true);
    setErro(null);
    try {
      if (editandoId === null) {
        const criado = await profissionalService.criar(dados);
        setProfissionais((atual) => [...atual, criado]);
      } else {
        const atualizado = await profissionalService.atualizar(editandoId, dados);
        setProfissionais((atual) =>
          atual.map((profissional) => (profissional.id === editandoId ? atualizado : profissional))
        );
      }
      limparFormulario();
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number): Promise<void> {
    setConfirmandoExclusaoId(null);
    setErro(null);
    try {
      await profissionalService.remover(id);
      setProfissionais((atual) => atual.filter((profissional) => profissional.id !== id));
      if (editandoId === id) {
        limparFormulario();
      }
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    }
  }

  return (
    <section className="pagina">
      <h1>Profissionais</h1>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <form className="admin-formulario" onSubmit={salvar}>
        <h2>{editandoId === null ? "Novo profissional" : "Editar profissional"}</h2>
        <div className="admin-campos">
          <label>
            Nome
            <input
              type="text"
              required
              value={formulario.nome}
              onChange={(evento) => alterarCampo("nome", evento.target.value)}
            />
          </label>
          <label>
            Telefone
            <input
              type="tel"
              required
              value={formulario.telefone}
              onChange={(evento) => alterarCampo("telefone", evento.target.value)}
            />
          </label>
          <label>
            Especialidade
            <input
              type="text"
              required
              value={formulario.especialidade}
              onChange={(evento) => alterarCampo("especialidade", evento.target.value)}
            />
          </label>
        </div>
        <div className="admin-acoes">
          <button type="submit" className="admin-botao principal" disabled={salvando}>
            {salvando ? "Salvando..." : editandoId === null ? "Cadastrar" : "Salvar alterações"}
          </button>
          {editandoId !== null && (
            <button type="button" className="admin-botao" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {carregando ? (
        <p>Carregando...</p>
      ) : profissionais.length === 0 ? (
        <p>Nenhum profissional cadastrado ainda.</p>
      ) : (
        <table className="admin-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Especialidade</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {profissionais.map((profissional) => (
              <tr key={profissional.id}>
                <td>{profissional.nome}</td>
                <td>{profissional.telefone}</td>
                <td>{profissional.especialidade}</td>
                <td className="admin-tabela-acoes">
                  {confirmandoExclusaoId === profissional.id ? (
                    <>
                      <button
                        type="button"
                        className="admin-botao perigo"
                        onClick={() => remover(profissional.id)}
                      >
                        Confirmar exclusão
                      </button>
                      <button
                        type="button"
                        className="admin-botao"
                        onClick={() => setConfirmandoExclusaoId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="admin-botao"
                        onClick={() => iniciarEdicao(profissional)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-botao perigo"
                        onClick={() => setConfirmandoExclusaoId(profissional.id)}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
