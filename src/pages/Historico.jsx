import { useEffect, useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import api from "../services/api";

// Regra da coluna "Condição" (ajuste se tiver outra regra do projeto)
const FAIXA_UMIDADE = [60, 75];
const TEMP_MAX = 30;

const pad = (n) => String(n).padStart(2, "0");
const fmt = (n) => Number(n).toFixed(1).replace(".", ",");

const dataISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const diasAtras = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return dataISO(d);
};

// O back guarda o horário do ThingSpeak em UTC (sem fuso): marcamos com "Z"
// para o navegador converter para o horário local.
const paraDataLocal = (dataHora) => new Date(`${dataHora}Z`);

// A API espera data/hora ISO sem fuso, em UTC
const paraParametro = (d) => d.toISOString().slice(0, 19);

const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

// Junta todas as leituras do mesmo dia (horário local) e calcula a média
function agruparPorDia(leituras) {
  const dias = new Map();

  leituras.forEach((l) => {
    const chave = dataISO(paraDataLocal(l.dataHora));
    if (!dias.has(chave)) dias.set(chave, { temps: [], umids: [] });
    dias.get(chave).temps.push(l.temperatura);
    dias.get(chave).umids.push(l.umidade);
  });

  return [...dias.entries()]
    .sort((a, b) => b[0].localeCompare(a[0])) // mais recente primeiro
    .map(([chave, g]) => {
      const temperatura = media(g.temps);
      const umidade = media(g.umids);
      const favoravel =
        temperatura <= TEMP_MAX && umidade >= FAIXA_UMIDADE[0] && umidade <= FAIXA_UMIDADE[1];
      const [ano, mes, dia] = chave.split("-");
      return {
        chave,
        data: `${dia}/${mes}/${ano}`,
        temperatura,
        umidade,
        leituras: g.temps.length,
        condicao: favoravel ? "Favorável" : "Atenção",
      };
    });
}

export default function Historico() {
  const [startDate, setStartDate] = useState(diasAtras(30));
  const [endDate, setEndDate] = useState(diasAtras(0));
  const [filters, setFilters] = useState({ start: diasAtras(30), end: diasAtras(0) });
  const [leituras, setLeituras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Busca no backend sempre que o filtro aplicado mudar
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      try {
        const inicio = new Date(`${filters.start}T00:00:00`);
        const fim = new Date(`${filters.end}T23:59:59`);
        const res = await api.get("/api/leituras-climaticas", {
          params: { inicio: paraParametro(inicio), fim: paraParametro(fim) },
        });
        if (!cancelado) {
          setLeituras(res.data || []);
          setError("");
        }
      } catch (e) {
        if (!cancelado) setError("Não foi possível carregar o histórico do servidor.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [filters]);

  const rows = useMemo(() => agruparPorDia(leituras), [leituras]);

  function handleFilter(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!startDate || !endDate) {
      setError("Informe a data inicial e a data final.");
      return;
    }
    if (startDate > endDate) {
      setError("A data inicial não pode ser maior que a data final.");
      return;
    }

    setFilters({ start: startDate, end: endDate });
    setMessage("Filtro aplicado com sucesso.");
  }

  function handleClear() {
    const inicio = diasAtras(30);
    const fim = diasAtras(0);
    setStartDate(inicio);
    setEndDate(fim);
    setFilters({ start: inicio, end: fim });
    setError("");
    setMessage("Filtros limpos. Exibindo os últimos 30 dias.");
  }

  return (
    <SectionCard title="Histórico de dados" subtitle="Média diária de temperatura e umidade registradas pelo sensor">
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
        {carregando
          ? "Carregando..."
          : `${rows.length} ${rows.length === 1 ? "dia encontrado" : "dias encontrados"} • ${leituras.length} leituras no período`}
      </div>

      <div className="table-wrap">
        {!carregando && rows.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Temperatura (média)</th>
                <th>Umidade (média)</th>
                <th>Leituras</th>
                <th>Condição</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.chave}>
                  <td>{row.data}</td>
                  <td>{fmt(row.temperatura)} °C</td>
                  <td>{Math.round(row.umidade)}%</td>
                  <td>{row.leituras}</td>
                  <td>
                    <span className={`tag ${row.condicao === "Favorável" ? "success" : "orange"}`}>
                      {row.condicao}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !carregando && (
            <div className="empty-state">
              <strong>Nenhum dado encontrado.</strong>
              <span>Altere o período selecionado e tente novamente.</span>
            </div>
          )
        )}
      </div>
    </SectionCard>
  );
}