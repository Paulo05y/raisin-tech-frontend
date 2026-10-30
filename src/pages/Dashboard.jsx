import { useEffect, useState } from "react";
import { Activity, Droplets, Thermometer } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import LineChart from "../components/LineChart";
import api from "../services/api";
import { montarSerie, paraDataLocal, paraParametro } from "../utils/serieClimatica";
import { FAIXA_UMIDADE } from "../utils/criterios";

const HORAS_JANELA = 12;
const ATUALIZACAO_MS = 15000;

const fmt = (n) => Number(n).toFixed(1).replace(".", ",");

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
  const [serie, setSerie] = useState({ pontos: [], descricao: "" });
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
      setSerie(montarSerie(resLeituras.data || []));
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
    const id = setInterval(carregar, ATUALIZACAO_MS);
    return () => clearInterval(id);
  }, []);

  const pontos = serie.pontos;
  const temps = pontos.map((p) => p.temperatura);
  const umids = pontos.map((p) => p.umidade);
  const labels = pontos.map((p) => p.label);
  const temGrafico = pontos.length >= 2;

  const variacaoTemp = temGrafico ? temps[temps.length - 1] - temps[0] : null;
  const umidadeOk = ultima && ultima.umidade >= FAIXA_UMIDADE[0] && ultima.umidade <= FAIXA_UMIDADE[1];
  const subtitulo = `Últimas ${HORAS_JANELA} horas${serie.descricao ? ` • ${serie.descricao}` : ""}`;

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
              ? `Atual • ${variacaoTemp >= 0 ? "+" : ""}${fmt(variacaoTemp)} °C no período do gráfico`
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
        <SectionCard title="Temperatura" subtitle={subtitulo} action={<span className="metric-badge">°C</span>}>
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
              <span>São necessárias pelo menos 2 leituras no período.</span>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Umidade relativa" subtitle={subtitulo} action={<span className="metric-badge">%</span>}>
          {temGrafico ? (
            <>
              <div className="chart-summary">
                <strong>{Math.round(umids[umids.length - 1])}%</strong>
                <span>Média no período do gráfico: {fmt(umids.reduce((a, b) => a + b, 0) / umids.length)}%</span>
              </div>
              <LineChart values={umids} labels={labels} unit="%" titleFormat={(v) => `${fmt(v)}%`} stroke="#5C4AE4" gradientId="humidityGradient" />
            </>
          ) : (
            <div className="empty-state">
              <strong>{carregando ? "Carregando..." : "Dados insuficientes para o gráfico."}</strong>
              <span>São necessárias pelo menos 2 leituras no período.</span>
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
          ? `Última leitura: ${paraDataLocal(ultima.dataHora).toLocaleString("pt-BR")} • atualização automática a cada ${ATUALIZACAO_MS / 1000}s`
          : "Aguardando a primeira leitura do sensor."}
      </div>
    </>
  );
}