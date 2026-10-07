import { useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";

const rows = [
  ["23/09/2026", "28,5 °C", "67%", "Favorável"],
  ["22/09/2026", "27,9 °C", "71%", "Favorável"],
  ["21/09/2026", "29,1 °C", "64%", "Favorável"],
  ["20/09/2026", "28,2 °C", "68%", "Atenção"],
  ["19/09/2026", "30,0 °C", "59%", "Atenção"],
  ["18/09/2026", "27,4 °C", "73%", "Favorável"]
];

const toISODate = (date) => {
  const [day, month, year] = date.split("/");
  return `${year}-${month}-${day}`;
};

export default function Historico() {
  const [startDate, setStartDate] = useState("2026-09-18");
  const [endDate, setEndDate] = useState("2026-09-23");
  const [filters, setFilters] = useState({ start: "2026-09-18", end: "2026-09-23" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredRows = useMemo(() => {
    return rows.filter(([date]) => {
      const current = toISODate(date);
      return (!filters.start || current >= filters.start) && (!filters.end || current <= filters.end);
    });
  }, [filters]);

  function handleFilter(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (startDate && endDate && startDate > endDate) {
      setError("A data inicial não pode ser maior que a data final.");
      return;
    }

    setFilters({ start: startDate, end: endDate });
    setMessage("Filtro aplicado com sucesso.");
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    setFilters({ start: "", end: "" });
    setError("");
    setMessage("Filtros limpos. Exibindo todo o histórico.");
  }

  return (
    <SectionCard title="Histórico de dados" subtitle="Registro climático e condição de safra">
      <form className="filters" onSubmit={handleFilter}>
        <div>
          <label htmlFor="start-date">Data inicial</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="end-date">Data final</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <button type="submit" className="primary-button small">Filtrar</button>
        <button type="button" className="secondary-button small" onClick={handleClear}>Limpar</button>
      </form>

      {error && <div className="filter-feedback error" role="alert">{error}</div>}
      {message && !error && <div className="filter-feedback success" role="status">{message}</div>}

      <div className="history-result-count">
        {filteredRows.length} {filteredRows.length === 1 ? "registro encontrado" : "registros encontrados"}
      </div>

      <div className="table-wrap">
        {filteredRows.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Temperatura</th>
                <th>Umidade</th>
                <th>Condição</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    <td key={index}>
                      {index === 3 ? (
                        <span className={`tag ${cell === "Favorável" ? "success" : "orange"}`}>{cell}</span>
                      ) : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <strong>Nenhum dado encontrado.</strong>
            <span>Altere o período selecionado e tente novamente.</span>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
