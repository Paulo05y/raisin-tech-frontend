import React, { useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Clima from "./pages/Clima";
import Previsoes from "./pages/Previsoes";
import Historico from "./pages/Historico";
import Alertas from "./pages/Alertas";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";
import Perfil from "./pages/Perfil";

const pageTitles = {
  "/dashboard": ["Dashboard", "Visão geral da operação"],
  "/clima": ["Clima", "Monitoramento dos sensores e condições climáticas"],
  "/previsoes": ["Previsões", "Janela ideal para colheita e exportação"],
  "/historico": ["Histórico", "Dados climáticos e de safra"],
  "/alertas": ["Alertas", "Ocorrências e condições importantes"],
  "/relatorios": ["Relatórios", "Indicadores de segurança e qualidade"],
  "/usuarios": ["Usuários", "Gestão de acessos e permissões"],
  "/perfil": ["Meu perfil", "Dados da sua conta e preferências"]
};

function ProtectedLayout({ onLogout, user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role] = useState("Administrador");
  const [notice, setNotice] = useState("");

  if (location.pathname === "/") return <Navigate to="/dashboard" replace />;

  const [title, subtitle] = pageTitles[location.pathname] || pageTitles["/dashboard"];

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const handleSearch = (term) => {
    const value = term.trim().toLowerCase();
    if (!value) return;
    const pages = [
      ["dashboard", "/dashboard"], ["clima", "/clima"], ["previsão", "/previsoes"], ["previsoes", "/previsoes"],
      ["histórico", "/historico"], ["historico", "/historico"], ["alerta", "/alertas"], ["alertas", "/alertas"],
      ["relatório", "/relatorios"], ["relatorios", "/relatorios"], ["usuário", "/usuarios"], ["usuarios", "/usuarios"],
      ["perfil", "/perfil"]
    ];
    const match = pages.find(([label]) => label.includes(value) || value.includes(label));
    if (match) {
      navigate(match[1]);
      showNotice(`Abrindo ${pageTitles[match[1]][0]}`);
    } else {
      showNotice("Nenhuma tela encontrada para essa busca.");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        role={role}
        user={user}
      />
      <div className="main-area">
        <Header
          title={title}
          subtitle={subtitle}
          user={user}
          onMenu={() => setSidebarOpen(true)}
          onNotifications={() => navigate("/alertas")}
          onProfile={() => navigate("/perfil")}
          onSearch={handleSearch}
        />
        <main className="page-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clima" element={<Clima />} />
            <Route path="/previsoes" element={<Previsoes />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/relatorios" element={<Relatorios onNotice={showNotice} />} />
            <Route path="/usuarios" element={<Usuarios user={user} onNotice={showNotice} />} />
            <Route path="/perfil" element={<Perfil user={user} setUser={setUser} onNotice={showNotice} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        {notice && <div className="toast"><span />{notice}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [logged, setLogged] = useState(false);
  const [user, setUser] = useState({
    name: "Matheus Paulo",
    email: "matheus@raisin-tech.com",
    role: "Administrador",
    phone: "(87) 99999-0000",
    company: "Raisin Tech",
    location: "Petrolina / Juazeiro"
  });

  if (!logged) {
    if (location.pathname === "/recuperar-senha") {
      return <ForgotPassword />;
    }
    return <Login onLogin={() => setLogged(true)} />;
  }

  return (
    <ProtectedLayout
      onLogout={() => setLogged(false)}
      user={user}
      setUser={setUser}
    />
  );
}
