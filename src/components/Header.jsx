import { Bell, Menu, Search } from "lucide-react";

export default function Header({ title, subtitle, userName, onMenu, onNotifications }) {
  return (
    <header className="topbar">
      <div className="title-wrap">
        <button className="mobile-menu" onClick={onMenu}><Menu size={22} /></button>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="top-actions">
        <div className="search-box">
          <Search size={17} />
          <input placeholder="Buscar..." />
        </div>
        <button className="icon-button notification-button" onClick={onNotifications}>
          <Bell size={20} />
          <span />
        </button>
        <div className="top-user">
          <div className="avatar">MP</div>
          <div className="top-user-info">
            <strong>{userName}</strong>
            <small>Administrador</small>
          </div>
        </div>
      </div>
    </header>
  );
}