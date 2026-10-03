import { Edit3, MoreHorizontal, Plus, Shield, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "../components/SectionCard";

const initialUsers = [
  { name: "Matheus Paulo", email: "matheus@raisin-tech.com", role: "Administrador", status: "Ativo" },
  { name: "João Silva", email: "joao@raisin-tech.com", role: "Produtor", status: "Ativo" },
  { name: "Maria Souza", email: "maria@raisin-tech.com", role: "Analista de Dados", status: "Ativo" },
  { name: "Carlos Lima", email: "carlos@raisin-tech.com", role: "Produtor", status: "Inativo" }
];

export default function Usuarios({ user, onNotice }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [menuEmail, setMenuEmail] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "Produtor" });

  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === "Administrador").length,
    analysts: users.filter((u) => u.role === "Analista de Dados").length
  }), [users]);

  const addUser = (event) => {
    event.preventDefault();
    const exists = users.some((u) => u.email.toLowerCase() === form.email.toLowerCase());
    if (exists) {
      onNotice("Já existe um usuário com esse e-mail.");
      return;
    }
    setUsers((current) => [...current, { ...form, status: "Ativo" }]);
    setForm({ name: "", email: "", role: "Produtor" });
    setShowModal(false);
    onNotice("Novo usuário adicionado com sucesso.");
  };

  const toggleStatus = (email) => {
    setUsers((current) => current.map((item) => item.email === email ? { ...item, status: item.status === "Ativo" ? "Inativo" : "Ativo" } : item));
    onNotice("Status do usuário atualizado.");
    setMenuEmail("");
  };

  return (
    <>
      <SectionCard title="Usuários e permissões" subtitle="Controle de acesso baseado em perfil"
        action={<button className="primary-button small" onClick={() => setShowModal(true)}><Plus size={17}/> Novo usuário</button>}>
        <div className="roles-summary">
          <div><UserPlus size={18}/><span>Usuários</span><strong>{counts.total}</strong></div>
          <div><Shield size={18}/><span>Administradores</span><strong>{counts.admins}</strong></div>
          <div><Edit3 size={18}/><span>Analistas</span><strong>{counts.analysts}</strong></div>
        </div>
        <div className="table-wrap"><table><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Status</th><th></th></tr></thead><tbody>
          {users.map((item) => {
            const initials = item.name.split(" ").map((x) => x[0]).slice(0,2).join("").toUpperCase();
            return <tr key={item.email}>
              <td><div className="user-cell"><div className="avatar small-avatar">{initials}</div><strong>{item.name}</strong></div></td>
              <td>{item.email}</td><td>{item.role}</td>
              <td><span className={`tag ${item.status === "Ativo" ? "success" : "orange"}`}>{item.status}</span></td>
              <td className="action-cell">
                <button className="more-button" onClick={() => setMenuEmail(menuEmail === item.email ? "" : item.email)} aria-label={`Ações para ${item.name}`}><MoreHorizontal size={19}/></button>
                {menuEmail === item.email && <div className="user-action-menu">
                  {item.email === user.email && <button onClick={() => { navigate("/perfil"); setMenuEmail(""); }}>Ver meu perfil</button>}
                  <button onClick={() => toggleStatus(item.email)}>{item.status === "Ativo" ? "Desativar usuário" : "Ativar usuário"}</button>
                </div>}
              </td>
            </tr>;
          })}
        </tbody></table></div>
        <div className="users-note"><Shield size={15}/> O controle de acesso deve ser conectado ao RBAC do backend na integração final.</div>
      </SectionCard>

      {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
        <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-header"><div><h3>Novo usuário</h3><p>Cadastre uma pessoa para acessar a Raisin Tech.</p></div><button className="modal-close" onClick={() => setShowModal(false)} aria-label="Fechar"><X size={20}/></button></div>
          <form className="user-form" onSubmit={addUser}>
            <label>Nome completo<input value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} placeholder="Ex.: Ana Beatriz" required /></label>
            <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} placeholder="ana@raisin-tech.com" required /></label>
            <label>Perfil<select value={form.role} onChange={(e) => setForm({...form, role:e.target.value})}><option>Produtor</option><option>Analista de Dados</option><option>Administrador</option></select></label>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowModal(false)}>Cancelar</button><button className="primary-button">Adicionar usuário</button></div>
          </form>
        </div>
      </div>}
    </>
  );
}
