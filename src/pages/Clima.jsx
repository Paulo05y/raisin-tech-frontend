import { useEffect, useState } from "react";
import { CloudRain, Droplets, Thermometer, ThermometerSun, ThermometerSnowflake } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import LineChart from "../components/LineChart";
import api from "../services/api";

const HORAS_JANELA = 24;
const MINUTOS_ONLINE = 10; // sem leitura há mais que isso = sensor offline
const FAIXA_UMIDADE = [60, 75];

const fmt = (n) => Number(n).toFixed(1).replace(".", ",");
const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

// O back guarda o horário do ThingSpeak em UTC (sem fuso): marcamos com "Z"
// para o navegador converter para o horário local.
const paraDataLocal = (dataHora) => new Date(`${dataHora}Z`);

// A API espera data/hora ISO sem fuso, em UTC
const paraParametro = (d) => d.toISOString().slice(0, 19);

// Média por hora, mantendo no máximo as últimas 24 horas (rótulos sem repetição)
function agruparPorHora(leituras) {
  const grupos = new Map();
  leituras.forEach((l) => {
    const chave = new Date(paraDataLocal(l.dataHora)).setMinutes(0, 0, 0);
    if (!grupos.has(chave)) grupos.set(chave, { temps: [], umids: [] });
    grupos.get(chave).temps.push(l.temperatura);
    grupos.get(chave).umids.push(l.umidade);
  });

  return [...grupos.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-HORAS_JANELA)
    .map(([chave, g]) => ({
      label: `${String(new Date(chave).getHours()).padStart(2, "0")}h`,
      temperatura: Number(media(g.temps).toFixed(1)),
      umidade: Number(media(g.umids).toFixed(1)),
    }));
}

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
    const id = setInterval(carregar, 30000); // atualiza a cada 30s
    return () => clearInterval(id);
  }, []);

  const serie = agruparPorHora(leituras);
  const temps = serie.map((p) => p.temperatura);
  const umids = serie.map((p) => p.umidade);
  const labels = serie.map((p) => p.label);
  const temGrafico = serie.length >= 2;

  const todasTemps = leituras.map((l) => l.temperatura);
  const maxTemp = todasTemps.length ? Math.max(...todasTemps) : null;
  const minTemp = todasTemps.length ? Math.min(...todasTemps) : null;

  const dataUltima = ultima ? paraDataLocal(ultima.dataHora) : null;
  const minutosSemLeitura = dataUltima ? (Date.now() - dataUltima.getTime()) / 60000 : null;
  const sensorOnline = minutosSemLeitura !== null && minutosSemLeitura <= MINUTOS_ONLINE;
  const umidadeOk = ultima && ultima.umidade >= FAIXA_UMIDADE[0] && ultima.umidade <= FAIXA_UMIDADE[1];

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
        <SectionCard title="Temperatura e umidade" subtitle={`Média por hora • últimas ${HORAS_JANELA} horas`}>
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
              <span>São necessárias leituras em pelo menos 2 horas diferentes nas últimas {HORAS_JANELA}h.</span>
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