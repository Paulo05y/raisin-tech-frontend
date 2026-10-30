import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Clock, Download, Droplets, Info,
  ShieldAlert, ShieldCheck, Thermometer, XCircle,
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import api from "../services/api";
import { getUsuarioLogado } from "../services/authService";
import "../styles/relatorios.css";

const NIVEIS = {
  INFO: { rotulo: "Informação", icon: Info, tone: "blue" },
  ATENCAO: { rotulo: "Atenção", icon: AlertTriangle, tone: "orange" },
  CRITICO: { rotulo: "Crítico", icon: XCircle, tone: "purple" },
};

const EVENTOS = {
  LOGIN_SUCESSO: "Login realizado",
  LOGIN_FALHA: "Falha de login",
  LOGIN_USUARIO_INATIVO: "Login de usuário inativo",
  ACESSO_NEGADO: "Acesso negado",
  USUARIO_CADASTRADO: "Usuário cadastrado",
  USUARIO_ATIVADO: "Usuário ativado",
  USUARIO_DESATIVADO: "Usuário desativado",
};

const INCIDENTES = {
  POSSIVEL_FORCA_BRUTA: "Possível tentativa de adivinhar senha",
  ACESSO_NEGADO: "Acesso negado a recurso restrito",
};

const pad = (n) => String(n).padStart(2, "0");
const fmt = (n) => Number(n).toFixed(1).replace(".", ",");
const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const dataISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dataBR = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const dataHoraBR = (d) => `${dataBR(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dataHoraCompletaBR = (d) => `${dataHoraBR(d)}:${pad(d.getSeconds())}`;

// Leituras e eventos de segurança: o back guarda em UTC (sem fuso)
const utcParaLocal = (dataHora) => new Date(`${dataHora}Z`);
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

function SeletorPeriodo({ dias, onChange }) {
  return (
    <select value={dias} onChange={(e) => onChange(Number(e.target.value))} aria-label="Período do relatório">
      <option value={7}>Últimos 7 dias</option>
      <option value={14}>Últimos 14 dias</option>
      <option value={30}>Últimos 30 dias</option>
    </select>
  );
}

/* ============================ ABA OPERACIONAL ============================ */

function RelatorioOperacional({ onNotice }) {
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
      const chave = dataISO(utcParaLocal(l.dataHora));
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
        action={<SeletorPeriodo dias={dias} onChange={setDias} />}
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

/* ============================= ABA SEGURANÇA ============================= */

function RelatorioSeguranca({ onNotice }) {
  const [dias, setDias] = useState(7);
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      try {
        const { inicio, fim } = periodo(dias);
        const res = await api.get("/api/relatorios/seguranca", {
          params: { inicio: paramUTC(inicio), fim: paramUTC(fim) },
        });
        if (!cancelado) {
          setRelatorio(res.data || null);
          setErro("");
        }
      } catch (e) {
        if (!cancelado) {
          setErro(
            e.response?.status === 403
              ? "Somente administradores podem ver o relatório de segurança."
              : "Não foi possível carregar o relatório de segurança."
          );
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [dias]);

  const totais = relatorio?.totaisPorTipo || {};
  const eventos = relatorio?.eventos || [];
  const incidentes = relatorio?.incidentes || [];
  const { inicio, fim } = periodo(dias);

  function exportarEventos() {
    if (!eventos.length) {
      onNotice("Não há eventos no período para exportar.");
      return;
    }
    baixarCSV(
      `eventos-seguranca-ultimos-${dias}-dias.csv`,
      ["Data e hora", "Evento", "Usuário", "IP", "Detalhe"],
      eventos.map((ev) => [
        dataHoraCompletaBR(utcParaLocal(ev.dataHora)),
        EVENTOS[ev.tipo] || ev.tipo,
        ev.email || "",
        ev.ip || "",
        ev.detalhe || "",
      ])
    );
    onNotice("Eventos de segurança exportados em CSV.");
  }

  return (
    <>
      <SectionCard
        title="Relatório de segurança"
        subtitle={`${dataBR(inicio)} a ${dataBR(fim)} • acessos e incidentes`}
        action={<SeletorPeriodo dias={dias} onChange={setDias} />}
      >
        {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

        <div className="stats-grid">
          <StatCard
            icon={Activity}
            label="Eventos registrados"
            value={carregando ? "—" : relatorio?.totalEventos ?? 0}
            detail="Todos os tipos, no período"
          />
          <StatCard
            icon={ShieldCheck}
            label="Logins com sucesso"
            value={carregando ? "—" : totais.LOGIN_SUCESSO ?? 0}
            detail="Acessos autorizados"
            tone="blue"
          />
          <StatCard
            icon={AlertTriangle}
            label="Falhas de login"
            value={carregando ? "—" : (totais.LOGIN_FALHA ?? 0) + (totais.LOGIN_USUARIO_INATIVO ?? 0)}
            detail={`${totais.LOGIN_USUARIO_INATIVO ?? 0} de usuário inativo`}
            tone="orange"
          />
          <StatCard
            icon={ShieldAlert}
            label="Acessos negados"
            value={carregando ? "—" : totais.ACESSO_NEGADO ?? 0}
            detail="Usuário logado sem permissão"
            tone="purple"
          />
        </div>

        <h3 className="report-subtitle">Incidentes</h3>
        {carregando ? (
          <div className="empty-state"><strong>Carregando...</strong></div>
        ) : incidentes.length === 0 ? (
          <div className="report-ok">Nenhum incidente de segurança no período.</div>
        ) : (
          <div className="incident-list">
            {incidentes.map((inc) => (
              <div className="incident-item" key={`${inc.tipo}-${inc.email}`}>
                <div className="incident-icon"><ShieldAlert size={20} /></div>
                <div>
                  <strong>{INCIDENTES[inc.tipo] || inc.tipo}</strong>
                  <p>{inc.descricao}</p>
                  <small>
                    Usuário: {inc.email} • {inc.ocorrencias} {inc.ocorrencias === 1 ? "ocorrência" : "ocorrências"} •
                    última em {dataHoraCompletaBR(utcParaLocal(inc.ultimaOcorrencia))}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Eventos recentes"
        subtitle="Logins, acessos negados e mudanças de usuários"
        action={
          <button className="secondary-button small" onClick={exportarEventos} disabled={carregando}>
            <Download size={16} /> Exportar eventos (CSV)
          </button>
        }
      >
        <div className="report-note">
          Os registros guardam e-mail, IP e horário, nunca senhas. O IP é informativo e serve apenas à segurança do sistema.
          {relatorio && relatorio.totalEventos > eventos.length
            ? ` Mostrando os ${eventos.length} eventos mais recentes de ${relatorio.totalEventos}.`
            : ""}
        </div>

        <div className="table-wrap">
          {carregando ? (
            <div className="empty-state"><strong>Carregando...</strong></div>
          ) : eventos.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum evento no período.</strong>
              <span>Escolha um período maior.</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Data e hora</th><th>Evento</th><th>Usuário</th><th>IP</th><th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev) => (
                  <tr key={ev.id}>
                    <td>{dataHoraCompletaBR(utcParaLocal(ev.dataHora))}</td>
                    <td>
                      {ev.tipo === "LOGIN_SUCESSO" ? (
                        <span className="tag success">{EVENTOS[ev.tipo]}</span>
                      ) : ["LOGIN_FALHA", "LOGIN_USUARIO_INATIVO", "ACESSO_NEGADO"].includes(ev.tipo) ? (
                        <span className="tag orange">{EVENTOS[ev.tipo]}</span>
                      ) : (
                        <span>{EVENTOS[ev.tipo] || ev.tipo}</span>
                      )}
                    </td>
                    <td>{ev.email || "—"}</td>
                    <td>{ev.ip || "—"}</td>
                    <td>{ev.detalhe || "—"}</td>
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

/* ============================= ABA QUALIDADE ============================= */

function RelatorioQualidade() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const res = await api.get("/api/relatorios/qualidade");
        if (!cancelado) {
          setDados(res.data || null);
          setErro("");
        }
      } catch (e) {
        if (!cancelado) {
          setErro(
            e.response?.status === 404
              ? "O relatório de qualidade ainda não foi gerado. Rode os testes e o script gerar_relatorio_qualidade.py no back."
              : "Não foi possível carregar o relatório de qualidade."
          );
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  const resumo = dados?.resumo;
  const classes = dados?.classes || [];
  const problemas = dados?.casosComProblema || [];
  const falhasTotal = resumo ? resumo.falhas + resumo.erros : 0;
  const geradoEm = dados?.geradoEm ? new Date(dados.geradoEm) : null;

  return (
    <>
      <SectionCard
        title="Relatório de qualidade"
        subtitle={
          geradoEm
            ? `Execução dos testes automatizados • gerado em ${dataHoraBR(geradoEm)}`
            : "Execução dos testes automatizados"
        }
      >
        {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

        {resumo && (
          <>
            {falhasTotal === 0 ? (
              <div className="report-ok">
                Todos os {resumo.total} testes da última execução passaram.
              </div>
            ) : (
              <div className="report-problem">
                {falhasTotal} {falhasTotal === 1 ? "teste não passou" : "testes não passaram"} na última execução.
              </div>
            )}

            <div className="stats-grid">
              <StatCard icon={Activity} label="Testes executados" value={resumo.total} detail={`${classes.length} classes de teste`} />
              <StatCard icon={ShieldCheck} label="Aprovados" value={resumo.aprovados} detail={`${resumo.ignorados} ignorados`} tone="blue" />
              <StatCard icon={XCircle} label="Falhas e erros" value={falhasTotal} detail={`${resumo.falhas} falhas • ${resumo.erros} erros`} tone="orange" />
              <StatCard icon={Clock} label="Tempo de execução" value={`${fmt(resumo.tempoSegundos)} s`} detail="Soma de todas as classes" tone="purple" />
            </div>
          </>
        )}

        {!resumo && !erro && (
          <div className="empty-state"><strong>{carregando ? "Carregando..." : "Sem dados de qualidade."}</strong></div>
        )}
      </SectionCard>

      {resumo && (
        <SectionCard title="Testes por área" subtitle="Cada linha é uma classe de teste automatizado">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Área</th><th>Classe</th><th>Testes</th><th>Aprovados</th><th>Falhas / erros</th><th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.nome}>
                    <td>{c.area}</td>
                    <td>{c.nome}</td>
                    <td>{c.total}</td>
                    <td>{c.aprovados}</td>
                    <td>
                      <span className={`tag ${c.falhas + c.erros === 0 ? "success" : "orange"}`}>
                        {c.falhas + c.erros}
                      </span>
                    </td>
                    <td>{fmt(c.tempoSegundos)} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {problemas.length > 0 && (
            <>
              <h3 className="report-subtitle">Testes com problema</h3>
              <div className="incident-list">
                {problemas.map((p) => (
                  <div className="incident-item" key={`${p.classe}-${p.teste}`}>
                    <div className="incident-icon"><XCircle size={20} /></div>
                    <div>
                      <strong>{p.classe} • {p.teste}</strong>
                      <p>{p.mensagem}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      )}
    </>
  );
}

/* ================================= TELA ================================= */

export default function Relatorios({ onNotice }) {
  const usuario = getUsuarioLogado();
  const ehAdmin = usuario?.perfil === "ADMINISTRADOR";

  const abas = [
    { id: "operacional", rotulo: "Operacional" },
    ...(ehAdmin ? [{ id: "seguranca", rotulo: "Segurança" }] : []),
    { id: "qualidade", rotulo: "Qualidade" },
  ];

  const [aba, setAba] = useState("operacional");

  return (
    <>
      <div className="report-tabs" role="tablist">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            className={`report-tab ${aba === a.id ? "active" : ""}`}
            onClick={() => setAba(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === "operacional" && <RelatorioOperacional onNotice={onNotice} />}
      {aba === "seguranca" && ehAdmin && <RelatorioSeguranca onNotice={onNotice} />}
      {aba === "qualidade" && <RelatorioQualidade />}
    </>
  );
}