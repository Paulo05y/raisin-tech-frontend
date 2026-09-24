import {
  BarChart3, Bell, CloudSun, FileText, History, LayoutDashboard,
  Leaf, LogOut, Settings, ShieldCheck, Truck, Users, X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "../assets/raisin-tech-logo.png";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clima", label: "Clima", icon: CloudSun },
  { to: "/mercado", label: "Mercado", icon: BarChart3 },
  { to: "/logistica", label: "Logística", icon: Truck },
  { to: "/previsoes", label: "Previsões", icon: Leaf },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
  { to: "/usuarios", label: "Usuários", icon: Users }
];

export default function Sidebar({ open, onClose, onLogout, role }) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <img className="sidebar-logo" src={logo} alt="Raisin Tech" />
          <button className="mobile-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="sidebar-section">
          <span className="section-label">MENU PRINCIPAL</span>
          <nav>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar">MP</div>
            <div>
              <strong>Matheus Paulo</strong>
              <span>{role}</span>
            </div>
          </div>
          <button className="nav-item logout" onClick={onLogout}>
            <LogOut size={19} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}