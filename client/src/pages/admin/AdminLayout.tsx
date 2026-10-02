import { NavLink, Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <nav className="admin-nav">
        <NavLink to="/admin" end>
          Agendamentos
        </NavLink>
        <NavLink to="/admin/profissionais">Profissionais</NavLink>
        <NavLink to="/admin/tratamentos">Tratamentos</NavLink>
        <NavLink to="/admin/horarios">Horários</NavLink>
      </nav>
      <section className="admin-conteudo">
        <Outlet />
      </section>
    </div>
  );
}
