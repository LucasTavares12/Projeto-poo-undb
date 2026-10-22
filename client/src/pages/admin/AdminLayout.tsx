import { useEffect, useState } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AutenticacaoService } from "../../services/AutenticacaoService";
import { SessaoAdmin } from "../../services/SessaoAdmin";
import type { UsuarioLogado } from "../../services/types";
import {
  IconeBloqueio,
  IconeBrilho,
  IconeCalendario,
  IconeEngrenagem,
  IconeFechar,
  IconeGrafico,
  IconeMenu,
  IconePessoas,
  IconeQuadro,
  IconeRelogio,
  IconeSair,
} from "../../components/Icones";
import { PerfilDeAcesso } from "../../models/PerfilDeAcesso";

const autenticacaoService = new AutenticacaoService();

export function AdminLayout() {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const logado = SessaoAdmin.estaAtiva();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // No celular o menu vira uma gaveta. Guarda a página em que foi aberto: ao navegar, fecha sozinho.
  const [menuAbertoEm, setMenuAbertoEm] = useState<string | null>(null);
  const menuAberto = menuAbertoEm === pathname;

  useEffect(() => {
    if (!logado) {
      return;
    }
    autenticacaoService
      .usuarioLogado()
      .then(setUsuario)
      .catch((erroRequisicao: Error) => setErro(erroRequisicao.message));
  }, [logado]);

  useEffect(() => {
    if (!menuAberto) {
      return;
    }
    // Com a gaveta aberta, a página de trás não rola e o Esc fecha o menu.
    const fecharComEsc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setMenuAbertoEm(null);
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", fecharComEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [menuAberto]);

  if (!logado) {
    return <Navigate to="/admin/login" replace />;
  }

  function sair(): void {
    autenticacaoService.sair();
    navegar("/", { replace: true });
  }

  if (!usuario) {
    return (
      <div className="admin-layout admin-carregando">
        {erro ? <p className="mensagem-erro">{erro}</p> : <p>Carregando...</p>}
      </div>
    );
  }

  const perfil = new PerfilDeAcesso(usuario);
  const acessoTotal = perfil.temAcessoTotal();
  if (!perfil.podeAbrir(pathname)) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className={`admin-layout ${menuAberto ? "menu-aberto" : ""}`}>
      {/* Barra do topo: só aparece em telas pequenas, no lugar da barra lateral. */}
      <header className="admin-topo">
        <button
          type="button"
          className="admin-topo-menu"
          onClick={() => setMenuAbertoEm(pathname)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="admin-lateral"
        >
          <IconeMenu tamanho={22} />
        </button>
        <span className="admin-topo-titulo">
          <span className="admin-marca-logo">
            <IconeCalendario tamanho={16} />
          </span>
          Painel da Clínica
        </span>
        <span className="admin-avatar pequeno" title={usuario.email}>
          {(usuario.email.charAt(0) || "A").toUpperCase()}
        </span>
      </header>

      <div className="admin-lateral-fundo" onClick={() => setMenuAbertoEm(null)} aria-hidden="true" />

      <aside id="admin-lateral" className="admin-lateral">
        <div className="admin-marca">
          <span className="admin-marca-logo">
            <IconeCalendario tamanho={20} />
          </span>
          <span>
            <span className="admin-lateral-titulo">Painel da Clínica</span>
            <span className="admin-marca-subtitulo">Gestão de agendamentos</span>
          </span>
          <button
            type="button"
            className="admin-lateral-fechar"
            onClick={() => setMenuAbertoEm(null)}
            aria-label="Fechar menu"
          >
            <IconeFechar tamanho={20} />
          </button>
        </div>

        <span className="admin-nav-secao">Menu</span>
        <nav className="admin-nav">
          <NavLink to="/admin" end>
            <IconeQuadro /> Agendamentos
          </NavLink>
          <NavLink to="/admin/profissionais">
            <IconePessoas /> {acessoTotal ? "Profissionais" : "Meu cadastro"}
          </NavLink>
          {acessoTotal && (
            <NavLink to="/admin/tratamentos">
              <IconeBrilho /> Tratamentos
            </NavLink>
          )}
          <NavLink to="/admin/horarios">
            <IconeRelogio /> Horários
          </NavLink>
          <NavLink to="/admin/bloqueios">
            <IconeBloqueio /> Folgas e feriados
          </NavLink>
          <NavLink to="/admin/relatorios">
            <IconeGrafico /> Relatórios
          </NavLink>
        </nav>

        {acessoTotal && (
          <>
            <span className="admin-nav-secao">Sistema</span>
            <nav className="admin-nav">
              <NavLink to="/admin/configuracoes">
                <IconeEngrenagem /> Configurações
              </NavLink>
            </nav>
          </>
        )}

        <div className="admin-usuario">
          <span className="admin-avatar">{(usuario.email.charAt(0) || "A").toUpperCase()}</span>
          <span className="admin-usuario-texto">
            <span className="admin-usuario-papel" title={usuario.profissionalNome ?? undefined}>
              {acessoTotal ? "Administrador" : usuario.profissionalNome}
            </span>
            <span className="admin-usuario-email" title={usuario.email}>
              {usuario.email}
            </span>
          </span>
          <button
            type="button"
            className="admin-sair"
            onClick={sair}
            title="Sair"
            aria-label="Sair"
          >
            <IconeSair />
          </button>
        </div>
      </aside>
      <section className="admin-conteudo">
        <Outlet context={usuario} />
      </section>
    </div>
  );
}
