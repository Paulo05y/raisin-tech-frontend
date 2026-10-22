import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import SectionCard from "../components/SectionCard";
import api from "../services/api";

// Valores exatos do enum PerfilUsuario do backend
const PERFIS = {
  ADMINISTRADOR: "Administrador",
  ANALISTA_DADOS: "Analista de Dados",
  PRODUTOR_EXPORTADOR: "Produtor Exportador",
};

const VAZIO = { nome: "", email: "", perfil: "", telefone: "", empresa: "", localizacao: "" };

export default function Perfil({ user, setUser, onNotice }) {
  const [form, setForm] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get("/api/usuarios/me");
        const d = res.data;
        setForm({
          nome: d.nome || "",
          email: d.email || "",
          perfil: d.perfil || "",
          telefone: d.telefone || "",
          empresa: d.empresa || "",
          localizacao: d.localizacao || "",
        });
        // Sincroniza o usuário global (Header e Sidebar) com os dados reais
        setUser((atual) => ({
          ...atual,
          name: d.nome,
          phone: d.telefone || "",
          company: d.empresa || "",
          location: d.localizacao || "",
        }));
        setErro("");
      } catch (e) {
        setErro("Não foi possível carregar seu perfil do servidor.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atualizar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function salvar(event) {
    event.preventDefault();
    setSalvando(true);
    try {
      const res = await api.put("/api/usuarios/me", form);
      const d = res.data;

      setUser((atual) => ({
        ...atual,
        name: d.nome,
        phone: d.telefone || "",
        company: d.empresa || "",
        location: d.localizacao || "",
      }));

      // Mantém o nome atualizado também ao recarregar a página
      try {
        const salvo = JSON.parse(localStorage.getItem("usuario") || "{}");
        localStorage.setItem("usuario", JSON.stringify({ ...salvo, nome: d.nome }));
      } catch {
        /* ignora */
      }

      onNotice("Perfil atualizado com sucesso.");
    } catch (e) {
      onNotice("Não foi possível salvar o perfil. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const iniciais = (form.nome || user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SectionCard title="Meu perfil" subtitle="Dados da sua conta">
      {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

      {carregando ? (
        <div className="empty-state"><strong>Carregando...</strong></div>
      ) : (
        <form className="user-form" onSubmit={salvar}>
          <div className="user-cell" style={{ marginBottom: 16 }}>
            <div className="avatar">{iniciais}</div>
            <div>
              <strong>{form.nome}</strong>
              <div><span className="tag success">{PERFIS[form.perfil] || form.perfil}</span></div>
            </div>
          </div>

          <label>Nome completo
            <input value={form.nome} onChange={atualizar("nome")} required />
          </label>

          <label>E-mail
            <input value={form.email} disabled />
          </label>

          <label>Perfil de acesso
            <input value={PERFIS[form.perfil] || form.perfil} disabled />
          </label>

          <label>Telefone
            <input value={form.telefone} onChange={atualizar("telefone")} placeholder="(87) 99999-9999" />
          </label>

          <label>Empresa
            <input value={form.empresa} onChange={atualizar("empresa")} placeholder="Ex.: Raisin Tech" />
          </label>

          <label>Localização
            <input value={form.localizacao} onChange={atualizar("localizacao")} placeholder="Ex.: Petrolina / Juazeiro" />
          </label>

          <div className="modal-actions">
            <button className="primary-button" disabled={salvando}>
              <Save size={17} /> {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}