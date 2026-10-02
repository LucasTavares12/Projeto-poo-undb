import type { ReactNode } from "react";
import { IconeCalendario } from "./Icones";

const NOME_CLINICA = "Clínica de Estética";

interface Props {
  children: ReactNode;
}

export function LayoutCliente({ children }: Props) {
  return (
    <div className="cliente">
      <header className="cliente-cabecalho">
        <IconeCalendario tamanho={24} />
        <span>{NOME_CLINICA}</span>
      </header>
      <main className="cliente-conteudo">{children}</main>
      <footer className="cliente-rodape">
        © {new Date().getFullYear()} {NOME_CLINICA} - Todos os direitos reservados
      </footer>
    </div>
  );
}
