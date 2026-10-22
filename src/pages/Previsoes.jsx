import { useEffect, useState } from "react";
import { Cloud, CloudRain, CloudSun, Droplets, PackageCheck, Sun, Thermometer } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";

const LOCAL = { nome: "Petrolina / Juazeiro", lat: -9.39, lon: -40.5 };

// Critérios para um dia ser "favorável" à colheita (ajuste conforme o projeto)
const TEMP_MAX = 34;            // °C, máxima do dia
const UMIDADE = [50, 80];       // %, média do dia
const CHANCE_CHUVA_MAX = 30;    // %, probabilidade máxima de chuva
const CHUVA_MM_MAX = 1;         // mm no dia
const MIN_DIAS_JANELA = 2;      // mínimo de dias seguidos para formar uma janela

const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LOCAL.lat}&longitude=${LOCAL.lon}` +
  `&current=temperature_2m,relative_humidity_2m,weather_code` +
  `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
  `&hourly=relative_humidity_2m&timezone=America%2FRecife&forecast_days=7`;

const fmt = (n) => Number(n).toFixed(1).replace(".", ",");
const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

// Códigos WMO usados pela Open-Meteo
function condicao(codigo) {
  if (codigo === 0) return { texto: "Céu limpo", icon: Sun };
  if (codigo <= 2) return { texto: "Parcialmente nublado", icon: CloudSun };
  if (codigo <= 3) return { texto: "Nublado", icon: Cloud };
  if (codigo <= 48) return { texto: "Neblina", icon: Cloud };
  if (codigo <= 67) return { texto: "Chuva", icon: CloudRain };
  if (codigo <= 82) return { texto: "Chuva forte", icon: CloudRain };
  return { texto: "Tempestade", icon: CloudRain };
}

const diaCurto = (data) =>
  new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

const diaMes = (data) =>
  new Date(`${data}T12:00:00`)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "")
    .toUpperCase();

function montarDias(dados) {
  const d = dados.daily;
  return d.time.map((data, i) => {
    const umids = dados.hourly.time
      .map((t, idx) => (t.startsWith(data) ? dados.hourly.relative_humidity_2m[idx] : null))
      .filter((v) => v !== null);
    const umidade = umids.length ? media(umids) : null;
    const tmax = d.temperature_2m_max[i];
    const chance = d.precipitation_probability_max[i] ?? 0;
    const chuvaMm = d.precipitation_sum[i] ?? 0;

    const favoravel =
      tmax <= TEMP_MAX &&
      umidade !== null && umidade >= UMIDADE[0] && umidade <= UMIDADE[1] &&
      chance <= CHANCE_CHUVA_MAX &&
      chuvaMm <= CHUVA_MM_MAX;

    return {
      data,
      tmax,
      tmin: d.temperature_2m_min[i],
      umidade,
      chance,
      chuvaMm,
      codigo: d.weather_code[i],
      favoravel,
    };
  });
}

// Maior sequência de dias favoráveis seguidos
function acharJanela(dias) {
  let melhor = null;
  let inicio = null;
  dias.forEach((dia, i) => {
    if (dia.favoravel && inicio === null) inicio = i;
    const fimSequencia = inicio !== null && (!dia.favoravel || i === dias.length - 1);
    if (fimSequencia) {
      const fim = dia.favoravel ? i : i - 1;
      const tamanho = fim - inicio + 1;
      if (tamanho >= MIN_DIAS_JANELA && (!melhor || tamanho > melhor.tamanho)) {
        melhor = { inicio: dias[inicio].data, fim: dias[fim].data, tamanho };
      }
      inicio = null;
    }
  });
  return melhor;
}

