import { useCallback, useState } from "react";
import type { Tratamento } from "../../services/types";
import { Dinheiro } from "../../models/Dinheiro";
import { SelecaoDeTratamentos } from "../../models/SelecaoDeTratamentos";
import { Duracao } from "../../models/Duracao";
import { IconeCheck } from "../Icones";
import { FotoAmpliada } from "./FotoAmpliada";

interface Props {
  tratamentos: Tratamento[];
  selecionadosIds: number[];
  onAlternar: (id: number) => void;
}

/**
 * Lista de serviços para marcar (dá para escolher mais de um). Se a clínica colocou uma foto
 * no tratamento, ela aparece ao lado do nome e amplia ao tocar; sem foto, fica só o texto.
 */
export function SeletorTratamentos({ tratamentos, selecionadosIds, onAlternar }: Props) {
  const [fotoAberta, setFotoAberta] = useState<Tratamento | null>(null);
  const fecharFoto = useCallback(() => setFotoAberta(null), []);

  if (tratamentos.length === 0) {
    return <p className="aviso-vazio">Nenhum serviço cadastrado ainda.</p>;
  }

  return (
    <>
      <div className="lista-tratamentos">
        {tratamentos.map((tratamento) => {
          const selecionado = selecionadosIds.includes(tratamento.id);
          return (
            <label
              key={tratamento.id}
              className={`item-tratamento ${selecionado ? "selecionado" : ""}`}
            >
              <input
                type="checkbox"
                className="visualmente-oculto"
                checked={selecionado}
                onChange={() => onAlternar(tratamento.id)}
              />
              <span className="marca-selecao quadrada" aria-hidden="true">
                <IconeCheck tamanho={14} />
              </span>
              {tratamento.foto && (
                <button
                  type="button"
                  className="item-tratamento-foto"
                  aria-label={`Ver foto de ${tratamento.nome}`}
                  title="Ver foto"
                  onClick={(evento) => {
                    // Tocar na foto só amplia: não marca nem desmarca o serviço.
                    evento.preventDefault();
                    evento.stopPropagation();
                    setFotoAberta(tratamento);
                  }}
                >
                  <img src={tratamento.foto} alt="" loading="lazy" />
                </button>
              )}
              <span className="item-tratamento-descricao">
                <strong>{tratamento.nome}</strong>
                {tratamento.descricao && <small>{tratamento.descricao}</small>}
              </span>
              <span className="item-tratamento-info">
                <strong>{new Dinheiro(tratamento.valor).formatar()}</strong>
                {SelecaoDeTratamentos.temValorNoCredito(tratamento) && (
                  <small className="item-tratamento-credito">
                    {new Dinheiro(tratamento.valorCartaoCredito ?? 0).formatar()} no crédito
                  </small>
                )}
                <span>{new Duracao(tratamento.duracaoMinutos).formatar()}</span>
              </span>
            </label>
          );
        })}
      </div>
      {fotoAberta?.foto && (
        <FotoAmpliada foto={fotoAberta.foto} titulo={fotoAberta.nome} onFechar={fecharFoto} />
      )}
    </>
  );
}
