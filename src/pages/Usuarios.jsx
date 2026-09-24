import { Edit3, MoreHorizontal, Plus, Shield, UserPlus } from "lucide-react";
import SectionCard from "../components/SectionCard";

const users = [
  ["Matheus Paulo","matheus@raisin-tech.com","Administrador","Ativo"],
  ["João Silva","joao@raisin-tech.com","Produtor","Ativo"],
  ["Maria Souza","maria@raisin-tech.com","Analista de Dados","Ativo"],
  ["Carlos Lima","carlos@raisin-tech.com","Produtor","Inativo"]
];

export default function Usuarios() {
  return (
    <SectionCard title="Usuários e permissões" subtitle="Controle de acesso baseado em perfil"
      action={<button className="primary-button small"><Plus size={17}/> Novo usuário</button>}>
      <div className="roles-summary">
        <div><UserPlus size={18}/><span>Usuários</span><strong>24</strong></div>
        <div><Shield size={18}/><span>Administradores</span><strong>3</strong></div>
        <div><Edit3 size={18}/><span>Analistas</span><strong>7</strong></div>
      </div>
      <div className="table-wrap"><table><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Status</th><th></th></tr></thead><tbody>
        {users.map(([name,email,role,status])=><tr key={email}><td><div className="user-cell"><div className="avatar small-avatar">{name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><strong>{name}</strong></div></td><td>{email}</td><td>{role}</td><td><span className={`tag ${status==="Ativo"?"success":"orange"}`}>{status}</span></td><td><button className="more-button"><MoreHorizontal size={19}/></button></td></tr>)}
      </tbody></table></div>
    </SectionCard>
  );
}