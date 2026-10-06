import type { ReactNode } from "react";

interface Props {
  titulo: string;
  descricao: string;
  /** Botões exibidos à direita do título (ex: "Atualizar"). */
  acoes?: ReactNode;
}

export function CabecalhoPagina({ titulo, descricao, acoes }: Props) {
  return (
    <header className="admin-cabecalho">
      <div>
        <h1>{titulo}</h1>
        <p className="admin-subtitulo">{descricao}</p>
      </div>
      {acoes && <div className="admin-cabecalho-acoes">{acoes}</div>}
    </header>
  );
}
