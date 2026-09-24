import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import SectionCard from "../components/SectionCard";

const alerts = [
  {type:"success", icon:CheckCircle2, title:"Janela favorável identificada", text:"As condições atuais indicam uma janela adequada para programação da exportação.", time:"Hoje, 14:30"},
  {type:"warning", icon:AlertTriangle, title:"Umidade acima da média", text:"A umidade atingiu 76% em uma leitura recente. Continue monitorando.", time:"Hoje, 12:15"},
  {type:"info", icon:Info, title:"Dados do sensor atualizados", text:"Novos dados de temperatura e umidade foram recebidos do canal.", time:"Hoje, 11:58"},
  {type:"danger", icon:XCircle, title:"Sensor reserva offline", text:"O sensor reserva deixou de responder. Verifique a conectividade do dispositivo.", time:"Ontem, 18:20"}
];

export default function Alertas() {
  return (
    <SectionCard title="Central de alertas" subtitle="Ocorrências do sistema e recomendações">
      <div className="full-alert-list">
        {alerts.map(({type,icon:Icon,title,text,time})=><div className={`full-alert ${type}`} key={title}><div className="full-alert-icon"><Icon size={21}/></div><div><strong>{title}</strong><p>{text}</p><small>{time}</small></div></div>)}
      </div>
    </SectionCard>
  );
}