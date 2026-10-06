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
  IconeBrilho,
  IconeCalendario,
  IconeEngrenagem,
  IconeGrafico,
  IconePessoas,
  IconeQuadro,
  IconeRelogio,
  IconeSair,
} from "../../components/Icones";

const autenticacaoService = new AutenticacaoService();

// Áreas da clínica inteira: só para usuários com acesso total (sem profissional vinculado).
const AREAS_DE_ACESSO_TOTAL = ["/admin/tratamentos", "/admin/configuracoes"];

export function AdminLayout() {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const logado = SessaoAdmin.estaAtiva();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!logado) {
      return;
    }
    autenticacaoService
      .usuarioLogado()
      .then(setUsuario)
      .catch((erroRequisicao: Error) => setErro(erroRequisicao.message));
  }, [logado]);

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

  const acessoTotal = usuario.profissionalId === null;
  if (!acessoTotal && AREAS_DE_ACESSO_TOTAL.some((area) => pathname.startsWith(area))) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-lateral">
        <div className="admin-marca">
          <span className="admin-marca-logo">
            <IconeCalendario tamanho={20} />
          </span>
          <span>
            <span className="admin-lateral-titulo">Painel da Clínica</span>
            <span className="admin-marca-subtitulo">Gestão de agendamentos</span>
          </span>
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
