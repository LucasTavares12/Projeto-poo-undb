import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { TratamentoService } from "../../services/TratamentoService";
import { ProfissionalService } from "../../services/ProfissionalService";
import type { Profissional, Tratamento } from "../../services/types";
import { Duracao } from "../../models/Duracao";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { OpcaoProfissional } from "../../models/OpcaoProfissional";
import { GruposDeTratamentos } from "../../models/GruposDeTratamentos";
import { TabelaDeTratamentos } from "../../components/admin/TabelaDeTratamentos";
import { FotoDoTratamento } from "../../models/FotoDoTratamento";
import { IconeImagem } from "../../components/Icones";

const tratamentoService = new TratamentoService();
const profissionalService = new ProfissionalService();

interface Formulario {
  nome: string;
  descricao: string;
  valor: string;
  /** Vazio = no cartão de crédito vale o mesmo valor. */
  valorCartaoCredito: string;
  duracaoMinutos: number;
  /** null = todos os profissionais. */
  profissionalId: number | null;
  /** Foto que demonstra o tratamento (data URL); null = sem foto. */
  foto: string | null;
}

const FORMULARIO_VAZIO: Formulario = {
  nome: "",
  descricao: "",
  valor: "",
  valorCartaoCredito: "",
  duracaoMinutos: Duracao.SLOT_MINUTOS,
  profissionalId: null,
  foto: null,
};

