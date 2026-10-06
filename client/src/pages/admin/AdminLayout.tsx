import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AutenticacaoService } from "../../services/AutenticacaoService";
import { SessaoAdmin } from "../../services/SessaoAdmin";
import {
  IconeBrilho,
  IconeCalendario,
  IconeEngrenagem,
  IconePessoas,
  IconeQuadro,
  IconeRelogio,
  IconeSair,
} from "../../components/Icones";

const autenticacaoService = new AutenticacaoService();

export function AdminLayout() {
  const navegar = useNavigate();

  if (!SessaoAdmin.estaAtiva()) {
    return <Navigate to="/admin/login" replace />;
  }

  const email = SessaoAdmin.getEmail();

  function sair(): void {
    autenticacaoService.sair();
    navegar("/", { replace: true });
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
            <IconePessoas /> Profissionais
          </NavLink>
          <NavLink to="/admin/tratamentos">
            <IconeBrilho /> Tratamentos
          </NavLink>
          <NavLink to="/admin/horarios">
            <IconeRelogio /> Horários
          </NavLink>
        </nav>

        <span className="admin-nav-secao">Sistema</span>
        <nav className="admin-nav">
          <NavLink to="/admin/configuracoes">
            <IconeEngrenagem /> Configurações
          </NavLink>
        </nav>

        <div className="admin-usuario">
          <span className="admin-avatar">{(email.charAt(0) || "A").toUpperCase()}</span>
          <span className="admin-usuario-texto">
            <span className="admin-usuario-papel">Administrador</span>
            <span className="admin-usuario-email" title={email}>
              {email}
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
        <Outlet />
      </section>
    </div>
  );
}
