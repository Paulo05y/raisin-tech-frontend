import { useEffect, useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import api from "../services/api";
import "../styles/mercado.css";

const PERIODOS = [
  { dias: 7, label: "Últimos 7 dias" },
  { dias: 30, label: "Últimos 30 dias" },
  { dias: 60, label: "Últimos 60 dias" },
];

const pad = (n) => String(n).padStart(2, "0");
const dataISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const diasAtras = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return dataISO(d);
};

const brl = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ton = (n) =>
  `${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`;
const pct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")}%`;
const dataCurta = (iso) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};
const dataCompleta = (iso) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};
// A data vem sem fuso (LocalDateTime); usamos só o dia para não haver deslocamento
const diaDe = (registro) => registro.dataAtualizacao.slice(0, 10);

const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

function variacaoPercentual(pontos) {
  if (pontos.length < 2) return null;
  const primeiro = pontos[0].valor;
  const ultimo = pontos[pontos.length - 1].valor;
  return ((ultimo - primeiro) / primeiro) * 100;
}

// Comentário do gráfico, sempre com os valores reais calculados
function resumirSerie(pontos, formatar, nome) {
  if (pontos.length < 2) return "Poucos registros no período para calcular a variação.";
  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const variacao = variacaoPercentual(pontos);
  const maior = pontos.reduce((a, b) => (b.valor > a.valor ? b : a));
  const menor = pontos.reduce((a, b) => (b.valor < a.valor ? b : a));
  const verbo = Math.abs(variacao) < 0.5 ? "ficou estável" : variacao > 0 ? "subiu" : "caiu";

  return `${nome} ${verbo} (${pct(variacao)}): de ${formatar(primeiro.valor)} em ${dataCurta(
    primeiro.dia
  )} para ${formatar(ultimo.valor)} em ${dataCurta(ultimo.dia)}. Maior valor: ${formatar(
    maior.valor
  )} (${dataCurta(maior.dia)}); menor: ${formatar(menor.valor)} (${dataCurta(menor.dia)}).`;
}

