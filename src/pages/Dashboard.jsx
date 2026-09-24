import { Activity, CloudRain, Droplets, PackageCheck, Sun, Thermometer, TrendingUp, Truck, Wind } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";

const temps = [62, 70, 58, 75, 82, 73, 66, 78, 88, 81, 72, 67];
const humidity = [54, 60, 65, 61, 72, 76, 69, 64, 71, 67, 62, 59];

function MiniChart({ values, labels, colorClass = "chart-line" }) {
  const max = Math.max(...values), min = Math.min(...values);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 86 - ((v - min) / (max - min || 1)) * 65;
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="mini-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points={points} className={colorClass} fill="none" />
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * 100;
          const y = 86 - ((v - min) / (max - min || 1)) * 65;
          return <circle key={i} cx={x} cy={y} r="1.4" className="chart-dot" />;
        })}
      </svg>
      <div className="chart-labels">{labels.map(x => <span key={x}>{x}</span>)}</div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">QUARTA-FEIRA, 23 DE SETEMBRO</span>
          <h2>Visão geral da operação</h2>
          <p>Acompanhe as condições para tomar decisões mais seguras.</p>
        </div>
        <div className="status-pill"><span className="status-dot"/> Sistema operacional</div>
      </div>

      <div className="stats-grid">
        <StatCard icon={Thermometer} label="Temperatura" value="28,5 °C" detail="Atual • +1,2% hoje" />
        <StatCard icon={Droplets} label="Umidade" value="67%" detail="Atual • dentro do ideal" tone="blue" />
        <StatCard icon={TrendingUp} label="Preço médio" value="R$ 8,42" detail="Por kg • +8,4% semana" tone="orange" />
        <StatCard icon={PackageCheck} label="Janela de exportação" value="Ideal" detail="26 a 29 de setembro" tone="purple" />
      </div>

      <div className="dashboard-grid">
        <SectionCard title="Temperatura" subtitle="Últimas 12 horas" action={<span className="metric-badge">°C</span>}>
          <div className="chart-summary"><strong>28,5°C</strong><span>+1,2°C desde 08:00</span></div>
          <MiniChart values={temps} labels={["08h","09h","10h","11h","12h","13h","14h","15h","16h","17h","18h","19h"]} />
        </SectionCard>

        <SectionCard title="Umidade relativa" subtitle="Últimas 12 horas" action={<span className="metric-badge">%</span>}>
          <div className="chart-summary"><strong>67%</strong><span>Dentro do intervalo ideal</span></div>
          <MiniChart values={humidity} labels={["08h","09h","10h","11h","12h","13h","14h","15h","16h","17h","18h","19h"]} colorClass="chart-line blue-line" />
        </SectionCard>

        <SectionCard title="Condição para exportação" subtitle="Análise consolidada" className="wide-card">
          <div className="forecast-highlight">
            <div className="forecast-icon"><Sun size={28}/></div>
            <div>
              <span>JANELA RECOMENDADA</span>
              <strong>26 — 29 SET</strong>
              <p>Condições climáticas e de mercado favoráveis para programação da exportação.</p>
            </div>
            <div className="confidence"><strong>89%</strong><span>confiança</span></div>
          </div>
          <div className="condition-grid">
            <div><Thermometer size={18}/><span>Temperatura</span><strong>Favorável</strong></div>
            <div><Droplets size={18}/><span>Umidade</span><strong>Favorável</strong></div>
            <div><Truck size={18}/><span>Logística</span><strong>Disponível</strong></div>
            <div><TrendingUp size={18}/><span>Mercado</span><strong>Alta demanda</strong></div>
          </div>
        </SectionCard>

        <SectionCard title="Alertas recentes" subtitle="Últimas ocorrências">
          <div className="alert-list">
            <div className="alert-item success"><span className="alert-symbol">✓</span><div><strong>Janela favorável identificada</strong><small>Hoje, 14:30</small></div></div>
            <div className="alert-item warning"><span className="alert-symbol">!</span><div><strong>Umidade acima da média</strong><small>Hoje, 12:15</small></div></div>
            <div className="alert-item info"><span className="alert-symbol">i</span><div><strong>Dados atualizados pelo sensor</strong><small>Hoje, 11:58</small></div></div>
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-footer-note"><Activity size={16}/> Dados demonstrativos. A integração real deverá consumir a API do ThingSpeak através do backend.</div>
    </>
  );
}