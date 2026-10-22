import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import SectionCard from "../components/SectionCard";
import api from "../services/api";

// Níveis exatos do enum NivelAlerta do backend
const ESTILO = {
  INFO: { type: "info", icon: Info, titulo: "Informação" },
  ATENCAO: { type: "warning", icon: AlertTriangle, titulo: "Atenção" },
  CRITICO: { type: "danger", icon: XCircle, titulo: "Crítico" },
};

function formatarDataHora(dataHora) {
  const d = new Date(dataHora);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`;
  if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hora}`;
  return `${d.toLocaleDateString("pt-BR")} ${hora}`;
}

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      const res = await api.get("/api/alertas/nao-lidos");
      setAlertas(res.data || []);
      setErro("");
    } catch (e) {
      setErro("Não foi possível carregar os alertas do servidor.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 30000);
    return () => clearInterval(id);
  }, []);

  async function marcarLido(id) {
    try {
      await api.patch(`/api/alertas/${id}/marcar-lido`);
      setAlertas((atual) => atual.filter((a) => a.id !== id));
    } catch (e) {
      setErro("Não foi possível marcar o alerta como lido.");
    }
  }

  return (
    <SectionCard title="Central de alertas" subtitle="Alertas não lidos gerados a partir das leituras do sensor">
      {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

      <div className="full-alert-list">
        {carregando && <div className="empty-state"><strong>Carregando...</strong></div>}
        {!carregando && !erro && alertas.length === 0 && (
          <div className="empty-state"><strong>Nenhum alerta pendente.</strong><span>Tudo certo por aqui.</span></div>
        )}
        {alertas.map((a) => {
          const { type, icon: Icon, titulo } = ESTILO[a.nivel] || ESTILO.INFO;
          return (
            <div className={`full-alert ${type}`} key={a.id}>
              <div className="full-alert-icon"><Icon size={21} /></div>
              <div>
                <strong>{titulo}</strong>
                <p>{a.mensagem}</p>
                <small>{formatarDataHora(a.dataHora)}</small>
              </div>
              <button type="button" className="secondary-button small" onClick={() => marcarLido(a.id)}>
                Marcar como lido
              </button>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}