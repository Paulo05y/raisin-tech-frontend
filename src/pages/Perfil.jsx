import { Check, Mail, MapPin, Pencil, Phone, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import SectionCard from "../components/SectionCard";

export default function Perfil({ user, setUser, onNotice }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user);
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  const save = (event) => {
    event.preventDefault();
    setUser(form);
    setEditing(false);
    onNotice("Perfil atualizado com sucesso.");
  };

  return (
    <div className="profile-page">
      <SectionCard className="profile-hero-card">
        <div className="profile-hero">
          <div className="profile-avatar-large">{initials}</div>
          <div className="profile-summary"><span className="eyebrow">CONTA ATIVA</span><h2>{user.name}</h2><p>{user.role} • {user.company}</p><div className="profile-status"><span className="status-dot"/> Usuário ativo</div></div>
          <button className="primary-button small" onClick={() => { setForm(user); setEditing(true); }}><Pencil size={16}/> Editar perfil</button>
        </div>
      </SectionCard>

      <div className="profile-grid">
        <SectionCard title="Informações pessoais" subtitle="Dados usados na sua conta">
          <div className="profile-info-grid">
            <div><UserRound size={17}/><span>Nome</span><strong>{user.name}</strong></div>
            <div><Mail size={17}/><span>E-mail</span><strong>{user.email}</strong></div>
            <div><Phone size={17}/><span>Telefone</span><strong>{user.phone}</strong></div>
            <div><MapPin size={17}/><span>Operação</span><strong>{user.location}</strong></div>
          </div>
        </SectionCard>
        <SectionCard title="Permissões" subtitle="Perfil de acesso atual">
          <div className="permission-card"><div className="permission-icon"><ShieldCheck size={23}/></div><div><strong>{user.role}</strong><p>Acesso administrativo às áreas liberadas do sistema.</p></div></div>
          <div className="permission-list"><div><Check size={15}/> Visualizar dashboard</div><div><Check size={15}/> Monitorar clima</div><div><Check size={15}/> Visualizar previsões</div><div><Check size={15}/> Gerenciar usuários</div></div>
        </SectionCard>
      </div>

      <SectionCard title="Preferências da conta" subtitle="Configurações demonstrativas">
        <div className="preference-row"><div><strong>Alertas do sistema</strong><span>Receber avisos quando houver condições importantes.</span></div><label className="switch"><input type="checkbox" defaultChecked/><span /></label></div>
        <div className="preference-row"><div><strong>Resumo diário</strong><span>Resumo das condições climáticas da operação.</span></div><label className="switch"><input type="checkbox" defaultChecked/><span /></label></div>
      </SectionCard>

      {editing && <div className="modal-backdrop" onMouseDown={() => setEditing(false)}>
        <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-header"><div><h3>Editar perfil</h3><p>Atualize os dados da sua conta.</p></div><button className="modal-close" onClick={() => setEditing(false)}><X size={20}/></button></div>
          <form className="user-form" onSubmit={save}>
            <label>Nome completo<input value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} required /></label>
            <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} required /></label>
            <label>Telefone<input value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} /></label>
            <label>Operação<input value={form.location} onChange={(e) => setForm({...form, location:e.target.value})} /></label>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditing(false)}>Cancelar</button><button className="primary-button"><Save size={16}/> Salvar alterações</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
