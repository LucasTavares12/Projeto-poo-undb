import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AutenticacaoService } from "../../services/AutenticacaoService";
import { SessaoAdmin } from "../../services/SessaoAdmin";

const autenticacaoService = new AutenticacaoService();

export function AdminLayout() {
  const navegar = useNavigate();

  if (!SessaoAdmin.estaAtiva()) {
    return <Navigate to="/admin/login" replace />;
  }

  function sair(): void {
    autenticacaoService.sair();
    navegar("/", { replace: true });
  }

  return (
    <div className="admin-layout">
      <aside className="admin-lateral">
        <span className="admin-lateral-titulo">Painel da Clínica</span>
        <nav className="admin-nav">
          <NavLink to="/admin" end>
            Agendamentos
          </NavLink>
          <NavLink to="/admin/profissionais">Profissionais</NavLink>
          <NavLink to="/admin/tratamentos">Tratamentos</NavLink>
          <NavLink to="/admin/horarios">Horários</NavLink>
          <NavLink to="/admin/configuracoes">Configurações</NavLink>
        </nav>
        <button type="button" className="admin-botao admin-sair" onClick={sair}>
          Sair
        </button>
      </aside>
      <section className="admin-conteudo">
        <Outlet />
      </section>
    </div>
  );
}
