import { Route, Routes } from "react-router-dom";
import { AgendamentoPage } from "./pages/cliente/AgendamentoPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { KanbanPage } from "./pages/admin/KanbanPage";
import { ProfissionaisPage } from "./pages/admin/ProfissionaisPage";
import { TratamentosPage } from "./pages/admin/TratamentosPage";
import { HorariosPage } from "./pages/admin/HorariosPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AgendamentoPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<KanbanPage />} />
        <Route path="profissionais" element={<ProfissionaisPage />} />
        <Route path="tratamentos" element={<TratamentosPage />} />
        <Route path="horarios" element={<HorariosPage />} />
      </Route>
    </Routes>
  );
}

export default App;
