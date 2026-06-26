// Lightweight SVG line plot with optional log-y axis. No chart library.
export function LinePlot({
  series, // [{ data: [{x,y}], color, label, dash }]
  width = 620,
  height = 340,
  xLabel = '',
  yLabel = '',
  xMax,
  yLog = false,
  yMin,
  yMax,
  yUnit = '',
  pad = { t: 18, r: 18, b: 44, l: 64 },
}) {
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const allX = series.flatMap((s) => s.data.map((p) => p.x));
  const allY = series.flatMap((s) => s.data.map((p) => p.y)).filter((v) => v > 0 || !yLog);
  const xhi = xMax ?? (allX.length ? Math.max(...allX) : 1);
  const xlo = 0;

  let ylo, yhi, toY;
  if (yLog) {
    const positive = allY.filter((v) => v > 0);
    const dataMin = positive.length ? Math.min(...positive) : 1e-4;
    const dataMax = positive.length ? Math.max(...positive) : 1;
    ylo = yMin ?? Math.pow(10, Math.floor(Math.log10(dataMin)));
    yhi = yMax ?? Math.pow(10, Math.ceil(Math.log10(dataMax)));
    const llo = Math.log10(ylo);
    const lhi = Math.log10(yhi);
    toY = (v) => {
      const lv = Math.log10(Math.max(v, ylo * 1e-3));
      return pad.t + plotH - ((lv - llo) / (lhi - llo)) * plotH;
    };
  } else {
    ylo = yMin ?? (allY.length ? Math.min(...allY) : 0);
    yhi = yMax ?? (allY.length ? Math.max(...allY) : 1);
    if (ylo === yhi) yhi = ylo + 1;
    toY = (v) => pad.t + plotH - ((v - ylo) / (yhi - ylo)) * plotH;
  }
  const toX = (v) => pad.l + ((v - xlo) / (xhi - xlo || 1)) * plotW;

  // ticks
  const xticks = [];
  const xstep = niceStep(xhi - xlo, 5);
  for (let v = 0; v <= xhi + 1e-9; v += xstep) xticks.push(v);

  const yticks = [];
  if (yLog) {
    for (let e = Math.log10(ylo); e <= Math.log10(yhi) + 1e-9; e++) yticks.push(Math.pow(10, Math.round(e)));
  } else {
    const ystep = niceStep(yhi - ylo, 5);
    for (let v = ylo; v <= yhi + 1e-9; v += ystep) yticks.push(v);
  }

  const linePath = (data) =>
    data
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`)
      .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="lineplot" role="img">
      {/* gridlines */}
      {yticks.map((v, i) => (
        <line key={'gy' + i} x1={pad.l} x2={pad.l + plotW} y1={toY(v)} y2={toY(v)} className="grid" />
      ))}
      {/* axes */}
      <line x1={pad.l} x2={pad.l} y1={pad.t} y2={pad.t + plotH} className="axis" />
      <line x1={pad.l} x2={pad.l + plotW} y1={pad.t + plotH} y2={pad.t + plotH} className="axis" />
      {/* x ticks */}
      {xticks.map((v, i) => (
        <g key={'x' + i}>
          <line x1={toX(v)} x2={toX(v)} y1={pad.t + plotH} y2={pad.t + plotH + 5} className="axis" />
          <text x={toX(v)} y={pad.t + plotH + 18} className="ticklabel" textAnchor="middle">
            {fmtX(v)}
          </text>
        </g>
      ))}
      {/* y ticks */}
      {yticks.map((v, i) => (
        <g key={'y' + i}>
          <line x1={pad.l - 5} x2={pad.l} y1={toY(v)} y2={toY(v)} className="axis" />
          <text x={pad.l - 9} y={toY(v) + 3.5} className="ticklabel" textAnchor="end">
            {yLog ? fmtLog(v) : fmtX(v)}
          </text>
        </g>
      ))}
      {/* series */}
      {series.map((s, i) =>
        s.dots ? (
          <g key={i}>
            {s.data.map((p, j) => (
              <circle key={j} cx={toX(p.x)} cy={toY(p.y)} r={s.r ?? 5} fill={s.color} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        ) : (
          <path
            key={i}
            d={linePath(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width ?? 2}
            strokeDasharray={s.dash ? '6 4' : undefined}
            strokeLinejoin="round"
          />
        )
      )}
      {/* axis labels */}
      <text x={pad.l + plotW / 2} y={height - 6} className="axistitle" textAnchor="middle">
        {xLabel}
      </text>
      <text
        x={16}
        y={pad.t + plotH / 2}
        className="axistitle"
        textAnchor="middle"
        transform={`rotate(-90 16 ${pad.t + plotH / 2})`}
      >
        {yLabel}
      </text>
    </svg>
  );
}

function niceStep(range, target) {
  if (range <= 0) return 1;
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

function fmtX(v) {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k';
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(2).replace(/\.?0+$/, '');
}

function fmtLog(v) {
  const e = Math.round(Math.log10(v));
  return `10${sup(e)}`;
}
function sup(n) {
  const map = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  return String(n)
    .split('')
    .map((c) => map[c] ?? c)
    .join('');
}
