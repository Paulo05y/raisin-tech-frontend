import { CalendarDays, CheckCircle2, CloudSun, Droplets, Target, Thermometer, TrendingUp } from "lucide-react";
import SectionCard from "../components/SectionCard";

export default function Previsoes() {
  return (
    <>
      <div className="prediction-hero">
        <div className="prediction-icon"><Target size={30}/></div>
        <div><span>JANELA IDEAL IDENTIFICADA</span><h2>26 a 29 de setembro de 2026</h2><p>Os dados atuais indicam condições favoráveis para colheita e preparação da exportação.</p></div>
        <div className="confidence-big"><strong>89%</strong><span>confiança do modelo</span></div>
      </div>
      <div className="two-column">
        <SectionCard title="Indicadores considerados" subtitle="Dados atuais e históricos">
          <div className="indicator-row"><Thermometer/><div><strong>Temperatura</strong><span>27–30 °C</span></div><b>Favorável</b></div>
          <div className="indicator-row"><Droplets/><div><strong>Umidade</strong><span>60–75%</span></div><b>Favorável</b></div>
          <div className="indicator-row"><TrendingUp/><div><strong>Demanda</strong><span>Alta</span></div><b>Favorável</b></div>
          <div className="indicator-row"><CloudSun/><div><strong>Condição climática</strong><span>Estável</span></div><b>Favorável</b></div>
        </SectionCard>
        <SectionCard title="Recomendação" subtitle="Resultado do processamento">
          <div className="recommendation"><CheckCircle2 size={25}/><div><strong>Programar exportação</strong><p>A recomendação atual é concentrar a operação entre 26 e 29 de setembro, mantendo o monitoramento dos sensores.</p></div></div>
          <div className="recommendation-note"><CalendarDays size={17}/> Próxima atualização automática: em 15 minutos.</div>
        </SectionCard>
      </div>
    </>
  );
}