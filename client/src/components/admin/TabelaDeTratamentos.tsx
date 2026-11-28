import { useState } from "react";
import type { DragEvent } from "react";
import type { Tratamento } from "../../services/types";
import type { GrupoDeTratamentos } from "../../models/GruposDeTratamentos";
import { GruposDeTratamentos } from "../../models/GruposDeTratamentos";
import { Duracao } from "../../models/Duracao";
import { Dinheiro } from "../../models/Dinheiro";
import { SelecaoDeTratamentos } from "../../models/SelecaoDeTratamentos";
import { IconeArrastar, IconeMais, IconeSetaBaixo, IconeSetaCima } from "../Icones";

interface Props {
  grupo: GrupoDeTratamentos;
  /** Enquanto grava uma nova ordem: as setas e o arrastar ficam travados. */
  salvandoOrdem: boolean;
  confirmandoExclusaoId: number | null;
  onNovo: (profissionalId: number | null) => void;
  onEditar: (tratamento: Tratamento) => void;
  onPedirExclusao: (id: number | null) => void;
  onExcluir: (id: number) => void;
  /** A lista do grupo na nova ordem (a página grava e atualiza a tela). */
  onReordenar: (profissionalId: number | null, novaOrdem: Tratamento[]) => void;
}

/**
 * Tabela dos tratamentos de um profissional (ou dos de todos). A ordem das linhas é a ordem
 * em que o cliente vê os serviços: dá para arrastar as linhas pela alça ou usar as setas.
 */
export function TabelaDeTratamentos({
  grupo,
  salvandoOrdem,
  confirmandoExclusaoId,
  onNovo,
  onEditar,
  onPedirExclusao,
  onExcluir,
  onReordenar,
}: Props) {
  // Durante o arraste, as linhas mudam de lugar na hora; ao soltar, a página grava.
  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [ordemDoArraste, setOrdemDoArraste] = useState<Tratamento[] | null>(null);
  const linhas = ordemDoArraste ?? grupo.tratamentos;
  const podeOrdenar = grupo.tratamentos.length > 1 && !salvandoOrdem;

  function iniciarArraste(evento: DragEvent, id: number): void {
    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", String(id));
    setArrastandoId(id);
    setOrdemDoArraste(grupo.tratamentos);
  }

  function passarPor(evento: DragEvent, alvoId: number): void {
    if (arrastandoId === null || ordemDoArraste === null) {
      return; // arraste de outra tabela: não aceita aqui
    }
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "move";
    if (alvoId !== arrastandoId) {
      setOrdemDoArraste(GruposDeTratamentos.mover(ordemDoArraste, arrastandoId, alvoId));
    }
  }

  function encerrarArraste(): void {
    if (ordemDoArraste && !GruposDeTratamentos.mesmaOrdem(ordemDoArraste, grupo.tratamentos)) {
      onReordenar(grupo.profissionalId, ordemDoArraste);
    }
    setArrastandoId(null);
    setOrdemDoArraste(null);
  }

  function deslocar(id: number, direcao: -1 | 1): void {
    onReordenar(grupo.profissionalId, GruposDeTratamentos.deslocar(grupo.tratamentos, id, direcao));
  }

  return (
    <section className="grupo-tratamentos">
      <header className="grupo-tratamentos-cabecalho">
        <span className="admin-avatar pequeno">
          {grupo.profissionalId === null ? "★" : grupo.titulo.charAt(0).toUpperCase()}
        </span>
        <div>
          <h2>{grupo.titulo}</h2>
          <p>
            {grupo.tratamentos.length === 1 ? "1 tratamento" : `${grupo.tratamentos.length} tratamentos`}
            {grupo.subtitulo && ` · ${grupo.subtitulo}`}
          </p>
        </div>
        <button type="button" className="admin-botao" onClick={() => onNovo(grupo.profissionalId)}>
          <IconeMais tamanho={14} /> Novo
        </button>
      </header>

      {linhas.length === 0 ? (
        <p className="grupo-tratamentos-vazio">Nenhum tratamento para este profissional ainda.</p>
      ) : (
        <table className="admin-tabela admin-tabela-cartoes tabela-ordenavel">
          <thead>
            <tr>
              <th className="coluna-ordem" aria-label="Ordem" />
              <th>Tratamento</th>
              <th>Duração</th>
              <th className="admin-tabela-valor">Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {linhas.map((tratamento, posicao) => (
              <tr
                key={tratamento.id}
                className={arrastandoId === tratamento.id ? "arrastando" : ""}
                draggable={podeOrdenar}
                onDragStart={(evento) => iniciarArraste(evento, tratamento.id)}
                onDragOver={(evento) => passarPor(evento, tratamento.id)}
                onDrop={(evento) => evento.preventDefault()}
                onDragEnd={encerrarArraste}
              >
                <td className="coluna-ordem">
                  <span
                    className={`alca-arrastar ${podeOrdenar ? "" : "desativada"}`}
                    title={podeOrdenar ? "Arraste para mudar a ordem" : undefined}
                    aria-hidden="true"
                  >
                    <IconeArrastar tamanho={16} />
                  </span>
                  <span className="posicao">{posicao + 1}º</span>
                </td>
                <td className="admin-tabela-titulo">
                  <span className="tratamento-celula">
                    {tratamento.foto && (
                      <img
                        className="tratamento-miniatura"
                        src={tratamento.foto}
                        alt=""
                        title="Foto que o cliente vê"
                        loading="lazy"
                      />
                    )}
                    <span>
                      <span className="tratamento-nome">{tratamento.nome}</span>
                      {tratamento.descricao && (
                        <span className="tratamento-descricao">{tratamento.descricao}</span>
                      )}
                    </span>
                  </span>
                </td>
                <td data-rotulo="Duração">
                  <span className="admin-etiqueta">
                    {new Duracao(tratamento.duracaoMinutos).formatar()}
                  </span>
                </td>
                <td className="admin-tabela-valor" data-rotulo="Valor">
                  {new Dinheiro(tratamento.valor).formatar()}
                  {SelecaoDeTratamentos.temValorNoCredito(tratamento) && (
                    <span className="tratamento-valor-credito" title="Valor no cartão de crédito">
                      Crédito: {new Dinheiro(tratamento.valorCartaoCredito ?? 0).formatar()}
                    </span>
                  )}
                </td>
                <td className="admin-tabela-acoes">
                  {confirmandoExclusaoId === tratamento.id ? (
                    <>
                      <button
                        type="button"
                        className="admin-botao perigo"
                        onClick={() => onExcluir(tratamento.id)}
                      >
                        Confirmar exclusão
                      </button>
                      <button type="button" className="admin-botao" onClick={() => onPedirExclusao(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="botoes-ordem">
                        <button
                          type="button"
                          className="admin-botao icone"
                          aria-label={`Subir ${tratamento.nome}`}
                          title="Subir"
                          disabled={!podeOrdenar || posicao === 0}
                          onClick={() => deslocar(tratamento.id, -1)}
                        >
                          <IconeSetaCima tamanho={15} />
                        </button>
                        <button
                          type="button"
                          className="admin-botao icone"
                          aria-label={`Descer ${tratamento.nome}`}
                          title="Descer"
                          disabled={!podeOrdenar || posicao === linhas.length - 1}
                          onClick={() => deslocar(tratamento.id, 1)}
                        >
                          <IconeSetaBaixo tamanho={15} />
                        </button>
                      </span>
                      <button type="button" className="admin-botao" onClick={() => onEditar(tratamento)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-botao perigo"
                        onClick={() => onPedirExclusao(tratamento.id)}
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
