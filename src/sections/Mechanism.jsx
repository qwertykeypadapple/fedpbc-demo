import { useEffect, useRef, useState } from 'react';
import { M } from '../components/MathTeX.jsx';

const N = 6;
const HOME = [10, 20, 30, 40, 50, 60]; // each client's own data optimum; fair average = 35
const INIT = HOME.slice();
const TRUE_AVG = HOME.reduce((s, v) => s + v, 0) / N;
const ALPHA = 0.5; // strength of each round's local training pull toward HOME
// Non-uniform connection rates for "auto" mode: low-value clients connect more,
// so FedAvg is dragged below the fair average (the Section-2 bias, live).
const RATES = [0.92, 0.92, 0.92, 0.32, 0.32, 0.32];

const localStep = (vals) => vals.map((x, i) => x + ALPHA * (HOME[i] - x));

// FedPBC mixing matrix W^(t), Eq. (4): active clients average; inactive rows = identity.
function pbcMatrix(active) {
  const k = active.filter(Boolean).length;
  const W = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      if (active[i] && active[j]) W[i][j] = 1 / k;
      else if (i === j && !active[i]) W[i][j] = 1;
    }
  return W;
}

// FedAvg's effective per-client update: server broadcasts the active-mean to everyone,
// so every row is the active-mean. Row-stochastic, but NOT column-stochastic.
function fedAvgMatrix(active) {
  const k = active.filter(Boolean).length;
  const W = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) if (active[j]) W[i][j] = k ? 1 / k : 0;
  return W;
}

function colSums(W) {
  return W[0].map((_, j) => W.reduce((s, row) => s + row[j], 0));
}

// Apply one round of mixing to actual client values.
function mixPBC(vals, active) {
  const idx = active.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return vals.slice();
  const mean = idx.reduce((s, i) => s + vals[i], 0) / idx.length;
  return vals.map((v, i) => (active[i] ? mean : v)); // offline keep their own
}
function mixFedAvg(vals, active) {
  const idx = active.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return vals.slice();
  const mean = idx.reduce((s, i) => s + vals[i], 0) / idx.length;
  return vals.map(() => mean); // everyone overwritten by the broadcast
}
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

function Heatmap({ W, title, ok, note }) {
  const cell = 34;
  const pad = 26;
  const size = N * cell + pad;
  const cols = colSums(W);
  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
        {title}{' '}
        <span className="sourcetag" style={{ background: ok ? '#e6f4ec' : '#fce8eb', color: ok ? 'var(--good)' : 'var(--fedavg)' }}>
          {ok ? 'doubly stochastic ✓' : 'not doubly stochastic ✗'}
        </span>
      </div>
      <svg viewBox={`0 0 ${size + 60} ${size + 30}`} style={{ width: '100%', height: 'auto' }}>
        {W.map((row, i) =>
          row.map((v, j) => {
            const x = pad + j * cell;
            const y = pad + i * cell;
            const a = v === 0 ? 0 : 0.18 + 0.82 * Math.min(1, v);
            return (
              <g key={`${i}-${j}`}>
                <rect x={x} y={y} width={cell - 3} height={cell - 3} rx="4" fill={v === 0 ? '#eef1f5' : ok ? '#1f4e8c' : '#d1495b'} opacity={v === 0 ? 1 : a} />
                {v > 0 && (
                  <text x={x + (cell - 3) / 2} y={y + (cell - 3) / 2 + 3.5} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9.5" fill={a > 0.5 ? '#fff' : '#1a1d24'}>
                    {v === 1 ? '1' : v.toFixed(2).slice(1)}
                  </text>
                )}
              </g>
            );
          })
        )}
        {colSums(W).map((c, j) => {
          const x = pad + j * cell;
          const y = pad + N * cell + 2;
          const good = Math.abs(c - 1) < 1e-6;
          return (
            <text key={'c' + j} x={x + (cell - 3) / 2} y={y + 10} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" fill={good ? 'var(--good)' : 'var(--fedavg)'}>
              {c.toFixed(2)}
            </text>
          );
        })}
        <text x={pad - 6} y={pad + N * cell + 12} textAnchor="end" fontFamily="Inter" fontSize="10" fill="#8a93a3">
          col Σ
        </text>
      </svg>
      <p className="small muted" style={{ marginTop: 2 }}>{note}</p>
    </div>
  );
}

