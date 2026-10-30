import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Clock, Download, Droplets, Info, ShieldAlert, ShieldCheck, Thermometer, XCircle,
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import api from "../services/api";
import { getUsuarioLogado } from "../services/authService";

const NIVEIS = {
  INFO: { rotulo: "Informação", icon: Info, tone: "blue" },
  ATENCAO: { rotulo: "Atenção", icon: AlertTriangle, tone: "orange" },
  CRITICO: { rotulo: "Crítico", icon: XCircle, tone: "purple" },
};

const TIPOS_EVENTO = {
  LOGIN_SUCESSO: "Login com sucesso",
  LOGIN_FALHA: "Falha de login",
  LOGIN_USUARIO_INATIVO: "Login de usuário inativo",
  ACESSO_NEGADO: "Acesso negado",
  USUARIO_CADASTRADO: "Usuário cadastrado",
  USUARIO_ATIVADO: "Usuário ativado",
  USUARIO_DESATIVADO: "Usuário desativado",
};

const TIPOS_INCIDENTE = {
  POSSIVEL_FORCA_BRUTA: "Possível força bruta",
  ACESSO_NEGADO: "Acessos negados",
};

const pad = (n) => String(n).padStart(2, "0");
const fmt = (n) => Number(n).toFixed(1).replace(".", ",");
const fmt2 = (n) => Number(n).toFixed(2).replace(".", ",");
const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const dataISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dataBR = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const dataHoraBR = (d) => `${dataBR(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Leituras: o back guarda o horário do ThingSpeak em UTC (sem fuso)
const leituraParaLocal = (dataHora) => new Date(`${dataHora}Z`);
const paramUTC = (d) => d.toISOString().slice(0, 19);

// Eventos de segurança: o back grava em UTC (sem fuso). Cortamos nos segundos e somamos "Z"
const segurancaParaLocal = (dataHora) => new Date(`${String(dataHora).slice(0, 19)}Z`);

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

function SeletorPeriodo({ dias, setDias }) {
  return (
    <select value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Período do relatório">
      <option value={7}>Últimos 7 dias</option>
      <option value={14}>Últimos 14 dias</option>
      <option value={30}>Últimos 30 dias</option>
    </select>
  );
}

/* ===================== ABA OPERACIONAL ===================== */

function AbaOperacional({ dias, setDias, onNotice }) {
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
        action={<SeletorPeriodo dias={dias} setDias={setDias} />}
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

/* ===================== ABA SEGURANÇA (só ADMINISTRADOR) ===================== */

function AbaSeguranca({ dias, setDias, onNotice }) {
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      try {
        const { inicio, fim } = periodo(dias);
        // Datas enviadas em UTC (o back grava os eventos em UTC)
        const res = await api.get("/api/relatorios/seguranca", {
          params: { inicio: paramUTC(inicio), fim: paramUTC(fim) },
        });
        if (!cancelado) {
          setRelatorio(res.data);
          setErro("");
        }
      } catch (e) {
        if (!cancelado) {
          setRelatorio(null);
          setErro(
            e.response?.status === 403
              ? "Você não tem permissão para ver o relatório de segurança."
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

  const eventos = useMemo(
    () =>
      [...(relatorio?.eventos || [])].sort(
        (a, b) => segurancaParaLocal(b.dataHora) - segurancaParaLocal(a.dataHora)
      ),
    [relatorio]
  );
  const incidentes = relatorio?.incidentes || [];
  const totais = relatorio?.totaisPorTipo || {};
  const total = relatorio?.totalEventos ?? 0;
  const sucessos = totais.LOGIN_SUCESSO || 0;
  const falhas = totais.LOGIN_FALHA || 0;
  const negados = totais.ACESSO_NEGADO || 0;

  // Comentário calculado com os valores reais
  const comentario = useMemo(() => {
    if (!relatorio) return "";
    if (total === 0) return "Nenhum evento de segurança foi registrado no período.";
    const forca = incidentes.filter((i) => i.tipo === "POSSIVEL_FORCA_BRUTA");
    let texto = `Foram registrados ${total} eventos no período: ${sucessos} logins com sucesso, ${falhas} falhas de login e ${negados} acessos negados. `;
    if (incidentes.length === 0) {
      texto += "Nenhum incidente foi detectado.";
    } else {
      texto += `${incidentes.length} incidente(s) detectado(s)`;
      if (forca.length > 0) {
        const maior = [...forca].sort((a, b) => b.ocorrencias - a.ocorrencias)[0];
        texto += `, sendo ${forca.length} de possível força bruta (maior caso: ${maior.email} com ${maior.ocorrencias} falhas).`;
      } else {
        texto += ".";
      }
    }
    return texto;
  }, [relatorio, total, sucessos, falhas, negados, incidentes]);

  function exportarEventos() {
    if (!eventos.length) {
      onNotice("Não há eventos no período para exportar.");
      return;
    }
    baixarCSV(
      `eventos-seguranca-ultimos-${dias}-dias.csv`,
      ["Data e hora", "Tipo", "E-mail", "IP", "Detalhe"],
      eventos.map((e) => [
        dataHoraBR(segurancaParaLocal(e.dataHora)),
        TIPOS_EVENTO[e.tipo] || e.tipo,
        e.email,
        e.ip,
        e.detalhe,
      ])
    );
    onNotice("Eventos de segurança exportados em CSV.");
  }

  const { inicio, fim } = periodo(dias);

  return (
    <>
      <SectionCard
        title="Relatório de segurança"
        subtitle={`${dataBR(inicio)} a ${dataBR(fim)} • acessos e incidentes (horário local)`}
        action={<SeletorPeriodo dias={dias} setDias={setDias} />}
      >
        {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

        <div className="stats-grid">
          <StatCard
            icon={ShieldCheck}
            label="Eventos no período"
            value={carregando ? "—" : total}
            detail={carregando ? "Carregando..." : `${sucessos} logins com sucesso`}
          />
          <StatCard
            icon={AlertTriangle}
            label="Falhas de login"
            value={carregando ? "—" : falhas}
            detail="Senha ou e-mail incorretos"
            tone="orange"
          />
          <StatCard
            icon={XCircle}
            label="Acessos negados"
            value={carregando ? "—" : negados}
            detail="Usuário logado sem permissão"
            tone="purple"
          />
          <StatCard
            icon={ShieldAlert}
            label="Incidentes"
            value={carregando ? "—" : incidentes.length}
            detail="Força bruta e acessos negados"
            tone="blue"
          />
        </div>

        {!carregando && relatorio && <p style={{ marginTop: 12 }}>{comentario}</p>}
      </SectionCard>

      <SectionCard title="Incidentes" subtitle="Padrões suspeitos detectados no período">
        <div className="table-wrap">
          {carregando ? (
            <div className="empty-state"><strong>Carregando...</strong></div>
          ) : incidentes.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum incidente no período.</strong>
              <span>Força bruta = 5 ou mais falhas de login do mesmo e-mail em até 15 minutos.</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tipo</th><th>E-mail</th><th>Ocorrências</th><th>Última ocorrência</th><th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {incidentes.map((i, idx) => (
                  <tr key={`${i.tipo}-${i.email}-${idx}`}>
                    <td>
                      <strong style={{ color: i.tipo === "POSSIVEL_FORCA_BRUTA" ? "#b91c1c" : "#b45309" }}>
                        {TIPOS_INCIDENTE[i.tipo] || i.tipo}
                      </strong>
                    </td>
                    <td>{i.email || "—"}</td>
                    <td>{i.ocorrencias}</td>
                    <td>{i.ultimaOcorrencia ? dataHoraBR(segurancaParaLocal(i.ultimaOcorrencia)) : "—"}</td>
                    <td>{i.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Eventos recentes"
        subtitle={
          eventos.length >= 200
            ? "Mostrando os 200 eventos mais recentes do período"
            : `${eventos.length} evento(s) no período`
        }
        action={
          <button className="secondary-button small" onClick={exportarEventos} disabled={carregando}>
            <Download size={16} /> Exportar eventos (CSV)
          </button>
        }
      >
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
                  <th>Data e hora</th><th>Tipo</th><th>E-mail</th><th>IP</th><th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id}>
                    <td>{dataHoraBR(segurancaParaLocal(e.dataHora))}</td>
                    <td>{TIPOS_EVENTO[e.tipo] || e.tipo}</td>
                    <td>{e.email || "—"}</td>
                    <td>{e.ip || "—"}</td>
                    <td>{e.detalhe || "—"}</td>
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

/* ===================== ABA QUALIDADE ===================== */

function AbaQualidade() {
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      try {
        const res = await api.get("/api/relatorios/qualidade");
        if (!cancelado) {
          setRelatorio(res.data);
          setErro("");
        }
      } catch (e) {
        if (!cancelado) {
          setRelatorio(null);
          setErro("Não foi possível carregar o relatório de qualidade. Ele pode ainda não ter sido gerado no servidor.");
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

  const resumo = relatorio?.resumo;
  const classes = relatorio?.classes || [];
  const problemas = relatorio?.casosComProblema || [];

  // Comentário calculado com os valores reais
  const comentario = useMemo(() => {
    if (!resumo) return "";
    const pct = resumo.total ? (resumo.aprovados / resumo.total) * 100 : 0;
    let texto = `${resumo.aprovados} de ${resumo.total} testes aprovados (${fmt(pct)}%) em ${fmt2(resumo.tempoSegundos)} s. `;
    if (resumo.falhas + resumo.erros === 0) {
      texto += "Nenhuma falha ou erro. ";
    } else {
      texto += `Há ${resumo.falhas} falha(s) e ${resumo.erros} erro(s) para corrigir. `;
    }
    if (classes.length > 0) {
      const maior = [...classes].sort((a, b) => b.total - a.total)[0];
      texto += `A área com mais testes é "${maior.area}" (${maior.total}).`;
    }
    return texto;
  }, [resumo, classes]);

  const geradoEm = relatorio?.geradoEm ? dataHoraBR(new Date(relatorio.geradoEm)) : null;

  return (
    <>
      <SectionCard
        title="Relatório de qualidade"
        subtitle={
          geradoEm
            ? `Testes automatizados (JUnit 5 + Mockito) • gerado em ${geradoEm}`
            : "Testes automatizados (JUnit 5 + Mockito)"
        }
      >
        {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

        <div className="stats-grid">
          <StatCard
            icon={Info}
            label="Total de testes"
            value={resumo ? resumo.total : "—"}
            detail={carregando ? "Carregando..." : `${classes.length} áreas testadas`}
            tone="blue"
          />
          <StatCard
            icon={ShieldCheck}
            label="Aprovados"
            value={resumo ? resumo.aprovados : "—"}
            detail={resumo ? `${resumo.ignorados} ignorados` : ""}
          />
          <StatCard
            icon={XCircle}
            label="Falhas e erros"
            value={resumo ? resumo.falhas + resumo.erros : "—"}
            detail={resumo ? `${resumo.falhas} falhas • ${resumo.erros} erros` : ""}
            tone="purple"
          />
          <StatCard
            icon={Clock}
            label="Tempo de execução"
            value={resumo ? `${fmt2(resumo.tempoSegundos)} s` : "—"}
            detail="Soma de todas as áreas"
            tone="orange"
          />
        </div>

        {resumo && <p style={{ marginTop: 12 }}>{comentario}</p>}
      </SectionCard>

      <SectionCard title="Testes por área" subtitle="Resultado de cada classe de teste">
        <div className="table-wrap">
          {carregando ? (
            <div className="empty-state"><strong>Carregando...</strong></div>
          ) : classes.length === 0 ? (
            <div className="empty-state"><strong>Sem dados de testes.</strong></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Área</th><th>Classe</th><th>Testes</th><th>Aprovados</th>
                  <th>Falhas</th><th>Erros</th><th>Ignorados</th><th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.nome}>
                    <td>{c.area}</td>
                    <td>{c.nome}</td>
                    <td>{c.total}</td>
                    <td>{c.aprovados}</td>
                    <td>{c.falhas}</td>
                    <td>{c.erros}</td>
                    <td>{c.ignorados}</td>
                    <td>{fmt2(c.tempoSegundos)} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Casos com problema" subtitle="Testes que falharam ou deram erro">
        <div className="table-wrap">
          {carregando ? (
            <div className="empty-state"><strong>Carregando...</strong></div>
          ) : problemas.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum caso com problema.</strong>
              <span>Todos os testes da última execução passaram.</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Classe</th><th>Teste</th><th>Mensagem</th></tr>
              </thead>
              <tbody>
                {problemas.map((p, idx) => (
                  <tr key={`${p.classe}-${p.teste}-${idx}`}>
                    <td>{p.classe}</td>
                    <td>{p.teste}</td>
                    <td>{p.mensagem}</td>
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

/* ===================== PÁGINA (ABAS) ===================== */

export default function Relatorios({ onNotice }) {
  const usuario = getUsuarioLogado();
  const ehAdmin = usuario?.perfil === "ADMINISTRADOR";

  const [aba, setAba] = useState("operacional");
  const [dias, setDias] = useState(7);

  const abas = [
    { id: "operacional", rotulo: "Operacional" },
    ...(ehAdmin ? [{ id: "seguranca", rotulo: "Segurança" }] : []),
    { id: "qualidade", rotulo: "Qualidade" },
  ];

  return (
    <>
      <div
        role="tablist"
        aria-label="Tipos de relatório"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        {abas.map((a) => {
          const ativa = aba === a.id;
          return (
            <button
              key={a.id}
              role="tab"
              aria-selected={ativa}
              className="secondary-button small"
              onClick={() => setAba(a.id)}
              style={{
                fontWeight: ativa ? 700 : 500,
                borderBottom: ativa ? "3px solid currentColor" : "3px solid transparent",
              }}
            >
              {a.rotulo}
            </button>
          );
        })}
      </div>

      {aba === "operacional" && <AbaOperacional dias={dias} setDias={setDias} onNotice={onNotice} />}
      {aba === "seguranca" && ehAdmin && <AbaSeguranca dias={dias} setDias={setDias} onNotice={onNotice} />}
      {aba === "qualidade" && <AbaQualidade />}
    </>
  );
}