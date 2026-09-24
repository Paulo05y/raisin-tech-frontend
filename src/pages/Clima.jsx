import { CloudRain, Droplets, Gauge, Thermometer, Wind } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";

export default function Clima() {
  return (
    <>
      <div className="stats-grid">
        <StatCard icon={Thermometer} label="Temperatura atual" value="28,5 °C" detail="Sensores ativos" />
        <StatCard icon={Droplets} label="Umidade" value="67%" detail="Faixa ideal: 60–75%" tone="blue" />
        <StatCard icon={Wind} label="Velocidade do vento" value="12 km/h" detail="Condição normal" tone="orange" />
        <StatCard icon={Gauge} label="Pressão" value="1014 hPa" detail="Estável" tone="purple" />
      </div>
      <div className="two-column">
        <SectionCard title="Temperatura e umidade" subtitle="Dados das últimas 24 horas">
          <div className="large-chart">
            {[45,55,48,61,58,72,68,78,70,64,73,80,75,68,72,77,69,62].map((h,i)=><div className="bar" style={{height:`${h}%`}} key={i}/>)}
          </div>
          <div className="legend"><span><i className="legend-temp"/>Temperatura</span><span><i className="legend-humidity"/>Umidade</span></div>
        </SectionCard>
        <SectionCard title="Status dos sensores" subtitle="Integração ThingSpeak">
          <div className="sensor-row"><div className="sensor-name"><span className="status-dot"/>Sensor principal</div><strong>Online</strong></div>
          <div className="sensor-row"><div className="sensor-name"><span className="status-dot"/>Sensor auxiliar</div><strong>Online</strong></div>
          <div className="sensor-row"><div className="sensor-name"><span className="status-dot offline"/>Sensor reserva</div><strong>Offline</strong></div>
          <div className="sensor-last"><CloudRain size={17}/> Última atualização: 17:42:18</div>
        </SectionCard>
      </div>
    </>
  );
}