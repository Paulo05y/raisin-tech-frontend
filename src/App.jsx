import React from "react";
import { useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clima from "./pages/Clima";
import Mercado from "./pages/Mercado";
import Logistica from "./pages/Logistica";
import Previsoes from "./pages/Previsoes";
import Historico from "./pages/Historico";
import Alertas from "./pages/Alertas";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";

const pageTitles = {
  "/dashboard": ["Dashboard", "Visão geral da operação"],
  "/clima": ["Clima", "Monitoramento dos sensores e condições climáticas"],
  "/mercado": ["Mercado", "Preços e demanda de exportação"],
  "/logistica": ["Logística", "Acompanhamento das operações de exportação"],
  "/previsoes": ["Previsões", "Janela ideal para colheita e exportação"],
  "/historico": ["Histórico", "Dados climáticos e de safra"],
  "/alertas": ["Alertas", "Ocorrências e condições importantes"],
  "/relatorios": ["Relatórios", "Indicadores de segurança e qualidade"],
  "/usuarios": ["Usuários", "Gestão de acessos e permissões"]
};

function ProtectedLayout({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role] = useState("Administrador");
  const [userName] = useState("Matheus Paulo");

  if (location.pathname === "/") return <Navigate to="/dashboard" replace />;

  const [title, subtitle] = pageTitles[location.pathname] || ["Dashboard", "Visão geral da operação"];

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        role={role}
      />
      <div className="main-area">
        <Header
          title={title}
          subtitle={subtitle}
          userName={userName}
          onMenu={() => setSidebarOpen(true)}
          onNotifications={() => navigate("/alertas")}
        />
        <main className="page-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clima" element={<Clima />} />
            <Route path="/mercado" element={<Mercado />} />
            <Route path="/logistica" element={<Logistica />} />
            <Route path="/previsoes" element={<Previsoes />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [logged, setLogged] = useState(false);

  if (!logged) {
    return <Login onLogin={() => setLogged(true)} />;
  }

  return <ProtectedLayout onLogout={() => setLogged(false)} />;
}