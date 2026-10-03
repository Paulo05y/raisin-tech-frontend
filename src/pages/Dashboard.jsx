import { Activity, Droplets, PackageCheck, Sun, Thermometer } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import LineChart from "../components/LineChart";

const temps = [26.7, 27.8, 27.1, 28.6, 29.2, 28.8, 28.1, 29.0, 30.1, 29.6, 28.9, 28.5];
const humidity = [62, 65, 68, 66, 72, 75, 71, 69, 73, 70, 68, 67];
const labels = ["08h","09h","10h","11h","12h","13h","14h","15h","16h","17h","18h","19h"];

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
        <StatCard icon={Thermometer} label="Temperatura" value="28,5 °C" detail="Atual • +1,2 °C hoje" />
        <StatCard icon={Droplets} label="Umidade" value="67%" detail="Atual • dentro do ideal" tone="blue" />
        <StatCard icon={PackageCheck} label="Janela de colheita" value="Ideal" detail="26 a 29 de setembro" tone="purple" />
      </div>

      <div className="dashboard-grid">
        <SectionCard title="Temperatura" subtitle="Últimas 12 horas" action={<span className="metric-badge">°C</span>}>
          <div className="chart-summary"><strong>28,5°C</strong><span>+1,2°C desde 08:00</span></div>
          <LineChart values={temps} labels={labels} unit="°C" titleFormat={(v) => `${v.toFixed(1).replace('.', ',')} °C`} stroke="#7A16F8" gradientId="tempGradient" />
        </SectionCard>

        <SectionCard title="Umidade relativa" subtitle="Últimas 12 horas" action={<span className="metric-badge">%</span>}>
          <div className="chart-summary"><strong>67%</strong><span>Dentro do intervalo ideal</span></div>
          <LineChart values={humidity} labels={labels} unit="%" titleFormat={(v) => `${v}%`} stroke="#5C4AE4" gradientId="humidityGradient" />
        </SectionCard>

        <SectionCard title="Condição para exportação" subtitle="Análise climática consolidada" className="wide-card">
          <div className="forecast-highlight">
            <div className="forecast-icon"><Sun size={28}/></div>
            <div>
              <span>JANELA RECOMENDADA</span>
              <strong>26 — 29 SET</strong>
              <p>Condições climáticas favoráveis para programação da colheita e exportação.</p>
            </div>
            <div className="confidence"><strong>89%</strong><span>confiança</span></div>
          </div>
          <div className="condition-grid">
            <div><Thermometer size={18}/><span>Temperatura</span><strong>Favorável</strong></div>
            <div><Droplets size={18}/><span>Umidade</span><strong>Favorável</strong></div>
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