export default function Previsoes() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      const res = await fetch(URL);
      if (!res.ok) throw new Error(res.status);
      setDados(await res.json());
      setErro("");
    } catch (e) {
      setErro("Não foi possível carregar a previsão do tempo. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 30 * 60 * 1000); // atualiza a cada 30 min
    return () => clearInterval(id);
  }, []);

  if (carregando) return <div className="empty-state"><strong>Carregando previsão...</strong></div>;
  if (erro || !dados) return <div className="filter-feedback error" role="alert">{erro}</div>;

  const dias = montarDias(dados);
  const janela = acharJanela(dias);
  const diasFavoraveis = dias.filter((x) => x.favoravel).length;

  // Estável: sem chuva provável e pouca variação da máxima ao longo da semana
  const maximas = dias.map((x) => x.tmax);
  const variacao = Math.max(...maximas) - Math.min(...maximas);
  const semChuva = dias.every((x) => x.chance <= 50);
  const estavel = semChuva && variacao <= 4;

  const atual = dados.current;
  const condAtual = condicao(atual.weather_code);

  return (
    <>
      <div className="stats-grid">
        <StatCard icon={Thermometer} label="Temperatura agora" value={`${fmt(atual.temperature_2m)} °C`} detail={LOCAL.nome} />
        <StatCard icon={Droplets} label="Umidade agora" value={`${Math.round(atual.relative_humidity_2m)}%`} detail="Previsão para o local" tone="blue" />
        <StatCard icon={condAtual.icon} label="Condição" value={condAtual.texto} detail={estavel ? "Tempo estável na semana" : "Tempo instável na semana"} tone="orange" />
        <StatCard icon={PackageCheck} label="Janela de colheita" value={janela ? "Ideal" : "Indisponível"} detail={`${diasFavoraveis} de 7 dias favoráveis`} tone="purple" />
      </div>

      <SectionCard title="Janela ideal de colheita" subtitle={`Próximos 7 dias • ${LOCAL.nome}`}>
        <div className="forecast-highlight">
          <div className="forecast-icon"><Sun size={28} /></div>
          <div>
            <span>{janela ? "JANELA RECOMENDADA" : "SEM JANELA FAVORÁVEL"}</span>
            <strong>{janela ? `${diaMes(janela.inicio)} — ${diaMes(janela.fim)}` : "—"}</strong>
            <p>
              {janela
                ? `${janela.tamanho} dias seguidos com temperatura, umidade e chuva dentro dos critérios.`
                : `Nenhuma sequência de ${MIN_DIAS_JANELA} dias favoráveis nos próximos 7 dias.`}
            </p>
          </div>
          <div className="confidence"><strong>{diasFavoraveis}/7</strong><span>dias favoráveis</span></div>
        </div>
        <div className="condition-grid">
          <div><Thermometer size={18} /><span>Temperatura máx. ≤ {TEMP_MAX} °C</span><strong>{dias.filter((x) => x.tmax <= TEMP_MAX).length}/7 dias</strong></div>
          <div><Droplets size={18} /><span>Umidade {UMIDADE[0]}–{UMIDADE[1]}%</span><strong>{dias.filter((x) => x.umidade >= UMIDADE[0] && x.umidade <= UMIDADE[1]).length}/7 dias</strong></div>
          <div><CloudRain size={18} /><span>Chuva ≤ {CHANCE_CHUVA_MAX}%</span><strong>{dias.filter((x) => x.chance <= CHANCE_CHUVA_MAX).length}/7 dias</strong></div>
        </div>
      </SectionCard>

      <SectionCard title="Previsão dos próximos dias" subtitle="Fonte: Open-Meteo">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Dia</th><th>Condição</th><th>Mín / Máx</th><th>Umidade média</th><th>Chuva</th><th>Colheita</th></tr>
            </thead>
            <tbody>
              {dias.map((x) => {
                const c = condicao(x.codigo);
                return (
                  <tr key={x.data}>
                    <td>{diaCurto(x.data)}</td>
                    <td>{c.texto}</td>
                    <td>{fmt(x.tmin)} / {fmt(x.tmax)} °C</td>
                    <td>{x.umidade !== null ? `${Math.round(x.umidade)}%` : "—"}</td>
                    <td>{x.chance}% • {fmt(x.chuvaMm)} mm</td>
                    <td><span className={`tag ${x.favoravel ? "success" : "orange"}`}>{x.favoravel ? "Favorável" : "Atenção"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}