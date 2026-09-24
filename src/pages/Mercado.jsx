import { BarChart3, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";

export default function Mercado() {
  return (
    <>
      <div className="stats-grid">
        <StatCard icon={DollarSign} label="Preço médio" value="R$ 8,42" detail="+8,4% na semana" tone="orange" />
        <StatCard icon={TrendingUp} label="Demanda" value="Alta" detail="Mercado de exportação" />
        <StatCard icon={ShoppingCart} label="Pedidos ativos" value="18" detail="6 com prioridade" tone="blue" />
        <StatCard icon={BarChart3} label="Variação mensal" value="+12,7%" detail="Em relação ao mês anterior" tone="purple" />
      </div>
      <SectionCard title="Evolução do preço" subtitle="Valor médio por kg nos últimos 7 dias">
        <div className="market-chart">
          {[52,57,54,64,61,72,80].map((h,i)=><div className="market-col" key={i}><span>R$ {[7.68,7.82,7.75,8.04,7.98,8.21,8.42][i].toFixed(2)}</span><div style={{height:`${h}%`}}/><small>{["17","18","19","20","21","22","23"][i]}/09</small></div>)}
        </div>
      </SectionCard>
    </>
  );
}