export function TratamentosPage() {
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VAZIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<number | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const formularioRef = useRef<HTMLFormElement>(null);
  const campoFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const [listaTratamentos, listaProfissionais] = await Promise.all([
          tratamentoService.listar(),
          profissionalService.listar(),
        ]);
        setTratamentos(listaTratamentos);
        setProfissionais(listaProfissionais);
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
      valorCartaoCredito:
        tratamento.valorCartaoCredito == null ? "" : String(tratamento.valorCartaoCredito),
      duracaoMinutos: tratamento.duracaoMinutos,
      profissionalId: tratamento.profissionalId,
      foto: tratamento.foto ?? null,
    });
    setConfirmandoExclusaoId(null);
    setErro(null);
    setMensagem(null);
    formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** "Novo" na tabela de um profissional: o formulário já vem com ele escolhido. */
  function novoPara(profissionalId: number | null): void {
    setEditandoId(null);
    setFormulario({ ...FORMULARIO_VAZIO, profissionalId });
    setErro(null);
    setMensagem(null);
    formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * Nova ordem de um grupo (arrastando ou pelas setas): já muda na tela e grava; se o
   * servidor recusar, a ordem anterior volta.
   */
  async function reordenar(profissionalId: number | null, novaOrdem: Tratamento[]): Promise<void> {
    const anteriores = tratamentos;
    const numerados = new Map(
      GruposDeTratamentos.numerar(novaOrdem).map((tratamento) => [tratamento.id, tratamento])
    );
    setTratamentos((atual) => atual.map((tratamento) => numerados.get(tratamento.id) ?? tratamento));
    setSalvandoOrdem(true);
    setErro(null);
    setMensagem(null);
    try {
      await tratamentoService.reordenar(
        profissionalId,
        novaOrdem.map((tratamento) => tratamento.id)
      );
      setMensagem("Ordem salva. É assim que os serviços aparecem para o cliente.");
    } catch (erroRequisicao) {
      setTratamentos(anteriores);
      setErro((erroRequisicao as Error).message);
    } finally {
      setSalvandoOrdem(false);
    }
  }

  /** Foto escolhida no computador/celular: reduz no navegador e coloca no formulário. */
  async function escolherFoto(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) {
      return;
    }
    setErro(null);
    setPreparandoFoto(true);
    try {
      const foto = await FotoDoTratamento.preparar(arquivo);
      setFormulario((atual) => ({ ...atual, foto }));
    } catch (erroFoto) {
      setErro((erroFoto as Error).message);
    } finally {
      setPreparandoFoto(false);
    }
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
      valorCartaoCredito:
        formulario.valorCartaoCredito.trim() === "" ? null : Number(formulario.valorCartaoCredito),
      duracaoMinutos: formulario.duracaoMinutos,
      profissionalId: formulario.profissionalId,
      foto: formulario.foto,
    };

    setSalvando(true);
    setErro(null);
    try {
      if (editandoId === null) {
        const criado = await tratamentoService.criar(dados);
        setTratamentos((atual) => [...atual, criado]);
        setMensagem(`"${criado.nome}" cadastrado no fim da lista. Arraste para mudar a posição.`);
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
      <CabecalhoPagina
        titulo="Tratamentos"
        descricao="Procedimentos oferecidos por profissional, com duração, valor e a ordem em que o cliente vê."
      />

      {erro && <p className="mensagem-erro">{erro}</p>}

      <form ref={formularioRef} className="admin-formulario" onSubmit={salvar}>
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
            No cartão de crédito (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Opcional: mesmo valor"
              value={formulario.valorCartaoCredito}
              onChange={(evento) =>
                setFormulario({ ...formulario, valorCartaoCredito: evento.target.value })
              }
            />
            <small className="admin-dica tratamento-dica-credito">
              Preencha só se o valor muda no crédito (ex.: taxa da maquininha). O cliente vê o novo
              valor ao escolher cartão de crédito.
            </small>
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
          <label>
            Profissional
            <select
              value={OpcaoProfissional.paraValor(formulario.profissionalId)}
              onChange={(evento) =>
                setFormulario({
                  ...formulario,
                  profissionalId: OpcaoProfissional.lerId(evento.target.value),
                })
              }
            >
              <option value="">Todos os profissionais</option>
              {profissionais.map((profissional) => (
                <option key={profissional.id} value={profissional.id}>
                  {profissional.nome}
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
          <div className="admin-campo-largo tratamento-foto-campo">
            <span className="tratamento-foto-previa">
              {formulario.foto ? (
                <img src={formulario.foto} alt="Foto do tratamento" />
              ) : (
                <IconeImagem tamanho={26} />
              )}
            </span>
            <div>
              <strong>Foto (opcional)</strong>
              <p className="admin-dica">
                {formulario.foto
                  ? "Aparece para o cliente ao lado do tratamento, na hora de escolher o serviço."
                  : "Sem foto, o cliente vê o tratamento só com nome, descrição, valor e duração."}
              </p>
              <div className="admin-acoes tratamento-foto-acoes">
                <button
                  type="button"
                  className="admin-botao"
                  onClick={() => campoFoto.current?.click()}
                  disabled={preparandoFoto}
                >
                  {preparandoFoto ? "Preparando..." : formulario.foto ? "Trocar foto" : "Enviar foto"}
                </button>
                {formulario.foto && (
                  <button
                    type="button"
                    className="admin-botao perigo"
                    onClick={() => setFormulario((atual) => ({ ...atual, foto: null }))}
                  >
                    Remover foto
                  </button>
                )}
              </div>
              <input
                ref={campoFoto}
                type="file"
                accept={FotoDoTratamento.ACEITAR}
                hidden
                onChange={escolherFoto}
              />
            </div>
          </div>
        </div>
        <div className="admin-acoes">
          <button type="submit" className="admin-botao principal" disabled={salvando || preparandoFoto}>
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
      ) : (
        <>
          <p className="admin-dica tratamentos-dica">
            Arraste as linhas pela alça (ou use as setas) para mudar a ordem: é a ordem em que o
            cliente vê os serviços ao agendar. Deixe no topo os mais procurados, combos e
            promoções. Para cada profissional, o cliente vê primeiro os tratamentos dele e depois
            os de "Todos os profissionais".
          </p>
          {mensagem && <p className="mensagem-sucesso admin-mensagem-topo">{mensagem}</p>}
          {GruposDeTratamentos.agrupar(tratamentos, profissionais).map((grupo) => (
            <TabelaDeTratamentos
              key={grupo.chave}
              grupo={grupo}
              salvandoOrdem={salvandoOrdem}
              confirmandoExclusaoId={confirmandoExclusaoId}
              onNovo={novoPara}
              onEditar={iniciarEdicao}
              onPedirExclusao={setConfirmandoExclusaoId}
              onExcluir={remover}
              onReordenar={reordenar}
            />
          ))}
          {profissionais.length === 0 && tratamentos.length === 0 && (
            <p>Nenhum tratamento cadastrado ainda.</p>
          )}
        </>
      )}
    </section>
  );
}
