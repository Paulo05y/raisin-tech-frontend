import { useEffect, useState } from "react";
import { CloudRain, Droplets, Thermometer, ThermometerSun, ThermometerSnowflake } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import LineChart from "../components/LineChart";
import api from "../services/api";
import { montarSerie, paraDataLocal, paraParametro } from "../utils/serieClimatica";

const HORAS_JANELA = 48;
const MINUTOS_ONLINE = 10; // sem leitura há mais que isso = sensor offline
const FAIXA_UMIDADE = [60, 75];
const ATUALIZACAO_MS = 15000;

const fmt = (n) => Number(n).toFixed(1).replace(".", ",");
const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

export default function Clima() {
  const [ultima, setUltima] = useState(null);
  const [leituras, setLeituras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      const fim = new Date();
      const inicio = new Date(fim.getTime() - HORAS_JANELA * 60 * 60 * 1000);

      const [resUltima, resLeituras] = await Promise.all([
        api.get("/api/leituras-climaticas/ultima"),
        api.get("/api/leituras-climaticas", {
          params: { inicio: paraParametro(inicio), fim: paraParametro(fim) },
        }),
      ]);

      setUltima(resUltima.data || null);
      setLeituras(resLeituras.data || []);
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

  const serie = montarSerie(leituras);
  const pontos = serie.pontos;
  const temps = pontos.map((p) => p.temperatura);
  const umids = pontos.map((p) => p.umidade);
  const labels = pontos.map((p) => p.label);
  const temGrafico = pontos.length >= 2;

  const todasTemps = leituras.map((l) => l.temperatura);
  const maxTemp = todasTemps.length ? Math.max(...todasTemps) : null;
  const minTemp = todasTemps.length ? Math.min(...todasTemps) : null;

  const dataUltima = ultima ? paraDataLocal(ultima.dataHora) : null;
  const minutosSemLeitura = dataUltima ? (Date.now() - dataUltima.getTime()) / 60000 : null;
  const sensorOnline = minutosSemLeitura !== null && minutosSemLeitura <= MINUTOS_ONLINE;
  const umidadeOk = ultima && ultima.umidade >= FAIXA_UMIDADE[0] && ultima.umidade <= FAIXA_UMIDADE[1];
  const subtitulo = `Últimas ${HORAS_JANELA} horas${serie.descricao ? ` • ${serie.descricao}` : ""}`;

  return (
    <>
      {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

      <div className="stats-grid">
        <StatCard
          icon={Thermometer}
          label="Temperatura atual"
          value={ultima ? `${fmt(ultima.temperatura)} °C` : "—"}
          detail={sensorOnline ? "Sensor ativo" : "Sensor sem leituras recentes"}
        />
        <StatCard
          icon={Droplets}
          label="Umidade"
          value={ultima ? `${Math.round(ultima.umidade)}%` : "—"}
          detail={ultima ? `Faixa ideal: ${FAIXA_UMIDADE[0]}–${FAIXA_UMIDADE[1]}% • ${umidadeOk ? "dentro" : "fora"}` : "Aguardando leituras"}
          tone="blue"
        />
        <StatCard
          icon={ThermometerSun}
          label={`Máxima (${HORAS_JANELA}h)`}
          value={maxTemp !== null ? `${fmt(maxTemp)} °C` : "—"}
          detail={maxTemp !== null ? `${leituras.length} leituras no período` : "Sem leituras no período"}
          tone="orange"
        />
        <StatCard
          icon={ThermometerSnowflake}
          label={`Mínima (${HORAS_JANELA}h)`}
          value={minTemp !== null ? `${fmt(minTemp)} °C` : "—"}
          detail={minTemp !== null ? `${leituras.length} leituras no período` : "Sem leituras no período"}
          tone="purple"
        />
      </div>

      <div className="two-column">
        <SectionCard title="Temperatura e umidade" subtitle={subtitulo}>
          {temGrafico ? (
            <>
              <div className="chart-summary">
                <strong>Temperatura</strong>
                <span>Média: {fmt(media(temps))} °C</span>
              </div>
              <LineChart values={temps} labels={labels} unit="°C" titleFormat={(v) => `${fmt(v)} °C`} stroke="#7A16F8" gradientId="climaTempGradient" />

              <div className="chart-summary" style={{ marginTop: 24 }}>
                <strong>Umidade</strong>
                <span>Média: {fmt(media(umids))}%</span>
              </div>
              <LineChart values={umids} labels={labels} unit="%" titleFormat={(v) => `${fmt(v)}%`} stroke="#5C4AE4" gradientId="climaHumidityGradient" />
            </>
          ) : (
            <div className="empty-state">
              <strong>{carregando ? "Carregando..." : "Dados insuficientes para o gráfico."}</strong>
              <span>São necessárias pelo menos 2 leituras nas últimas {HORAS_JANELA}h.</span>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Status dos sensores" subtitle="Integração ThingSpeak">
          <div className="sensor-row">
            <div className="sensor-name"><span className={`status-dot ${sensorOnline ? "" : "offline"}`} />Sensor principal</div>
            <strong>{sensorOnline ? "Online" : "Offline"}</strong>
          </div>
          <div className="sensor-last">
            <CloudRain size={17} />
            {dataUltima
              ? ` Última atualização: ${dataUltima.toLocaleString("pt-BR")}`
              : " Nenhuma leitura recebida ainda"}
          </div>
        </SectionCard>
      </div>
    </>
  );
}