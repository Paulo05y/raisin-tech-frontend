import { useMemo, useState } from "react";

function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const midX = (x0 + x1) / 2;
    d += ` C ${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export default function LineChart({ values, labels, unit, stroke = "#7A16F8", gradientId = "purpleGradient", titleFormat }) {
  const [active, setActive] = useState(null);
  const width = 720;
  const height = 250;
  const left = 14;
  const right = 706;
  const top = 22;
  const bottom = 202;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = useMemo(() => values.map((value, index) => {
    const x = left + (index / (values.length - 1)) * (right - left);
    const y = bottom - ((value - min) / range) * (bottom - top);
    return [x, y];
  }), [values, min, range]);
  const line = smoothPath(points);
  const area = `${line} L ${right} ${bottom} L ${left} ${bottom} Z`;

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
      <svg className="line-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Gráfico de ${unit}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.20" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const y = top + (i / 3) * (bottom - top);
          return <line key={i} x1={left} x2={right} y1={y} y2={y} className="chart-grid-line" />;
        })}
        <path d={area} fill={`url(#${gradientId})`} className="chart-area" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="chart-smooth-line" />
        {points.map(([x, y], index) => (
          <g key={index} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} className="chart-point-group">
            <circle cx={x} cy={y} r="9" className="chart-hit-area" />
            <circle cx={x} cy={y} r={active === index ? 5.5 : 4} fill="white" stroke={stroke} strokeWidth="3" className="chart-point" />
          </g>
        ))}
      </svg>
      <div className="chart-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}
