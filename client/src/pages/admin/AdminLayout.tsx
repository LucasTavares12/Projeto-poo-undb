import { NavLink, Outlet } from "react-router-dom";

export function AdminLayout() {
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
        </nav>
      </aside>
      <section className="admin-conteudo">
        <Outlet />
      </section>
    </div>
  );
}
