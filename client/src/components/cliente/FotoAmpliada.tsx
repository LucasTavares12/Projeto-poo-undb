import { useEffect } from "react";
import { IconeFechar } from "../Icones";

interface Props {
  foto: string;
  titulo: string;
  onFechar: () => void;
}

/** Foto de um tratamento em tamanho grande, por cima da página (fecha no X, no fundo ou no Esc). */
export function FotoAmpliada({ foto, titulo, onFechar }: Props) {
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent): void {
      if (evento.key === "Escape") {
        onFechar();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="foto-ampliada-fundo" role="dialog" aria-modal="true" aria-label={titulo} onClick={onFechar}>
      <figure className="foto-ampliada" onClick={(evento) => evento.stopPropagation()}>
        <button type="button" className="foto-ampliada-fechar" aria-label="Fechar foto" onClick={onFechar} autoFocus>
          <IconeFechar tamanho={18} />
        </button>
        <img src={foto} alt={`Foto do tratamento ${titulo}`} />
        <figcaption>{titulo}</figcaption>
      </figure>
    </div>
  );
}
