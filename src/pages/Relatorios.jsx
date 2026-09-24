import { Download, FileBarChart, ShieldCheck, TestTube2 } from "lucide-react";
import SectionCard from "../components/SectionCard";

export default function Relatorios() {
  return (
    <div className="report-grid">
      <SectionCard title="Relatório de segurança" subtitle="Acessos e incidentes">
        <div className="report-icon"><ShieldCheck size={28}/></div>
        <p className="muted">Resumo dos acessos, autenticações e ocorrências de segurança do período selecionado.</p>
        <button className="secondary-button"><Download size={17}/> Exportar relatório</button>
      </SectionCard>
      <SectionCard title="Relatório de qualidade" subtitle="Execução de testes">
        <div className="report-icon blue-bg"><TestTube2 size={28}/></div>
        <p className="muted">Resultados dos testes automatizados das funcionalidades críticas da aplicação.</p>
        <button className="secondary-button"><Download size={17}/> Exportar relatório</button>
      </SectionCard>
      <SectionCard title="Relatório operacional" subtitle="Clima, mercado e logística">
        <div className="report-icon orange-bg"><FileBarChart size={28}/></div>
        <p className="muted">Consolidação dos principais indicadores de operação e previsão de safra.</p>
        <button className="secondary-button"><Download size={17}/> Exportar relatório</button>
      </SectionCard>
    </div>
  );
}