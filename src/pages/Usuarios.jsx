import { Edit3, MoreHorizontal, Plus, Shield, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import api from "../services/api";

// Valores exatos do enum PerfilUsuario do backend
const PERFIS = {
  ADMINISTRADOR: "Administrador",
  ANALISTA_DADOS: "Analista de Dados",
  PRODUTOR_EXPORTADOR: "Produtor Exportador",
};

const FORM_VAZIO = { nome: "", email: "", senha: "", perfil: "PRODUTOR_EXPORTADOR" };

export default function Usuarios({ user, onNotice }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);

  async function carregar() {
    try {
      const res = await api.get("/api/usuarios");
      setUsers(res.data || []);
      setErro("");
    } catch (e) {
      if (e.response?.status === 403) {
        setErro("Apenas administradores podem acessar a gestão de usuários.");
      } else {
        setErro("Não foi possível carregar os usuários do servidor.");
      }
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.perfil === "ADMINISTRADOR").length,
    analysts: users.filter((u) => u.perfil === "ANALISTA_DADOS").length,
  }), [users]);

  async function addUser(event) {
    event.preventDefault();
    setSalvando(true);
    try {
      await api.post("/api/usuarios/cadastro", form);
      setForm(FORM_VAZIO);
      setShowModal(false);
      await carregar();
      onNotice("Novo usuário adicionado com sucesso.");
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.mensagem;
      onNotice(msg || "Não foi possível cadastrar. Verifique os dados (e-mail já existe? senha com 6+ caracteres?).");
    } finally {
      setSalvando(false);
    }
  }

  async function toggleStatus(item) {
    setMenuId(null);
    try {
      const res = await api.put(`/api/usuarios/${item.id}/ativo`, { ativo: !item.ativo });
      setUsers((atual) => atual.map((u) => (u.id === item.id ? res.data : u)));
      onNotice("Status do usuário atualizado.");
    } catch (e) {
      onNotice("Não foi possível alterar o status deste usuário.");
    }
  }

  return (
    <>
      <SectionCard title="Usuários e permissões" subtitle="Controle de acesso baseado em perfil"
        action={<button className="primary-button small" onClick={() => setShowModal(true)}><Plus size={17}/> Novo usuário</button>}>
        <div className="roles-summary">
          <div><UserPlus size={18}/><span>Usuários</span><strong>{counts.total}</strong></div>
          <div><Shield size={18}/><span>Administradores</span><strong>{counts.admins}</strong></div>
          <div><Edit3 size={18}/><span>Analistas</span><strong>{counts.analysts}</strong></div>
        </div>

        {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

        <div className="table-wrap">
          {carregando ? (
            <div className="empty-state"><strong>Carregando...</strong></div>
          ) : users.length === 0 && !erro ? (
            <div className="empty-state"><strong>Nenhum usuário cadastrado.</strong></div>
          ) : (
            <table><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Status</th><th></th></tr></thead><tbody>
              {users.map((item) => {
                const initials = item.nome.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
                const ehEu = item.email === user.email;
                return <tr key={item.id}>
                  <td><div className="user-cell"><div className="avatar small-avatar">{initials}</div><strong>{item.nome}</strong></div></td>
                  <td>{item.email}</td>
                  <td>{PERFIS[item.perfil] || item.perfil}</td>
                  <td><span className={`tag ${item.ativo ? "success" : "orange"}`}>{item.ativo ? "Ativo" : "Inativo"}</span></td>
                  <td className="action-cell">
                    <button className="more-button" onClick={() => setMenuId(menuId === item.id ? null : item.id)} aria-label={`Ações para ${item.nome}`}><MoreHorizontal size={19}/></button>
                    {menuId === item.id && <div className="user-action-menu">
                      {ehEu && <button onClick={() => { navigate("/perfil"); setMenuId(null); }}>Ver meu perfil</button>}
                      {!ehEu && <button onClick={() => toggleStatus(item)}>{item.ativo ? "Desativar usuário" : "Ativar usuário"}</button>}
                    </div>}
                  </td>
                </tr>;
              })}
            </tbody></table>
          )}
        </div>
        <div className="users-note"><Shield size={15}/> Apenas administradores podem listar, cadastrar e ativar/desativar usuários.</div>
      </SectionCard>

      {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
        <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-header"><div><h3>Novo usuário</h3><p>Cadastre uma pessoa para acessar a Raisin Tech.</p></div><button className="modal-close" onClick={() => setShowModal(false)} aria-label="Fechar"><X size={20}/></button></div>
          <form className="user-form" onSubmit={addUser}>
            <label>Nome completo<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Ana Beatriz" required /></label>
            <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ana@raisin-tech.com" required /></label>
            <label>Senha<input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo 6 caracteres" minLength={6} required /></label>
            <label>Perfil<select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
              {Object.entries(PERFIS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select></label>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowModal(false)}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando ? "Salvando..." : "Adicionar usuário"}</button></div>
          </form>
        </div>
      </div>}
    </>
  );
}