// Bars for the 6 client values + the running average, with the true average as a reference.
function Buckets({ vals, active, color, title, ok }) {
  const W = 330,
    H = 168;
  const top = 16,
    h = 110;
  const bw = 30,
    gap = 16;
  const left = 24;
  const scale = 72; // value -> height domain [0, scale]
  const toY = (v) => top + h - (v / scale) * h;
  const a = mean(vals);
  const delta = a - TRUE_AVG;
  return (
    <div style={{ flex: 1, minWidth: 300 }}>
      <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {/* true-average reference line */}
        <line x1={left - 6} x2={W - 6} y1={toY(TRUE_AVG)} y2={toY(TRUE_AVG)} stroke="#2e7d57" strokeWidth="1.3" strokeDasharray="5 3" />
        <text x={W - 6} y={toY(TRUE_AVG) - 4} textAnchor="end" fontFamily="Inter" fontSize="10" fill="#2e7d57">
          fair avg {TRUE_AVG}
        </text>
        {/* current-average line */}
        <line x1={left - 6} x2={W - 6} y1={toY(a)} y2={toY(a)} stroke={color} strokeWidth="1.6" />
        {/* bars + each client's home-data target (tick) */}
        {vals.map((v, i) => {
          const x = left + i * (bw + gap);
          const y = toY(v);
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={top + h - y} rx="3" fill={color} opacity={active[i] ? 0.95 : 0.32} />
              {/* home target this client trains toward */}
              <line x1={x - 1} x2={x + bw + 1} y1={toY(HOME[i])} y2={toY(HOME[i])} stroke="#384150" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
              <text x={x + bw / 2} y={top + h + 13} textAnchor="middle" fontFamily="Inter" fontSize="9.5" fill="#8a93a3">
                c{i + 1}
              </text>
              <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#4a5160">
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily: 'Inter', marginTop: 2 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>running average = </span>
        <span style={{ fontSize: 22, fontWeight: 700, color }}>{a.toFixed(1)}</span>{' '}
        <span className="sourcetag" style={{ background: ok ? '#e6f4ec' : '#fce8eb', color: ok ? 'var(--good)' : 'var(--fedavg)' }}>
          {Math.abs(delta) < 0.4 ? 'on fair value ✓' : `biased ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} ✗`}
        </span>
      </div>
    </div>
  );
}

export default function Mechanism() {
  const [active, setActive] = useState([true, true, false, true, false, true]);
  const [faVals, setFaVals] = useState(INIT.slice());
  const [fpVals, setFpVals] = useState(INIT.slice());
  const [steps, setSteps] = useState(0);
  const [auto, setAuto] = useState(false);
  const timer = useRef(0);

  const toggle = (i) => setActive((a) => a.map((v, j) => (j === i ? !v : v)));
  const k = active.filter(Boolean).length;

  function mixOnce(act) {
    // each round: a little local training (pull toward own data), then communicate
    setFaVals((v) => mixFedAvg(localStep(v), act));
    setFpVals((v) => mixPBC(localStep(v), act));
    setSteps((s) => s + 1);
  }
  function randomRound() {
    let act = RATES.map((r) => Math.random() < r); // non-uniform participation
    if (!act.some(Boolean)) act[Math.floor(Math.random() * N)] = true; // ensure >=1 active
    setActive(act);
    mixOnce(act);
  }
  function resetVals() {
    setFaVals(INIT.slice());
    setFpVals(INIT.slice());
    setSteps(0);
    setAuto(false);
  }

  useEffect(() => {
    if (!auto) return;
    timer.current = setInterval(randomRound, 750);
    return () => clearInterval(timer.current);
  }, [auto]);

  return (
    <section id="mechanism">
      <div className="wrap">
        <p className="eyebrow">3 · Why it works</p>
        <h2>The trick: postpone the broadcast</h2>
        <p className="lead muted">
          FedPBC changes exactly one line of FedAvg. The server <strong>waits</strong> until the end
          of the round to broadcast the updated model — and only to the clients that were active.
        </p>
        <p>
          To see why that matters, stack every client's model into one list{' '}
          <M>{'\\mathbf{X}^t=[x_1^t,\\dots,x_m^t]'}</M>. A round is always two steps: a local
          gradient step on each entry, then a <strong>communication step that blends entries
          together</strong>. Blending a list by fixed weights <em>is</em> multiplying by a matrix:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <M display>{`\\mathbf{X}^{t+1}=\\big(\\mathbf{X}^{t}-\\eta\\,\\mathbf{G}^{t}\\big)\\,W^{(t)}`}</M>
        </div>
        <p>
          That <M>{'W^{(t)}'}</M> isn't bolted on — it's just the bookkeeping for "who averages with
          whom this round." The whole argument hinges on one property of it.
        </p>

        <div className="callout">
          A matrix that <strong>preserves the average</strong> of the client models must be{' '}
          <em>doubly stochastic</em> — every row <strong>and</strong> every column sums to 1.
          Preserve the average each round and you converge to the fair optimum. Break it, and you
          drift.
        </div>
      </div>

      <div className="wrap-wide">
        <div className="panel">
          <span className="sourcetag live">live · interactive</span>
          <p className="small muted" style={{ margin: '12px 0 6px' }}>
            Six clients. Click any client to toggle its uplink for this round. The active set{' '}
            <M>{'\\mathcal{A}^t'}</M> currently has <strong>{k}</strong> client{k === 1 ? '' : 's'}.
            Watch the two matrices — and especially their <strong>column sums</strong> — update.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '8px 0 18px' }}>
            {active.map((on, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className="ctl"
                style={{
                  background: on ? 'var(--fedpbc)' : '#fff',
                  color: on ? '#fff' : 'var(--ink-faint)',
                  borderColor: on ? 'var(--fedpbc)' : 'var(--line-strong)',
                  minWidth: 92,
                }}
              >
                client {i + 1}
                <br />
                <span style={{ fontSize: 11, opacity: 0.85 }}>{on ? 'active' : 'offline'}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Heatmap
              W={fedAvgMatrix(active)}
              title="FedAvg — effective mixing"
              ok={false}
              note="Every client is reset to the active-mean. Active columns over-sum, offline columns vanish: the average is not preserved → bias toward frequent clients."
            />
            <Heatmap
              W={pbcMatrix(active)}
              title="FedPBC — mixing W⁽ᵗ⁾ (Eq. 4)"
              ok={true}
              note="Active clients average together; offline clients keep their own model (identity row). Rows and columns both sum to 1 → the average is preserved → no bias."
            />
          </div>

          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <M display>
              {`W^{(t)}_{ij}=\\begin{cases}\\frac{1}{|\\mathcal{A}^t|}&i,j\\in\\mathcal{A}^t\\\\[2pt]1&i=j,\\ i\\notin\\mathcal{A}^t\\\\[2pt]0&\\text{otherwise}\\end{cases}`}
            </M>
          </div>
        </div>

        {/* ---- average-preservation demo ---- */}
        <div className="panel">
          <span className="sourcetag live">live · watch the average</span>
          <p className="small muted" style={{ margin: '12px 0 10px' }}>
            Each client now trains on its own data, pulling toward its private optimum (the dashed
            <strong> ticks</strong>: 10…60, so the <strong>fair average is {TRUE_AVG}</strong>). Every
            round does a little local training, then one communication step. Hit{' '}
            <strong>auto</strong> and watch the two averages over time.
          </p>

          <div className="btnrow" style={{ marginBottom: 16 }}>
            <button className="ctl" onClick={() => mixOnce(active)}>
              ▸ mix once (this active set)
            </button>
            <button className={'ctl ' + (auto ? 'play' : '')} onClick={() => setAuto((a) => !a)}>
              {auto ? '❚❚ stop' : '⟳ auto: random dropouts'}
            </button>
            <button className="ctl" onClick={resetVals}>
              reset values
            </button>
            <span className="readout" style={{ alignSelf: 'center' }}>
              rounds mixed: <b>{steps}</b>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Buckets vals={faVals} active={active} color="var(--fedavg)" title="FedAvg models" ok={Math.abs(mean(faVals) - TRUE_AVG) < 0.4} />
            <Buckets vals={fpVals} active={active} color="var(--fedpbc)" title="FedPBC models" ok={Math.abs(mean(fpVals) - TRUE_AVG) < 0.4} />
          </div>

          <p className="small muted" style={{ marginTop: 8 }}>
            In auto mode the low-value clients connect far more often than the high-value ones.{' '}
            <span className="fp">FedPBC</span>'s average stays glued to the fair {TRUE_AVG} round after
            round — the doubly-stochastic mix conserves it no matter who shows up.{' '}
            <span className="fa">FedAvg</span> rebroadcasts the online-mean to everyone, so the
            frequent low-value clients keep dragging it down: its average settles well{' '}
            <em>below</em> {TRUE_AVG} and stays there. That persistent gap <em>is</em> the bias from
            Section 2 — now you can watch it accumulate.
          </p>
        </div>
      </div>

      <div className="wrap">
        <p>
          This is the engine of the whole paper. Because <M>{'W^{(t)}'}</M> is doubly stochastic for{' '}
          <em>any</em> active set — no matter how the <M>{'p_i^t'}</M> behave — the clients' average
          is conserved every round, and repeated mixing drives them to consensus at the{' '}
          <em>fair</em> optimum. "Alternate a gradient step with a doubly-stochastic mix" is exactly
          the template of <strong>gossip / decentralized optimization</strong>, so the authors
          import its convergence machinery (their Lemmas 3–4). No knowledge of <M>{'p_i^t'}</M>{' '}
          required.
        </p>
        <p>Enough theory — let's run it and watch the two methods race.</p>
      </div>
    </section>
  );
}
