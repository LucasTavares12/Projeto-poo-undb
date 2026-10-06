import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconeCalendario } from "../Icones";
import { SessaoAdmin } from "../../services/SessaoAdmin";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";

const NOME_CLINICA = "Clínica de Estética";

interface Props {
  children: ReactNode;
}

export function LayoutCliente({ children }: Props) {
  const configuracoes = useConfiguracoes();
  const logado = SessaoAdmin.estaAtiva();
  // Até as configurações chegarem, os botões ficam escondidos para não "piscarem" na tela.
  const mostrarAcesso = configuracoes?.acessoPublicoLiberado ?? false;

  return (
    <div className="cliente">
      <header className="cliente-cabecalho">
        <span className="cliente-marca">
          <IconeCalendario tamanho={24} />
          <span>{NOME_CLINICA}</span>
        </span>
        <nav className="cliente-cabecalho-acoes">
          {logado ? (
            <Link to="/admin" className="botao-contorno">
              Painel
            </Link>
          ) : (
            mostrarAcesso && (
            <>
              <Link to="/admin/cadastro" className="botao-contorno">
                Cadastrar
              </Link>
              <Link to="/admin/login" className="botao-primario">
                Entrar
              </Link>
            </>
            )
          )}
        </nav>
      </header>
      <main className="cliente-conteudo">{children}</main>
      <footer className="cliente-rodape">
        © {new Date().getFullYear()} {NOME_CLINICA} - Todos os direitos reservados
      </footer>
    </div>
  );
}
