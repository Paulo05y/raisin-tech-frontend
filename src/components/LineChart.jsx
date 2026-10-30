import { useMemo, useState } from "react";

const WIDTH = 720;
const HEIGHT = 250;
const LEFT = 52;   // espaço para os valores do eixo vertical
const RIGHT = 706;
const TOP = 22;
const BOTTOM = 202;
const MAX_ROTULOS = 6;

// Linha reta ligando os pontos (sem curva)
function linePath(points) {
  if (points.length === 0) return "";
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

export default function LineChart({ values, labels, unit, stroke = "#7A16F8", titleFormat }) {
  const [active, setActive] = useState(null);

  const { points, ticks } = useMemo(() => {
    if (!values || values.length === 0) return { points: [], ticks: [] };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const folga = (max - min || 1) * 0.1; // margem para a linha não encostar nas bordas
    const minEixo = min - folga;
    const maxEixo = max + folga;
    const faixa = maxEixo - minEixo;

    const pontos = values.map((value, index) => {
      const x = values.length === 1
        ? (LEFT + RIGHT) / 2
        : LEFT + (index / (values.length - 1)) * (RIGHT - LEFT);
      const y = BOTTOM - ((value - minEixo) / faixa) * (BOTTOM - TOP);
      return [x, y];
    });

    const casas = faixa < 5 ? 1 : 0;
    const marcas = [0, 1, 2, 3].map((i) => {
      const valor = maxEixo - (i / 3) * faixa;
      return {
        y: TOP + (i / 3) * (BOTTOM - TOP),
        texto: valor.toFixed(casas).replace(".", ","),
      };
    });

    return { points: pontos, ticks: marcas };
  }, [values]);

  if (points.length === 0) return null;

  // Descobre o ponto mais próximo do mouse/dedo
  function acompanhar(evento) {
    const rect = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - rect.left) / rect.width) * WIDTH;
    const indice = values.length === 1
      ? 0
      : Math.round(((x - LEFT) / (RIGHT - LEFT)) * (values.length - 1));
    setActive(Math.min(Math.max(indice, 0), values.length - 1));
  }

  // No máximo MAX_ROTULOS horários embaixo, espalhados por igual
  const total = labels.length;
  const indicesRotulos = [
    ...new Set(
      total <= MAX_ROTULOS
        ? labels.map((_, i) => i)
        : Array.from({ length: MAX_ROTULOS }, (_, k) => Math.round((k * (total - 1)) / (MAX_ROTULOS - 1)))
    ),
  ];

  const pontoAtivo = active !== null ? points[active] : null;

  return (
    <div className="line-chart-wrap">
      <div className="chart-tooltip-slot">
        {active !== null && (
          <div className="chart-tooltip">
            <strong>{titleFormat ? titleFormat(values[active]) : `${values[active]}${unit}`}</strong>
            <span>{labels[active]}</span>
          </div>
        )}
      </div>

      <svg
        className="line-chart-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Gráfico de ${unit}`}
        onPointerMove={acompanhar}
        onPointerDown={acompanhar}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((marca) => (
          <g key={marca.y}>
            <line x1={LEFT} x2={RIGHT} y1={marca.y} y2={marca.y} className="chart-grid-line" />
            <text x={LEFT - 8} y={marca.y + 4} textAnchor="end" fontSize="12" fill="#6b6580">
              {marca.texto}
            </text>
          </g>
        ))}

        <path
          d={linePath(points)}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chart-smooth-line"
        />

        {pontoAtivo && (
          <g pointerEvents="none">
            <line x1={pontoAtivo[0]} x2={pontoAtivo[0]} y1={TOP} y2={BOTTOM} stroke={stroke} strokeOpacity="0.3" strokeWidth="1" />
            <circle cx={pontoAtivo[0]} cy={pontoAtivo[1]} r="5" fill="white" stroke={stroke} strokeWidth="3" />
          </g>
        )}
      </svg>

      <div
        className="chart-labels"
        style={{
          paddingLeft: `${(LEFT / WIDTH) * 100}%`,
          paddingRight: `${((WIDTH - RIGHT) / WIDTH) * 100}%`,
        }}
      >
        {indicesRotulos.map((i) => <span key={i}>{labels[i]}</span>)}
      </div>
    </div>
  );
}