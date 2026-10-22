import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Droplets, Info, Thermometer, XCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import api from "../services/api";

const NIVEIS = {
  INFO: { rotulo: "Informação", icon: Info, tone: "blue" },
  ATENCAO: { rotulo: "Atenção", icon: AlertTriangle, tone: "orange" },
  CRITICO: { rotulo: "Crítico", icon: XCircle, tone: "purple" },
};

const pad = (n) => String(n).padStart(2, "0");
const fmt = (n) => Number(n).toFixed(1).replace(".", ",");
const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const dataISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dataBR = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const dataHoraBR = (d) => `${dataBR(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Leituras: o back guarda o horário do ThingSpeak em UTC (sem fuso)
const leituraParaLocal = (dataHora) => new Date(`${dataHora}Z`);
const paramUTC = (d) => d.toISOString().slice(0, 19);

// Alertas: o back grava com o relógio do servidor (horário local, sem fuso)
const alertaParaLocal = (dataHora) => new Date(dataHora);
const paramLocal = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

function periodo(dias) {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date();
  fim.setHours(23, 59, 59, 0);
  return { inicio, fim };
}

// Gera e baixa um CSV compatível com Excel em português (separador ";" e vírgula decimal)
function baixarCSV(nomeArquivo, cabecalho, linhas) {
  const escapar = (v) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const conteudo = [cabecalho, ...linhas].map((l) => l.map(escapar).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Relatorios({ onNotice }) {
  const [dias, setDias] = useState(7);
  const [leituras, setLeituras] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      try {
        const { inicio, fim } = periodo(dias);
        const [resLeituras, resAlertas] = await Promise.all([
          api.get("/api/leituras-climaticas", { params: { inicio: paramUTC(inicio), fim: paramUTC(fim) } }),
          api.get("/api/alertas", { params: { inicio: paramLocal(inicio), fim: paramLocal(fim) } }),
        ]);
        if (!cancelado) {
          setLeituras(resLeituras.data || []);
          setAlertas(resAlertas.data || []);
          setErro("");
        }
      } catch (e) {
        if (!cancelado) setErro("Não foi possível carregar os dados do relatório.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [dias]);

  // Resumo por dia (horário local)
  const resumoDiario = useMemo(() => {
    const mapa = new Map();
    leituras.forEach((l) => {
      const chave = dataISO(leituraParaLocal(l.dataHora));
      if (!mapa.has(chave)) mapa.set(chave, { temps: [], umids: [] });
      mapa.get(chave).temps.push(l.temperatura);
      mapa.get(chave).umids.push(l.umidade);
    });

    return [...mapa.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([chave, g]) => {
        const [ano, mes, dia] = chave.split("-");
        return {
          chave,
          data: `${dia}/${mes}/${ano}`,
          tempMedia: media(g.temps),
          tempMin: Math.min(...g.temps),
          tempMax: Math.max(...g.temps),
          umidMedia: media(g.umids),
          umidMin: Math.min(...g.umids),
          umidMax: Math.max(...g.umids),
          leituras: g.temps.length,
        };
      });
  }, [leituras]);

  // Totais do período
  const totais = useMemo(() => {
    if (!leituras.length) return null;
    const temps = leituras.map((l) => l.temperatura);
    const umids = leituras.map((l) => l.umidade);
    return {
      tempMedia: media(temps),
      tempMin: Math.min(...temps),
      tempMax: Math.max(...temps),
      umidMedia: media(umids),
      umidMin: Math.min(...umids),
      umidMax: Math.max(...umids),
    };
  }, [leituras]);

  const contagem = useMemo(() => {
    const c = { INFO: 0, ATENCAO: 0, CRITICO: 0 };
    alertas.forEach((a) => {
      if (c[a.nivel] !== undefined) c[a.nivel] += 1;
    });
    return c;
  }, [alertas]);

  const sufixo = `ultimos-${dias}-dias`;

  function exportarResumo() {
    if (!resumoDiario.length) {
      onNotice("Não há leituras no período para exportar.");
      return;
    }
    baixarCSV(
      `resumo-climatico-${sufixo}.csv`,
      ["Data", "Temp. média (°C)", "Temp. mínima (°C)", "Temp. máxima (°C)", "Umid. média (%)", "Umid. mínima (%)", "Umid. máxima (%)", "Leituras"],
      resumoDiario.map((r) => [
        r.data, fmt(r.tempMedia), fmt(r.tempMin), fmt(r.tempMax),
        fmt(r.umidMedia), fmt(r.umidMin), fmt(r.umidMax), r.leituras,
      ])
    );
    onNotice("Resumo climático exportado em CSV.");
  }

  function exportarAlertas() {
    if (!alertas.length) {
      onNotice("Não há alertas no período para exportar.");
      return;
    }
    baixarCSV(
      `alertas-${sufixo}.csv`,
      ["Data e hora", "Nível", "Mensagem", "Lido"],
      alertas.map((a) => [
        dataHoraBR(alertaParaLocal(a.dataHora)),
        NIVEIS[a.nivel]?.rotulo || a.nivel,
        a.mensagem,
        a.lido ? "Sim" : "Não",
      ])
    );
    onNotice("Alertas exportados em CSV.");
  }

  const { inicio, fim } = periodo(dias);

  return (
    <>
      <SectionCard
        title="Relatório operacional"
        subtitle={`${dataBR(inicio)} a ${dataBR(fim)} • dados do sensor e alertas`}
        action={
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Período do relatório">
            <option value={7}>Últimos 7 dias</option>
            <option value={14}>Últimos 14 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </select>
        }
      >
        {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

        <div className="stats-grid">
          <StatCard
            icon={Thermometer}
            label="Temperatura média"
            value={totais ? `${fmt(totais.tempMedia)} °C` : "—"}
            detail={totais ? `Mín ${fmt(totais.tempMin)} • Máx ${fmt(totais.tempMax)} °C` : carregando ? "Carregando..." : "Sem leituras no período"}
          />
          <StatCard
            icon={Droplets}
            label="Umidade média"
            value={totais ? `${fmt(totais.umidMedia)}%` : "—"}
            detail={totais ? `Mín ${fmt(totais.umidMin)} • Máx ${fmt(totais.umidMax)}%` : carregando ? "Carregando..." : "Sem leituras no período"}
            tone="blue"
          />
        </div>

        <div className="stats-grid">
          {Object.entries(NIVEIS).map(([nivel, { rotulo, icon, tone }]) => (
            <StatCard
              key={nivel}
              icon={icon}
              label={`Alertas • ${rotulo}`}
              value={carregando ? "—" : contagem[nivel]}
              detail={`${alertas.length} alertas no período`}
              tone={tone}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Resumo diário"
        subtitle="Temperatura e umidade por dia"
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="secondary-button small" onClick={exportarResumo} disabled={carregando}>
              <Download size={16} /> Exportar resumo (CSV)
            </button>
            <button className="secondary-button small" onClick={exportarAlertas} disabled={carregando}>
              <Download size={16} /> Exportar alertas (CSV)
            </button>
          </div>
        }
      >
        <div className="table-wrap">
          {carregando ? (
            <div className="empty-state"><strong>Carregando...</strong></div>
          ) : resumoDiario.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhuma leitura no período.</strong>
              <span>Escolha um período maior ou ligue o sensor.</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Data</th><th>Temp. média</th><th>Mín / Máx</th>
                  <th>Umid. média</th><th>Mín / Máx</th><th>Leituras</th>
                </tr>
              </thead>
              <tbody>
                {resumoDiario.map((r) => (
                  <tr key={r.chave}>
                    <td>{r.data}</td>
                    <td>{fmt(r.tempMedia)} °C</td>
                    <td>{fmt(r.tempMin)} / {fmt(r.tempMax)} °C</td>
                    <td>{fmt(r.umidMedia)}%</td>
                    <td>{fmt(r.umidMin)} / {fmt(r.umidMax)}%</td>
                    <td>{r.leituras}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>
    </>
  );
}