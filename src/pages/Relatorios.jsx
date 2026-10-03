import { CheckCircle2, Download, FileBarChart, ShieldCheck, TestTube2 } from "lucide-react";
import { useState } from "react";
import SectionCard from "../components/SectionCard";

const reports = [
  { title: "Relatório de segurança", subtitle: "Acessos e incidentes", icon: ShieldCheck, tone: "", file: "relatorio-seguranca.txt", text: "Resumo de acessos, autenticações e ocorrências de segurança da Raisin Tech.\n\nPeríodo demonstrativo: 18/09/2026 a 23/09/2026\nAcessos registrados: 126\nIncidentes: 1\nStatus: monitorado" },
  { title: "Relatório de qualidade", subtitle: "Execução de testes", icon: TestTube2, tone: "blue-bg", file: "relatorio-qualidade.txt", text: "Resumo dos testes automatizados das funcionalidades críticas.\n\nTestes executados: 24\nAprovados: 23\nCom falha: 1\nCobertura demonstrativa: 92%" },
  { title: "Relatório operacional", subtitle: "Clima e previsão de safra", icon: FileBarChart, tone: "orange-bg", file: "relatorio-operacional.txt", text: "Resumo operacional climático.\n\nTemperatura atual: 28,5 °C\nUmidade atual: 67%\nJanela recomendada: 26 a 29/09/2026\nConfiança do modelo: 89%" }
];

function downloadReport(report) {
  const blob = new Blob([`${report.title}\n\n${report.text}\n\nGerado pela Raisin Tech.`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = report.file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Relatorios({ onNotice }) {
  const [downloading, setDownloading] = useState("");

  const handleDownload = (report) => {
    setDownloading(report.file);
    downloadReport(report);
    onNotice(`Relatório exportado: ${report.title}`);
    window.setTimeout(() => setDownloading(""), 900);
  };

  return (
    <div className="report-grid">
      {reports.map((report) => {
        const Icon = report.icon;
        return (
          <SectionCard key={report.file} title={report.title} subtitle={report.subtitle}>
            <div className={`report-icon ${report.tone}`}><Icon size={28}/></div>
            <p className="muted">{report.title === "Relatório de segurança" ? "Resumo dos acessos, autenticações e ocorrências de segurança do período selecionado." : report.title === "Relatório de qualidade" ? "Resultados dos testes automatizados das funcionalidades críticas da aplicação." : "Consolidação dos principais indicadores climáticos e da previsão de safra."}</p>
            <button className="secondary-button" onClick={() => handleDownload(report)} disabled={Boolean(downloading)}>
              {downloading === report.file ? <CheckCircle2 size={17}/> : <Download size={17}/>} {downloading === report.file ? "Exportado" : "Exportar relatório"}
            </button>
          </SectionCard>
        );
      })}
    </div>
  );
}
