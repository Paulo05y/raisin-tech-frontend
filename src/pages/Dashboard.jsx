import { useEffect, useState } from "react";
import { Activity, Droplets, Thermometer } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import LineChart from "../components/LineChart";
import api from "../services/api";

const HORAS_JANELA = 12;
const FAIXA_UMIDADE = [60, 75];

const fmt = (n) => Number(n).toFixed(1).replace(".", ",");

// O backend guarda o horário do ThingSpeak em UTC (sem fuso), então marcamos com "Z"
// para o navegador converter para o horário local.
const paraDataLocal = (dataHora) => new Date(`${dataHora}Z`);

// A API espera data/hora ISO sem fuso, em UTC
const paraParametro = (data) => data.toISOString().slice(0, 19);

// Agrupa as leituras por hora (média), para o gráfico ficar com poucos pontos
function agruparPorHora(leituras) {
  const grupos = new Map();
  leituras.forEach((l) => {
    const d = paraDataLocal(l.dataHora);
    const chave = new Date(d).setMinutes(0, 0, 0);
    if (!grupos.has(chave)) grupos.set(chave, { temps: [], umids: [] });
    grupos.get(chave).temps.push(l.temperatura);
    grupos.get(chave).umids.push(l.umidade);
  });

  const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return [...grupos.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([chave, g]) => ({
      label: `${String(new Date(chave).getHours()).padStart(2, "0")}h`,
      temperatura: Number(media(g.temps).toFixed(1)),
      umidade: Number(media(g.umids).toFixed(1)),
    }));
}

// Ajuste os nomes aqui quando eu vir o enum NivelAlerta
const TIPO_POR_NIVEL = { INFO: "info", ATENCAO: "warning", CRITICO: "danger" };

const simbolo = { success: "✓", warning: "!", info: "i", danger: "×" };

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

export default function Dashboard() {
  const [ultima, setUltima] = useState(null);
  const [serie, setSerie] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      const fim = new Date();
      const inicio = new Date(fim.getTime() - HORAS_JANELA * 60 * 60 * 1000);

      const [resUltima, resLeituras, resAlertas] = await Promise.all([
        api.get("/api/leituras-climaticas/ultima"),
        api.get("/api/leituras-climaticas", {
          params: { inicio: paraParametro(inicio), fim: paraParametro(fim) },
        }),
        api.get("/api/alertas/nao-lidos"),
      ]);

      setUltima(resUltima.data || null);
      setSerie(agruparPorHora(resLeituras.data || []));
      setAlertas(resAlertas.data || []);
      setErro("");
    } catch (e) {
      setErro("Não foi possível carregar os dados do servidor.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 30000); // atualiza a cada 30s
    return () => clearInterval(id);
  }, []);

  const temps = serie.map((p) => p.temperatura);
  const umids = serie.map((p) => p.umidade);
  const labels = serie.map((p) => p.label);
  const temGrafico = serie.length >= 2;

  const variacaoTemp = temGrafico ? temps[temps.length - 1] - temps[0] : null;
  const umidadeOk = ultima && ultima.umidade >= FAIXA_UMIDADE[0] && ultima.umidade <= FAIXA_UMIDADE[1];

  const dataExtenso = new Date()
    .toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    .toUpperCase();

  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">{dataExtenso}</span>
          <h2>Visão geral da operação</h2>
          <p>Acompanhe as condições para tomar decisões mais seguras.</p>
        </div>
        <div className="status-pill">
          <span className={`status-dot ${erro ? "offline" : ""}`} />
          {erro ? "Sem conexão com o servidor" : "Sistema operacional"}
        </div>
      </div>

      {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

      <div className="stats-grid">
        <StatCard
          icon={Thermometer}
          label="Temperatura"
          value={ultima ? `${fmt(ultima.temperatura)} °C` : "—"}
          detail={
            variacaoTemp !== null
              ? `Atual • ${variacaoTemp >= 0 ? "+" : ""}${fmt(variacaoTemp)} °C em ${HORAS_JANELA}h`
              : "Aguardando leituras"
          }
        />
        <StatCard
          icon={Droplets}
          label="Umidade"
          value={ultima ? `${Math.round(ultima.umidade)}%` : "—"}
          detail={
            ultima
              ? `Atual • ${umidadeOk ? "dentro do ideal" : "fora da faixa ideal"} (${FAIXA_UMIDADE[0]}–${FAIXA_UMIDADE[1]}%)`
              : "Aguardando leituras"
          }
          tone="blue"
        />
      </div>

      <div className="dashboard-grid">
        <SectionCard title="Temperatura" subtitle={`Últimas ${HORAS_JANELA} horas`} action={<span className="metric-badge">°C</span>}>
          {temGrafico ? (
            <>
              <div className="chart-summary">
                <strong>{fmt(temps[temps.length - 1])}°C</strong>
                <span>{variacaoTemp >= 0 ? "+" : ""}{fmt(variacaoTemp)}°C desde {labels[0]}</span>
              </div>
              <LineChart values={temps} labels={labels} unit="°C" titleFormat={(v) => `${fmt(v)} °C`} stroke="#7A16F8" gradientId="tempGradient" />
            </>
          ) : (
            <div className="empty-state">
              <strong>{carregando ? "Carregando..." : "Dados insuficientes para o gráfico."}</strong>
              <span>São necessárias leituras em pelo menos 2 horas diferentes.</span>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Umidade relativa" subtitle={`Últimas ${HORAS_JANELA} horas`} action={<span className="metric-badge">%</span>}>
          {temGrafico ? (
            <>
              <div className="chart-summary">
                <strong>{Math.round(umids[umids.length - 1])}%</strong>
                <span>Média das últimas {HORAS_JANELA}h: {fmt(umids.reduce((a, b) => a + b, 0) / umids.length)}%</span>
              </div>
              <LineChart values={umids} labels={labels} unit="%" titleFormat={(v) => `${fmt(v)}%`} stroke="#5C4AE4" gradientId="humidityGradient" />
            </>
          ) : (
            <div className="empty-state">
              <strong>{carregando ? "Carregando..." : "Dados insuficientes para o gráfico."}</strong>
              <span>São necessárias leituras em pelo menos 2 horas diferentes.</span>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Alertas recentes" subtitle="Alertas não lidos">
          <div className="alert-list">
            {alertas.length === 0 && !carregando && (
              <div className="empty-state"><strong>Nenhum alerta pendente.</strong></div>
            )}
            {alertas.slice(0, 3).map((a) => {
              const tipo = TIPO_POR_NIVEL[a.nivel] || "info";
              return (
                <div className={`alert-item ${tipo}`} key={a.id}>
                  <span className="alert-symbol">{simbolo[tipo]}</span>
                  <div>
                    <strong>{a.mensagem}</strong>
                    <small>{formatarDataHora(a.dataHora)}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-footer-note">
        <Activity size={16} />
        {ultima
          ? `Última leitura: ${paraDataLocal(ultima.dataHora).toLocaleString("pt-BR")} • atualização automática a cada 30s`
          : "Aguardando a primeira leitura do sensor."}
      </div>
    </>
  );
}