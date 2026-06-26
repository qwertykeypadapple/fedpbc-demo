import { useState } from 'react';
import { M } from '../components/MathTeX.jsx';
import { LinePlot } from '../components/LinePlot.jsx';
import { fedAvgTwoClient, fedPbcTwoClient } from '../lib/sim.js';

const U1 = 0;
const U2 = 100;

export default function BiasDemo() {
  const [p1, setP1] = useState(0.5);
  const [p2, setP2] = useState(0.85);

  const xStar = (U1 + U2) / 2;
  const fedavg = fedAvgTwoClient(U1, U2, p1, p2);
  const fedpbc = fedPbcTwoClient(U1, U2);
  const bias = fedavg - xStar;

  // number-line geometry
  const W = 620,
    H = 150;
  const ml = 40,
    mr = 40;
  const toX = (v) => ml + (v / 100) * (W - ml - mr);
  const axisY = 96;

  // swept curve: fix p1, vary p2 over [0,1] (reproduces Fig. 2)
  const curve = [];
  for (let q = 0.02; q <= 1.0001; q += 0.02) curve.push({ x: q, y: fedAvgTwoClient(U1, U2, p1, q) });
  const optLine = [
    { x: 0, y: xStar },
    { x: 1, y: xStar },
  ];
  const marker = [{ x: p2, y: fedavg }];

  return (
    <section id="bias">
      <div className="wrap">
        <p className="eyebrow">2 · The bias</p>
        <h2>Two clients, one biased answer</h2>
        <p className="lead muted">
          The paper's cleanest argument needs just two clients. Client&nbsp;1's data is best fit by
          the number <M>{'u_1'}</M>; client&nbsp;2's by <M>{'u_2'}</M>. The fair shared optimum is
          the midpoint, <M>{'x^\\star=\\tfrac{u_1+u_2}{2}'}</M>.
        </p>
        <p>
          Drag the connection rates below. <span className="fp">FedPBC</span> stays pinned at the
          fair answer. <span className="fa">FedAvg</span>'s expected output slides toward whichever
          client connects more — even though both clients' data is equally valid.
        </p>
      </div>

      <div className="wrap-wide">
        <div className="panel">
          <span className="sourcetag live">live · exact closed form</span>
          <div className="panel-grid" style={{ marginTop: 14 }}>
            <div>
              {/* number line */}
              <svg viewBox={`0 0 ${W} ${H}`} className="lineplot">
                <line x1={ml} y1={axisY} x2={W - mr} y2={axisY} className="axis" />
                {[0, 25, 50, 75, 100].map((v) => (
                  <g key={v}>
                    <line x1={toX(v)} y1={axisY} x2={toX(v)} y2={axisY + 5} className="axis" />
                    <text x={toX(v)} y={axisY + 19} className="ticklabel" textAnchor="middle">
                      {v}
                    </text>
                  </g>
                ))}
                {/* client optima */}
                {[
                  [U1, 'u₁', '#5a6675'],
                  [U2, 'u₂', '#5a6675'],
                ].map(([v, lab, col]) => (
                  <g key={lab}>
                    <circle cx={toX(v)} cy={axisY} r="5" fill={col} />
                    <text x={toX(v)} y={axisY - 12} className="ticklabel" textAnchor="middle" style={{ fontWeight: 700 }}>
                      {lab}={v}
                    </text>
                  </g>
                ))}
                {/* true optimum */}
                <g>
                  <line x1={toX(xStar)} y1={axisY - 34} x2={toX(xStar)} y2={axisY + 8} stroke="#2e7d57" strokeWidth="1.5" strokeDasharray="4 3" />
                  <text x={toX(xStar)} y={axisY - 40} textAnchor="middle" fontFamily="Inter" fontSize="12" fontWeight="700" fill="#2e7d57">
                    x★ (fair) = {xStar}
                  </text>
                </g>
                {/* FedPBC marker */}
                <g>
                  <polygon
                    points={`${toX(fedpbc)},${axisY + 12} ${toX(fedpbc) - 7},${axisY + 26} ${toX(fedpbc) + 7},${axisY + 26}`}
                    fill="#1f4e8c"
                  />
                  <text x={toX(fedpbc)} y={axisY + 42} textAnchor="middle" fontFamily="Inter" fontSize="11.5" fontWeight="700" fill="#1f4e8c">
                    FedPBC
                  </text>
                </g>
                {/* FedAvg marker */}
                <g>
                  <line x1={toX(xStar)} y1={axisY - 4} x2={toX(fedavg)} y2={axisY - 4} stroke="#d1495b" strokeWidth="2" />
                  <circle cx={toX(fedavg)} cy={axisY} r="7" fill="#d1495b" stroke="#fff" strokeWidth="1.5" />
                  <text x={toX(fedavg)} y={axisY - 50} textAnchor="middle" fontFamily="Inter" fontSize="11.5" fontWeight="700" fill="#d1495b">
                    FedAvg = {fedavg.toFixed(1)}
                  </text>
                </g>
              </svg>

              <div className="callout bias" style={{ marginTop: 8 }}>
                <strong>Bias = {bias >= 0 ? '+' : ''}{bias.toFixed(1)}</strong>
                <span className="muted">
                  {' '}— FedAvg lands {Math.abs(bias) < 0.05 ? 'right on' : `${Math.abs(bias).toFixed(1)} away from`} the fair
                  optimum {xStar}.
                </span>
              </div>

              <p className="small muted">
                FedAvg's expected output (paper, Eq.&nbsp;3, two clients):
              </p>
              <div style={{ overflowX: 'auto' }}>
                <M display>
                  {`\\mathbb{E}[x_{\\mathrm{FedAvg}}]=\\frac{p_1(1-p_2)\\,u_1+(1-p_1)p_2\\,u_2+p_1p_2\\,\\frac{u_1+u_2}{2}}{p_1+p_2-p_1p_2}`}
                </M>
              </div>
            </div>

            <div className="controls">
              <div className="control">
                <label>
                  <span>
                    <M>{'p_1'}</M> — client 1 connection rate
                  </span>
                  <span className="val">{p1.toFixed(2)}</span>
                </label>
                <input type="range" min="0.02" max="1" step="0.01" value={p1} onChange={(e) => setP1(+e.target.value)} />
              </div>
              <div className="control">
                <label>
                  <span>
                    <M>{'p_2'}</M> — client 2 connection rate
                  </span>
                  <span className="val">{p2.toFixed(2)}</span>
                </label>
                <input type="range" min="0.02" max="1" step="0.01" value={p2} onChange={(e) => setP2(+e.target.value)} />
              </div>

              <div className="btnrow">
                <button className="ctl" onClick={() => { setP1(0.5); setP2(0.5); }}>
                  Equal rates
                </button>
                <button className="ctl active" onClick={() => { setP1(0.5); setP2(0.85); }}>
                  Reproduce Fig. 2
                </button>
              </div>

              <div className="readout">
                <div>
                  x★ &nbsp;=&nbsp; <b>{xStar}</b>
                </div>
                <div style={{ color: 'var(--fedpbc)' }}>
                  FedPBC &nbsp;=&nbsp; <b>{fedpbc.toFixed(2)}</b> &nbsp;(bias 0.00)
                </div>
                <div style={{ color: 'var(--fedavg)' }}>
                  FedAvg &nbsp;=&nbsp; <b>{fedavg.toFixed(2)}</b> &nbsp;(bias {bias >= 0 ? '+' : ''}
                  {bias.toFixed(2)})
                </div>
              </div>

              <p className="small muted" style={{ marginTop: 4 }}>
                The right-hand plot fixes <M>{'p_1'}</M> and sweeps <M>{'p_2'}</M> — this is exactly
                the paper's Fig.&nbsp;2. FedAvg only hits the fair optimum at the single point{' '}
                <M>{'p_2=p_1'}</M>.
              </p>
            </div>
          </div>

          {/* Fig 2 reproduction */}
          <div style={{ marginTop: 10 }}>
            <div className="legend">
              <span className="key">
                <span className="swatch" style={{ background: 'var(--fedavg)' }} /> FedAvg expected output
              </span>
              <span className="key">
                <span className="swatch" style={{ background: 'var(--good)', height: 0, borderTop: '2px dashed var(--good)' }} /> fair optimum x★
              </span>
              <span className="key">
                <span className="swatch" style={{ background: 'var(--fedpbc)', borderRadius: '50%', width: 10, height: 10 }} /> current <M>{'p_2'}</M>
              </span>
            </div>
            <LinePlot
              width={1000}
              height={300}
              xLabel="p₂  (client 2 connection rate)"
              yLabel="E[ FedAvg output ]"
              xMax={1}
              yMin={0}
              yMax={100}
              series={[
                { data: optLine, color: 'var(--good)', dash: true, width: 1.5 },
                { data: curve, color: 'var(--fedavg)', width: 2.5 },
                { data: marker, color: 'var(--fedpbc)', dots: true, r: 6 },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="wrap">
        <p style={{ marginTop: 28 }}>
          So the bias is real and it's quantifiable. The natural question:{' '}
          <strong>how can simply delaying when the server broadcasts possibly fix this?</strong>{' '}
          That's the surprising heart of the paper.
        </p>
      </div>
    </section>
  );
}
