import {
  Bell, CloudSun, FileText, History, LayoutDashboard,
  Leaf, LogOut, Users, UserCircle, X
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/raisin-tech-logo.png";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clima", label: "Clima", icon: CloudSun },
  { to: "/previsoes", label: "Previsões", icon: Leaf },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
  { to: "/usuarios", label: "Usuários", icon: Users }
];

export default function Sidebar({ open, onClose, onLogout, role, user }) {
  const navigate = useNavigate();
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <div className={`sidebar-overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <img className="sidebar-logo" src={logo} alt="Raisin Tech" />
          <button className="mobile-close" onClick={onClose} aria-label="Fechar menu"><X size={20} /></button>
        </div>

        <div className="sidebar-section">
          <span className="section-label">MENU PRINCIPAL</span>
          <nav>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="profile-mini profile-mini-button" onClick={() => { navigate("/perfil"); onClose(); }}>
            <div className="avatar">{initials}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{role}</span>
            </div>
          </button>
          <button className="nav-item logout" onClick={onLogout}>
            <LogOut size={19} />
            <span>Sair</span>
          </button>
          <div className="profile-help"><UserCircle size={14}/> Clique no seu nome para abrir o perfil</div>
        </div>
      </aside>
    </>
  );
}
