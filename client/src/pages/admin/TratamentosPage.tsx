import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { TratamentoService } from "../../services/TratamentoService";
import type { Tratamento } from "../../services/types";
import { Duracao } from "../../models/Duracao";

const tratamentoService = new TratamentoService();

interface Formulario {
  nome: string;
  descricao: string;
  valor: string;
  duracaoMinutos: number;
}

const FORMULARIO_VAZIO: Formulario = {
  nome: "",
  descricao: "",
  valor: "",
  duracaoMinutos: Duracao.SLOT_MINUTOS,
};

export function TratamentosPage() {
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VAZIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<number | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setTratamentos(await tratamentoService.listar());
      } catch {
        setErro("Não foi possível carregar os tratamentos.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  function iniciarEdicao(tratamento: Tratamento): void {
    setEditandoId(tratamento.id);
    setFormulario({
      nome: tratamento.nome,
      descricao: tratamento.descricao,
      valor: String(tratamento.valor),
      duracaoMinutos: tratamento.duracaoMinutos,
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

    const dados = {
      nome: formulario.nome.trim(),
      descricao: formulario.descricao.trim(),
      valor: Number(formulario.valor),
      duracaoMinutos: formulario.duracaoMinutos,
    };

    setSalvando(true);
    setErro(null);
    try {
      if (editandoId === null) {
        const criado = await tratamentoService.criar(dados);
        setTratamentos((atual) => [...atual, criado]);
      } else {
        const atualizado = await tratamentoService.atualizar(editandoId, dados);
        setTratamentos((atual) =>
          atual.map((tratamento) => (tratamento.id === editandoId ? atualizado : tratamento))
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
      await tratamentoService.remover(id);
      setTratamentos((atual) => atual.filter((tratamento) => tratamento.id !== id));
      if (editandoId === id) {
        limparFormulario();
      }
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    }
  }

  return (
    <section className="pagina">
      <h1>Tratamentos</h1>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <form className="admin-formulario" onSubmit={salvar}>
        <h2>{editandoId === null ? "Novo tratamento" : "Editar tratamento"}</h2>
        <div className="admin-campos">
          <label>
            Nome
            <input
              type="text"
              required
              value={formulario.nome}
              onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
            />
          </label>
          <label>
            Valor (R$)
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formulario.valor}
              onChange={(evento) => setFormulario({ ...formulario, valor: evento.target.value })}
            />
          </label>
          <label>
            Duração
            <select
              value={formulario.duracaoMinutos}
              onChange={(evento) =>
                setFormulario({ ...formulario, duracaoMinutos: Number(evento.target.value) })
              }
            >
              {Duracao.opcoes().map((duracao) => (
                <option key={duracao.getMinutos()} value={duracao.getMinutos()}>
                  {duracao.formatar()}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-campo-largo">
            Descrição
            <textarea
              rows={2}
              value={formulario.descricao}
              onChange={(evento) =>
                setFormulario({ ...formulario, descricao: evento.target.value })
              }
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
      ) : tratamentos.length === 0 ? (
        <p>Nenhum tratamento cadastrado ainda.</p>
      ) : (
        <table className="admin-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Duração</th>
              <th>Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tratamentos.map((tratamento) => (
              <tr key={tratamento.id}>
                <td>{tratamento.nome}</td>
                <td>{tratamento.descricao}</td>
                <td>{new Duracao(tratamento.duracaoMinutos).formatar()}</td>
                <td>R$ {tratamento.valor.toFixed(2)}</td>
                <td className="admin-tabela-acoes">
                  {confirmandoExclusaoId === tratamento.id ? (
                    <>
                      <button
                        type="button"
                        className="admin-botao perigo"
                        onClick={() => remover(tratamento.id)}
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
                        onClick={() => iniciarEdicao(tratamento)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-botao perigo"
                        onClick={() => setConfirmandoExclusaoId(tratamento.id)}
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
