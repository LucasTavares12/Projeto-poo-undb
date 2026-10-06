import { Route, Routes } from "react-router-dom";
import { AgendamentoPage } from "./pages/cliente/AgendamentoPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { LoginPage } from "./pages/admin/LoginPage";
import { CadastroPage } from "./pages/admin/CadastroPage";
import { KanbanPage } from "./pages/admin/KanbanPage";
import { ProfissionaisPage } from "./pages/admin/ProfissionaisPage";
import { TratamentosPage } from "./pages/admin/TratamentosPage";
import { HorariosPage } from "./pages/admin/HorariosPage";
import { ConfiguracoesPage } from "./pages/admin/ConfiguracoesPage";
import { RelatoriosPage } from "./pages/admin/RelatoriosPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AgendamentoPage />} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/cadastro" element={<CadastroPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<KanbanPage />} />
        <Route path="profissionais" element={<ProfissionaisPage />} />
        <Route path="tratamentos" element={<TratamentosPage />} />
        <Route path="horarios" element={<HorariosPage />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
