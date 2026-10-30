import { useEffect, useState } from "react";
import { Cloud, CloudRain, CloudSun, Droplets, PackageCheck, Sun, Thermometer, TrendingUp } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import api from "../services/api";
import "../styles/previsoes.css";

const ATUALIZACAO_MS = 10 * 60 * 1000; // o back guarda a previsão em memória por 10 min

const fmt = (n) => Number(n).toFixed(1).replace(".", ",");
const sinal = (n) => `${n > 0 ? "+" : ""}${fmt(n)}`;

// Códigos WMO usados pela Open-Meteo
function condicao(codigo) {
  if (codigo === null || codigo === undefined) return { texto: "—", icon: Cloud };
  if (codigo === 0) return { texto: "Céu limpo", icon: Sun };
  if (codigo <= 2) return { texto: "Parcialmente nublado", icon: CloudSun };
  if (codigo <= 3) return { texto: "Nublado", icon: Cloud };
  if (codigo <= 48) return { texto: "Neblina", icon: Cloud };
  if (codigo <= 67) return { texto: "Chuva", icon: CloudRain };
  if (codigo <= 82) return { texto: "Chuva forte", icon: CloudRain };
  return { texto: "Tempestade", icon: CloudRain };
}

const diaCurto = (data) =>
  new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

const diaMes = (data) =>
  new Date(`${data}T12:00:00`)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "")
    .toUpperCase();

