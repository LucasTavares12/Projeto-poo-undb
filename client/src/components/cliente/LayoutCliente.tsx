import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconeCalendario } from "../Icones";
import { SessaoAdmin } from "../../services/SessaoAdmin";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";
import { Clinica } from "../../models/Clinica";

interface Props {
  children: ReactNode;
}

export function LayoutCliente({ children }: Props) {
  const configuracoes = useConfiguracoes();
  const logado = SessaoAdmin.estaAtiva();
  // Até as configurações chegarem, os botões ficam escondidos para não "piscarem" na tela.
  const mostrarEntrar = configuracoes?.botaoEntrarVisivel ?? false;
  const mostrarCadastrar = configuracoes?.cadastroLiberado ?? false;
  const nomeClinica = configuracoes?.nomeClinica ?? Clinica.NOME_PADRAO;

  return (
    <div className="cliente">
      <header className="cliente-cabecalho">
        <span className="cliente-marca">
          {configuracoes?.logo ? (
            <img className="cliente-marca-logo" src={configuracoes.logo} alt="" />
          ) : (
            <IconeCalendario tamanho={24} />
          )}
          <span>{nomeClinica}</span>
        </span>
        <nav className="cliente-cabecalho-acoes">
          {logado ? (
            <Link to="/admin" className="botao-contorno">
              Painel
            </Link>
          ) : (
            <>
              {mostrarCadastrar && (
                <Link to="/admin/cadastro" className="botao-contorno">
                  Cadastrar
                </Link>
              )}
              {mostrarEntrar && (
                <Link to="/admin/login" className="botao-primario">
                  Entrar
                </Link>
              )}
            </>
          )}
        </nav>
      </header>
      <main className="cliente-conteudo">{children}</main>
      <footer className="cliente-rodape">
        © {new Date().getFullYear()} {nomeClinica} - Todos os direitos reservados
      </footer>
    </div>
  );
}