function GraficoLinha({ pontos, cor, formatar, titulo }) {
  const W = 600;
  const H = 230;
  const ml = 70;
  const mr = 16;
  const mt = 16;
  const mb = 32;

  const valores = pontos.map((p) => p.valor);
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const folga = (max - min) * 0.1;
  min -= folga;
  max += folga;

  const x = (i) => ml + (pontos.length === 1 ? 0.5 : i / (pontos.length - 1)) * (W - ml - mr);
  const y = (v) => mt + (1 - (v - min) / (max - min)) * (H - mt - mb);

  const linha = pontos
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`)
    .join(" ");

  const grades = [0, 1, 2, 3].map((k) => min + ((max - min) * k) / 3);
  const indicesRotulo = [...new Set([0, Math.floor((pontos.length - 1) / 2), pontos.length - 1])];
  const ultimo = pontos.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mercado-svg" role="img" aria-label={titulo}>
      {grades.map((g) => (
        <g key={g}>
          <line x1={ml} x2={W - mr} y1={y(g)} y2={y(g)} stroke="#e8e5f0" strokeWidth="1" />
          <text x={ml - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#6b6580">
            {formatar(g)}
          </text>
        </g>
      ))}

      <path d={linha} fill="none" stroke={cor} strokeWidth="2.5" strokeLinejoin="round" />

      {pontos.map((p, i) => (
        <circle key={p.dia} cx={x(i)} cy={y(p.valor)} r="5" fill="transparent">
          <title>{`${dataCompleta(p.dia)}: ${formatar(p.valor)}`}</title>
        </circle>
      ))}
      <circle cx={x(ultimo)} cy={y(pontos[ultimo].valor)} r="4.5" fill={cor} />

      {indicesRotulo.map((i, k) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          fontSize="11"
          fill="#6b6580"
          textAnchor={k === 0 ? "start" : i === pontos.length - 1 ? "end" : "middle"}
        >
          {dataCurta(pontos[i].dia)}
        </text>
      ))}
    </svg>
  );
}

export default function DadosMercado() {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [produto, setProduto] = useState("");
  const [dias, setDias] = useState(30);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const res = await api.get("/api/dados-mercado");
        if (!cancelado) {
          const dados = res.data || [];
          setRegistros(dados);
          setErro("");
          const nomes = [...new Set(dados.map((r) => r.produto))].sort();
          if (nomes.length > 0) setProduto((atual) => atual || nomes[0]);
        }
      } catch (e) {
        if (!cancelado) setErro("Não foi possível carregar os dados de mercado do servidor.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  const produtos = useMemo(
    () => [...new Set(registros.map((r) => r.produto))].sort(),
    [registros]
  );

  const corte = diasAtras(dias - 1);

  // Registros de uma variedade dentro do período, em ordem de data
  const serieDoProduto = (nome) =>
    registros
      .filter((r) => r.produto === nome && diaDe(r) >= corte)
      .sort((a, b) => a.dataAtualizacao.localeCompare(b.dataAtualizacao));

  const serie = useMemo(() => serieDoProduto(produto), [registros, produto, corte]);

  const pontosPreco = serie.map((r) => ({ dia: diaDe(r), valor: Number(r.preco) }));
  const pontosDemanda = serie
    .filter((r) => r.demandaToneladas !== null && r.demandaToneladas !== undefined)
    .map((r) => ({ dia: diaDe(r), valor: Number(r.demandaToneladas) }));

  const precoAtual = pontosPreco.length ? pontosPreco[pontosPreco.length - 1].valor : null;
  const variacaoPreco = variacaoPercentual(pontosPreco);
  const demandaAtual = pontosDemanda.length ? pontosDemanda[pontosDemanda.length - 1].valor : null;
  const demandaMedia = pontosDemanda.length ? media(pontosDemanda.map((p) => p.valor)) : null;

  const comparativo = produtos.map((nome) => {
    const s = serieDoProduto(nome);
    const precos = s.map((r) => ({ dia: diaDe(r), valor: Number(r.preco) }));
    const ultimo = s[s.length - 1];
    return {
      nome,
      preco: precos.length ? precos[precos.length - 1].valor : null,
      variacao: variacaoPercentual(precos),
      demanda: ultimo ? ultimo.demandaToneladas : null,
      dia: ultimo ? diaDe(ultimo) : null,
    };
  });

  const simulado = registros.some((r) => (r.fonte || "").toLowerCase().startsWith("simulado"));

  if (carregando) {
    return (
      <SectionCard title="Dados de mercado" subtitle="Preço da uva e demanda de exportação">
        <div className="history-result-count">Carregando...</div>
      </SectionCard>
    );
  }

  if (erro) {
    return (
      <SectionCard title="Dados de mercado" subtitle="Preço da uva e demanda de exportação">
        <div className="filter-feedback error" role="alert">{erro}</div>
      </SectionCard>
    );
  }

  if (registros.length === 0) {
    return (
      <SectionCard title="Dados de mercado" subtitle="Preço da uva e demanda de exportação">
        <div className="empty-state">
          <strong>Nenhum dado de mercado cadastrado.</strong>
          <span>Quando houver registros de preço e demanda, eles aparecem aqui.</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Dados de mercado" subtitle="Preço da uva e demanda de exportação">
      {simulado && (
        <div className="mercado-nota">
          Dados simulados para demonstração. Os valores não representam preços reais de mercado.
        </div>
      )}

      <div className="filters">
        <div>
          <label htmlFor="mercado-produto">Variedade</label>
          <select
            id="mercado-produto"
            className="mercado-select"
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
          >
            {produtos.map((nome) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mercado-periodo">Período</label>
          <select
            id="mercado-periodo"
            className="mercado-select"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          >
            {PERIODOS.map((p) => (
              <option key={p.dias} value={p.dias}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {serie.length === 0 ? (
        <div className="empty-state">
          <strong>Sem registros neste período.</strong>
          <span>Escolha um período maior ou outra variedade.</span>
        </div>
      ) : (
        <>
          <div className="mercado-kpis">
            <div className="mercado-kpi">
              <span>Preço atual</span>
              <strong>{precoAtual !== null ? `${brl(precoAtual)}/kg` : "—"}</strong>
            </div>
            <div className="mercado-kpi">
              <span>Variação do preço no período</span>
              <strong className={variacaoPreco !== null && variacaoPreco < 0 ? "mercado-down" : "mercado-up"}>
                {variacaoPreco !== null ? pct(variacaoPreco) : "—"}
              </strong>
            </div>
            <div className="mercado-kpi">
              <span>Demanda atual</span>
              <strong>{demandaAtual !== null ? ton(demandaAtual) : "—"}</strong>
            </div>
            <div className="mercado-kpi">
              <span>Demanda média no período</span>
              <strong>{demandaMedia !== null ? ton(demandaMedia) : "—"}</strong>
            </div>
          </div>

          <div className="mercado-charts">
            <div className="mercado-chart">
              <h3>Preço por kg</h3>
              {pontosPreco.length > 0 && (
                <GraficoLinha
                  pontos={pontosPreco}
                  cor="#6d28d9"
                  formatar={brl}
                  titulo={`Preço por kg de ${produto}`}
                />
              )}
              <p className="mercado-comment">{resumirSerie(pontosPreco, brl, "O preço")}</p>
            </div>

            <div className="mercado-chart">
              <h3>Demanda de exportação</h3>
              {pontosDemanda.length > 0 ? (
                <GraficoLinha
                  pontos={pontosDemanda}
                  cor="#0f9d58"
                  formatar={ton}
                  titulo={`Demanda de exportação de ${produto}`}
                />
              ) : null}
              <p className="mercado-comment">
                {pontosDemanda.length > 0
                  ? resumirSerie(pontosDemanda, ton, "A demanda")
                  : "Esta variedade não tem registros de demanda no período."}
              </p>
            </div>
          </div>
        </>
      )}

      <h3 className="mercado-subtitulo">Comparativo entre variedades ({PERIODOS.find((p) => p.dias === dias)?.label.toLowerCase()})</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Variedade</th>
              <th>Preço atual</th>
              <th>Variação no período</th>
              <th>Demanda atual</th>
              <th>Última atualização</th>
            </tr>
          </thead>
          <tbody>
            {comparativo.map((linha) => (
              <tr key={linha.nome}>
                <td>{linha.nome}</td>
                <td>{linha.preco !== null ? `${brl(linha.preco)}/kg` : "—"}</td>
                <td>
                  {linha.variacao !== null ? (
                    <span className={`tag ${linha.variacao >= 0 ? "success" : "orange"}`}>
                      {pct(linha.variacao)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{linha.demanda !== null && linha.demanda !== undefined ? ton(linha.demanda) : "—"}</td>
                <td>{linha.dia ? dataCompleta(linha.dia) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}