export default function Previsoes() {
  const [produtos, setProdutos] = useState([]);
  const [produto, setProduto] = useState(null); // null = ainda carregando a lista de variedades
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // 1) Lista de variedades (dados de mercado)
  useEffect(() => {
    let cancelado = false;

    async function carregarProdutos() {
      try {
        const res = await api.get("/api/dados-mercado");
        const nomes = [...new Set((res.data || []).map((r) => r.produto))].sort();
        if (!cancelado) {
          setProdutos(nomes);
          setProduto(nomes[0] ?? "");
        }
      } catch (e) {
        if (!cancelado) {
          setProdutos([]);
          setProduto("");
        }
      }
    }

    carregarProdutos();
    return () => {
      cancelado = true;
    };
  }, []);

  // 2) Previsão (de novo a cada troca de variedade e a cada 10 minutos)
  useEffect(() => {
    if (produto === null) return undefined;
    let cancelado = false;

    async function carregar() {
      try {
        const res = await api.get("/api/previsoes", { params: produto ? { produto } : {} });
        if (!cancelado) {
          setDados(res.data);
          setErro("");
        }
      } catch (e) {
        if (!cancelado) setErro("Não foi possível gerar a previsão. Tente novamente em instantes.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    setCarregando(true);
    carregar();
    const id = setInterval(carregar, ATUALIZACAO_MS);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [produto]);

  if (!dados && carregando) return <div className="empty-state"><strong>Gerando previsão...</strong></div>;
  if (!dados) return <div className="filter-feedback error" role="alert">{erro || "Sem dados de previsão."}</div>;

  const { atual, criterios: c, calibracao, dias, janelaColheita: janela, exportacao } = dados;

  const total = dias.length;
  const diasFavoraveis = dias.filter((d) => d.favoravel).length;
  const contTemp = dias.filter(
    (d) => d.tempMax != null && d.tempMin != null && d.tempMax <= c.temperaturaMaxima && d.tempMin >= c.temperaturaMinima
  ).length;
  const contUmid = dias.filter(
    (d) => d.umidade != null && d.umidade >= c.umidadeMinima && d.umidade <= c.umidadeMaxima
  ).length;
  const contChuva = dias.filter((d) => d.chanceChuva <= c.chanceChuvaMaxima && d.chuvaMm <= c.chuvaMmMaxima).length;

  const condAtual = condicao(atual?.codigoTempo);
  const horaGerada = dados.geradoEm ? dados.geradoEm.slice(11, 16) : "";

  let rotuloExportacao = "Sem dados";
  if (exportacao.temDados) rotuloExportacao = exportacao.favoravel ? "Favorável" : "Desfavorável";

  return (
    <>
      {erro && <div className="filter-feedback error" role="alert">{erro}</div>}

      <div className="stats-grid">
        <StatCard
          icon={Thermometer}
          label="Temperatura agora"
          value={atual?.temperatura != null ? `${fmt(atual.temperatura)} °C` : "—"}
          detail={`${dados.local} • modelo meteorológico`}
        />
        <StatCard
          icon={Droplets}
          label="Umidade agora"
          value={atual?.umidade != null ? `${Math.round(atual.umidade)}%` : "—"}
          detail={condAtual.texto}
          tone="blue"
        />
        <StatCard
          icon={PackageCheck}
          label="Janela de colheita"
          value={janela ? "Ideal" : "Indisponível"}
          detail={`${diasFavoraveis} de ${total} dias favoráveis`}
          tone="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Exportação"
          value={rotuloExportacao}
          detail={exportacao.produto || "Sem variedade selecionada"}
          tone="orange"
        />
      </div>

      <SectionCard
        title="Janela ideal de colheita"
        subtitle={`Próximos ${total} dias • ${dados.local}${horaGerada ? ` • atualizado às ${horaGerada}` : ""}`}
      >
        <p className="previsao-resumo">{dados.resumo}</p>

        <div className={`previsao-nota ${calibracao.aplicada ? "ok" : "aviso"}`}>{calibracao.mensagem}</div>

        <div className="forecast-highlight">
          <div className="forecast-icon"><Sun size={28} /></div>
          <div>
            <span>{janela ? "JANELA RECOMENDADA" : "SEM JANELA FAVORÁVEL"}</span>
            <strong>{janela ? `${diaMes(janela.inicio)} — ${diaMes(janela.fim)}` : "—"}</strong>
            <p>
              {janela
                ? `${janela.dias} dias seguidos dentro de todos os critérios.`
                : `Nenhuma sequência de ${c.minDiasJanela} dias favoráveis nos próximos ${total} dias.`}
            </p>
          </div>
          <div className="confidence"><strong>{diasFavoraveis}/{total}</strong><span>dias favoráveis</span></div>
        </div>

        <div className="condition-grid">
          <div>
            <Thermometer size={18} />
            <span>Temperatura {c.temperaturaMinima}–{c.temperaturaMaxima} °C</span>
            <strong>{contTemp}/{total} dias</strong>
          </div>
          <div>
            <Droplets size={18} />
            <span>Umidade {c.umidadeMinima}–{c.umidadeMaxima}%</span>
            <strong>{contUmid}/{total} dias</strong>
          </div>
          <div>
            <CloudRain size={18} />
            <span>Chuva ≤ {c.chanceChuvaMaxima}% e ≤ {c.chuvaMmMaxima} mm</span>
            <strong>{contChuva}/{total} dias</strong>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Janela de exportação"
        subtitle="Tendência de preço e demanda"
        action={
          produtos.length > 0 ? (
            <select
              className="previsao-select"
              value={produto ?? ""}
              onChange={(e) => setProduto(e.target.value)}
              aria-label="Variedade de uva"
            >
              {produtos.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
              ))}
            </select>
          ) : null
        }
      >
        {exportacao.temDados ? (
          <>
            <div className={`previsao-nota ${exportacao.favoravel ? "ok" : "aviso"}`}>
              {exportacao.favoravel
                ? "Momento favorável para exportar. "
                : "Momento não favorável para exportar agora. "}
              {exportacao.mensagem}
            </div>
            <div className="previsao-kpis">
              <div className="previsao-kpi">
                <span>Preço atual</span>
                <strong>{Number(exportacao.precoAtual).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/kg</strong>
              </div>
              <div className="previsao-kpi">
                <span>Variação do preço ({exportacao.diasAnalisados} dias)</span>
                <strong>{sinal(exportacao.variacaoPrecoPercentual)}%</strong>
              </div>
              <div className="previsao-kpi">
                <span>Demanda atual</span>
                <strong>{exportacao.demandaAtual != null ? `${fmt(exportacao.demandaAtual)} t` : "—"}</strong>
              </div>
              <div className="previsao-kpi">
                <span>Demanda média</span>
                <strong>{exportacao.demandaMedia != null ? `${fmt(exportacao.demandaMedia)} t` : "—"}</strong>
              </div>
            </div>
            <div className="previsao-nota info">
              Os dados de mercado são simulados para demonstração. A tendência do preço é calculada por regressão linear
              sobre os últimos registros.
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>Sem dados de mercado suficientes.</strong>
            <span>{exportacao.mensagem}</span>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Previsão dos próximos dias" subtitle="Fonte: Open-Meteo, corrigida pelo sensor quando há dados">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dia</th><th>Condição</th><th>Mín / Máx</th><th>Umidade média</th><th>Chuva</th><th>Colheita</th><th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => {
                const cond = condicao(d.codigoTempo);
                return (
                  <tr key={d.data}>
                    <td>{diaCurto(d.data)}</td>
                    <td>{cond.texto}</td>
                    <td>{d.tempMin != null ? fmt(d.tempMin) : "—"} / {d.tempMax != null ? fmt(d.tempMax) : "—"} °C</td>
                    <td>{d.umidade != null ? `${Math.round(d.umidade)}%` : "—"}</td>
                    <td>{d.chanceChuva}% • {fmt(d.chuvaMm)} mm</td>
                    <td>
                      <span className={`tag ${d.favoravel ? "success" : "orange"}`}>
                        {d.favoravel ? "Favorável" : "Atenção"}
                      </span>
                    </td>
                    <td className="previsao-motivo">{d.favoravel ? "—" : d.motivos.join("; ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}