import { CheckCircle2, Clock3, MapPin, Package, Truck } from "lucide-react";
import SectionCard from "../components/SectionCard";

const shipments = [
  ["Rotterdam", "Em preparação", "26/09", "success"],
  ["Lisboa", "Em transporte", "24/09", "blue"],
  ["Miami", "Programada", "29/09", "orange"],
  ["Hamburgo", "Aguardando coleta", "30/09", "purple"]
];

export default function Logistica() {
  return (
    <>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon green"><Truck size={21}/></div><div className="stat-info"><span>Em transporte</span><strong>12</strong><small>Operações ativas</small></div></div>
        <div className="stat-card"><div className="stat-icon blue"><Package size={21}/></div><div className="stat-info"><span>Programadas</span><strong>18</strong><small>Próximos 7 dias</small></div></div>
        <div className="stat-card"><div className="stat-icon orange"><Clock3 size={21}/></div><div className="stat-info"><span>Tempo médio</span><strong>42h</strong><small>Porta a porta</small></div></div>
        <div className="stat-card"><div className="stat-icon purple"><CheckCircle2 size={21}/></div><div className="stat-info"><span>Entregas no prazo</span><strong>94%</strong><small>Últimos 30 dias</small></div></div>
      </div>
      <SectionCard title="Exportações programadas" subtitle="Acompanhamento das operações">
        <div className="table-wrap"><table><thead><tr><th>Destino</th><th>Status</th><th>Data</th><th>Atualização</th></tr></thead><tbody>
          {shipments.map(([dest,status,date,tone])=><tr key={dest}><td><div className="destination"><MapPin size={16}/><strong>{dest}</strong></div></td><td><span className={`tag ${tone}`}>{status}</span></td><td>{date}</td><td>Hoje, 17:30</td></tr>)}
        </tbody></table></div>
      </SectionCard>
    </>
  );
}