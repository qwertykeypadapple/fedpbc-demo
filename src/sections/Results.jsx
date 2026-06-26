import { useState } from 'react';
import { M } from '../components/MathTeX.jsx';

// Test accuracy (%) transcribed from Table 1 of the paper. FedPBC and FedAU/F3AST/FedAvg
// are not aided by memory or known statistics; MIFA is memory-aided (shown for context).
// Refer to the paper for the authoritative full table.
const DATASETS = ['SVHN', 'CIFAR-10', 'CINIC-10'];
const PATTERNS = {
  'bernoulli-ti': {
    label: 'Bernoulli · time-invariant',
    rows: {
      FedPBC: [83.3, 66.3, 49.7],
      FedAU: [83.0, 65.9, 45.4],
      F3AST: [76.9, 57.7, 40.3],
      FedAvg: [75.2, 58.7, 37.8],
      MIFA: [80.8, 67.1, 47.0],
    },
  },
  'bernoulli-tv': {
    label: 'Bernoulli · time-varying',
    rows: {
      FedPBC: [84.0, 65.0, 49.1],
      FedAU: [80.3, 63.5, 43.4],
      F3AST: [78.1, 59.6, 40.8],
      FedAvg: [72.7, 56.2, 35.6],
      MIFA: [79.2, 65.5, 46.1],
    },
  },
  'cyclic-noreset': {
    label: 'Cyclic · without reset',
    rows: {
      FedPBC: [84.2, 65.2, 49.0],
      FedAU: [79.8, 63.1, 42.8],
      F3AST: [71.7, 57.3, 39.7],
      FedAvg: [71.7, 56.0, 36.6],
      MIFA: [70.9, 58.7, 41.8],
    },
  },
  'cyclic-reset': {
    label: 'Cyclic · with reset',
    rows: {
      FedPBC: [83.7, 64.0, 49.1],
      FedAU: [77.1, 61.0, 42.1],
      F3AST: [75.3, 61.0, 42.2],
      FedAvg: [69.0, 56.0, 35.1],
      MIFA: [77.3, 64.3, 45.2],
    },
  },
};
const COLORS = {
  FedPBC: '#1f4e8c',
  FedAU: '#6b8cae',
  F3AST: '#a8bdd4',
  FedAvg: '#d1495b',
  MIFA: '#9aa4b2',
};
const MEMORY = { MIFA: true };

export default function Results() {
  const [pat, setPat] = useState('bernoulli-ti');
  const rows = PATTERNS[pat].rows;
  const algos = Object.keys(rows);

  // grouped bar chart geometry
  const W = 1000,
    H = 380;
  const pad = { t: 24, r: 16, b: 56, l: 48 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const yMin = 30,
    yMax = 90;
  const toY = (v) => pad.t + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const groupW = plotW / DATASETS.length;
  const barW = (groupW * 0.74) / algos.length;

  return (
    <section id="results">
      <div className="wrap">
        <p className="eyebrow">5 · Real datasets</p>
        <h2>Does it hold up beyond the toy?</h2>
        <p className="lead muted">
          The authors train real convolutional networks on SVHN, CIFAR-10, and CINIC-10 across a
          battery of unreliable patterns. The toy story survives:{' '}
          <span className="fp">FedPBC</span> is the strongest method that needs{' '}
          <em>no</em> memory and <em>no</em> knowledge of the connection rates.
        </p>
      </div>

      <div className="wrap-wide">
        <div className="panel">
          <span className="sourcetag cited">from paper · Table 1</span>
          <div className="control" style={{ margin: '14px 0 8px' }}>
            <label><span>Unreliable pattern</span></label>
            <div className="seg">
              {Object.entries(PATTERNS).map(([k, v]) => (
                <button key={k} className={pat === k ? 'active' : ''} onClick={() => setPat(k)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="legend">
            {algos.map((a) => (
              <span className="key" key={a}>
                <span className="swatch" style={{ background: COLORS[a], height: 10, width: 10, borderRadius: 2 }} />
                {a}
                {MEMORY[a] ? ' (memory-aided)' : ''}
              </span>
            ))}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            {/* y grid + ticks */}
            {[30, 40, 50, 60, 70, 80, 90].map((v) => (
              <g key={v}>
                <line x1={pad.l} x2={pad.l + plotW} y1={toY(v)} y2={toY(v)} stroke="#e3e7ee" />
                <text x={pad.l - 8} y={toY(v) + 3.5} textAnchor="end" fontFamily="Inter" fontSize="11" fill="#8a93a3">
                  {v}
                </text>
              </g>
            ))}
            {DATASETS.map((d, gi) => {
              const gx = pad.l + gi * groupW + groupW * 0.13;
              return (
                <g key={d}>
                  {algos.map((a, ai) => {
                    const v = rows[a][gi];
                    const x = gx + ai * barW;
                    const y = toY(v);
                    const isOurs = a === 'FedPBC';
                    return (
                      <g key={a}>
                        <rect x={x} y={y} width={barW - 2} height={pad.t + plotH - y} rx="2" fill={COLORS[a]} opacity={isOurs ? 1 : 0.85} stroke={isOurs ? '#13315c' : 'none'} strokeWidth={isOurs ? 1 : 0} />
                        <text x={x + (barW - 2) / 2} y={y - 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fontWeight={isOurs ? 700 : 400} fill={isOurs ? '#13315c' : '#8a93a3'}>
                          {v.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                  <text x={pad.l + gi * groupW + groupW / 2} y={H - 32} textAnchor="middle" fontFamily="Inter" fontSize="13" fontWeight="700" fill="#4a5160">
                    {d}
                  </text>
                </g>
              );
            })}
            <text x={pad.l + plotW / 2} y={H - 8} textAnchor="middle" fontFamily="Inter" fontSize="12" fill="#8a93a3">
              Test accuracy (%) — higher is better
            </text>
          </svg>

          <p className="small muted" style={{ marginTop: 6 }}>
            Among methods without memory or known statistics (FedPBC, FedAU, F3AST, FedAvg), FedPBC
            leads on every dataset and pattern. It is even competitive with{' '}
            <strong>MIFA</strong>, which is allowed to store every client's last update. Plain{' '}
            <span className="fa">FedAvg</span> trails badly — the bias from Section 2, now in a
            10-class image classifier.
          </p>
          <p className="faint small">
            Values transcribed from Table 1 (test accuracy, averaged over the last 100 rounds, 3
            seeds). See the paper for full ± std, train accuracy, and additional baselines.
          </p>
        </div>
      </div>
    </section>
  );
}
