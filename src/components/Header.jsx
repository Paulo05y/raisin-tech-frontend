import { Bell, Menu, Search, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";

const searchTargets = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Clima", path: "/clima" },
  { label: "Previsões", path: "/previsoes" },
  { label: "Histórico", path: "/historico" },
  { label: "Alertas", path: "/alertas" },
  { label: "Relatórios", path: "/relatorios" },
  { label: "Usuários", path: "/usuarios" },
  { label: "Meu perfil", path: "/perfil" }
];

export default function Header({ title, subtitle, user, onMenu, onNotifications, onProfile, onSearch }) {
  const [term, setTerm] = useState("");
  const [focused, setFocused] = useState(false);
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const suggestions = useMemo(() => {
    const value = term.trim().toLowerCase();
    if (!value) return searchTargets.slice(0, 5);
    return searchTargets.filter((item) => item.label.toLowerCase().includes(value)).slice(0, 5);
  }, [term]);

  const submit = (event) => {
    event.preventDefault();
    onSearch(term);
    setFocused(false);
  };

  const choose = (path) => {
    const item = searchTargets.find((target) => target.path === path);
    setTerm(item?.label || "");
    setFocused(false);
    onSearch(item?.label || "");
  };

  return (
    <header className="topbar">
      <div className="title-wrap">
        <button className="mobile-menu" onClick={onMenu} aria-label="Abrir menu"><Menu size={22} /></button>
        <div><h1>{title}</h1><p>{subtitle}</p></div>
      </div>
      <div className="top-actions">
        <form className="search-box" onSubmit={submit}>
          <Search size={17} />
          <input value={term} onFocus={() => setFocused(true)} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar..." aria-label="Buscar telas" />
          {term && <button type="button" className="search-clear" onClick={() => setTerm("")} aria-label="Limpar busca"><X size={14}/></button>}
          {focused && <div className="search-results">
            {suggestions.length ? suggestions.map((item) => (
              <button type="button" key={item.path} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(item.path)}>
                <Search size={14}/><span>{item.label}</span>
              </button>
            )) : <div className="search-empty">Nenhuma tela encontrada</div>}
          </div>}
        </form>
        <button className="icon-button notification-button" onClick={onNotifications} aria-label="Abrir alertas"><Bell size={20} /><span /></button>
        <button className="top-user top-user-button" onClick={onProfile} aria-label="Abrir meu perfil">
          <div className="avatar">{initials}</div>
          <div className="top-user-info"><strong>{user.name}</strong><small>{user.role}</small></div>
          <UserRound size={15} className="profile-chevron" />
        </button>
      </div>
    </header>
  );
}
