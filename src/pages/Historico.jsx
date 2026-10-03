import SectionCard from "../components/SectionCard";

const rows = [
  ["23/09/2026","28,5 °C","67%","8,42","Favorável"],
  ["22/09/2026","27,9 °C","71%","8,31","Favorável"],
  ["21/09/2026","29,1 °C","64%","8,18","Favorável"],
  ["20/09/2026","28,2 °C","68%","8,06","Atenção"],
  ["19/09/2026","30,0 °C","59%","7,92","Atenção"],
  ["18/09/2026","27,4 °C","73%","7,85","Favorável"]
];

export default function Historico() {
  return (
    <SectionCard title="Histórico de dados" subtitle="Registro climático e condição de safra">
      <div className="filters">
        <div><label>Data inicial</label><input type="date" defaultValue="2026-09-18"/></div>
        <div><label>Data final</label><input type="date" defaultValue="2026-09-23"/></div>
        <button className="primary-button small">Filtrar</button>
      </div>
      <div className="table-wrap"><table><thead><tr><th>Data</th><th>Temperatura</th><th>Umidade</th><th>Preço médio</th><th>Condição</th></tr></thead><tbody>
        {rows.map(r=><tr key={r[0]}>{r.map((cell,i)=><td key={i}>{i===4?<span className={`tag ${cell==="Favorável"?"success":"orange"}`}>{cell}</span>:cell}</td>)}</tr>)}
      </tbody></table></div>
    </SectionCard>
  );
}