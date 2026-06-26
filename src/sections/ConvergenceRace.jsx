import { useEffect, useRef, useState } from 'react';
import { M } from '../components/MathTeX.jsx';
import { LinePlot } from '../components/LinePlot.jsx';
import { FLSim, makeRaceConfig } from '../lib/sim.js';

const MAX_ROUNDS = 2500;
const STEPS_PER_FRAME = 10;

export default function ConvergenceRace() {
  const [p0, setP0] = useState(0.3);
  const [p1, setP1] = useState(0.8);
  const [pattern, setPattern] = useState('bernoulli');
  const [timeVarying, setTimeVarying] = useState(false);
  const [running, setRunning] = useState(false);
  const [seed, setSeed] = useState(1);
  const [, force] = useState(0);

  const sim = useRef(null);
  const hist = useRef({ fa: [], fp: [] });
  const raf = useRef(0);
  const round = useRef(0);

  // (re)build the simulator whenever the configuration changes
  function build() {
    const cfg = makeRaceConfig({ p0, p1, pattern, timeVarying, seed });
    sim.current = new FLSim(cfg);
    hist.current = { fa: [], fp: [] };
    round.current = 0;
    setRunning(false);
    force((n) => n + 1);
  }
  useEffect(build, [p0, p1, pattern, timeVarying, seed]);

  function pump(n) {
    const s = sim.current;
    if (!s) return;
    for (let k = 0; k < n && round.current < MAX_ROUNDS; k++) {
      const r = s.step();
      hist.current.fa.push({ x: r.t, y: r.errFedAvg });
      hist.current.fp.push({ x: r.t, y: r.errPBC });
      round.current = r.t;
    }
    force((n2) => n2 + 1);
  }

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (round.current >= MAX_ROUNDS) {
        setRunning(false);
        return;
      }
      pump(STEPS_PER_FRAME);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [running]);

  // downsample for a light SVG path
  const ds = (arr) => {
    const step = Math.max(1, Math.floor(arr.length / 650));
    const out = [];
    for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
    if (arr.length) out.push(arr[arr.length - 1]);
    return out;
  };

  const fa = hist.current.fa;
  const fp = hist.current.fp;
  const lastFa = fa.length ? fa[fa.length - 1].y : null;
  const lastFp = fp.length ? fp[fp.length - 1].y : null;
  const gap = lastFa && lastFp ? lastFa / lastFp : null;

  const done = round.current >= MAX_ROUNDS;

  return (
    <section id="race">
      <div className="wrap">
        <p className="eyebrow">4 · The race</p>
        <h2>Watch them converge, live</h2>
        <p className="lead muted">
          This is the paper's quadratic experiment (Fig.&nbsp;3), running in your browser:{' '}
          <M>{'m=100'}</M> clients, the first 50 connecting with rate <M>{'p_0'}</M>, the rest with{' '}
          <M>{'p_1'}</M>. The plot tracks distance to the true optimum,{' '}
          <M>{'\\lVert x_{\\mathrm{PS}}-x^\\star\\rVert'}</M>, on a log scale.
        </p>
        <p>
          Set the rates equal and the two methods tie. Make them <em>unequal</em> and press play:{' '}
          <span className="fa">FedAvg</span> stalls at a bias floor while <span className="fp">FedPBC</span>{' '}
          keeps descending — the implicit gossip grinds the bias away.
        </p>
      </div>

      <div className="wrap-wide">
        <div className="panel">
          <span className="sourcetag live">live · simulated in-browser</span>
          <div className="panel-grid" style={{ marginTop: 14 }}>
            <div>
              <div className="legend">
                <span className="key">
                  <span className="swatch" style={{ background: 'var(--fedavg)' }} /> FedAvg
                </span>
                <span className="key">
                  <span className="swatch" style={{ background: 'var(--fedpbc)' }} /> FedPBC (ours)
                </span>
                <span className="key faint">round {round.current} / {MAX_ROUNDS}</span>
              </div>
              <LinePlot
                width={680}
                height={360}
                xLabel="global round  t"
                yLabel="‖ x_PS − x★ ‖   (log)"
                xMax={MAX_ROUNDS}
                yLog
                yMin={1e-4}
                yMax={1}
                series={[
                  { data: ds(fa), color: 'var(--fedavg)', width: 1.6 },
                  { data: ds(fp), color: 'var(--fedpbc)', width: 1.6 },
                ]}
              />
            </div>

            <div className="controls">
              <div className="btnrow">
                <button className="ctl play" onClick={() => (done ? build() : setRunning((r) => !r))}>
                  {done ? '↺ replay' : running ? '❚❚ pause' : '▶ play'}
                </button>
                <button className="ctl" onClick={() => pump(50)} disabled={running || done}>
                  +50 rounds
                </button>
                <button className="ctl" onClick={build}>
                  reset
                </button>
                <button className="ctl" onClick={() => setSeed((s) => s + 1)}>
                  new seed
                </button>
              </div>

              <div className="control">
                <label>
                  <span>
                    <M>{'p_0'}</M> — rate of clients 1–50
                  </span>
                  <span className="val">{p0.toFixed(2)}</span>
                </label>
                <input type="range" min="0.05" max="1" step="0.05" value={p0} onChange={(e) => setP0(+e.target.value)} />
              </div>
              <div className="control">
                <label>
                  <span>
                    <M>{'p_1'}</M> — rate of clients 51–100
                  </span>
                  <span className="val">{p1.toFixed(2)}</span>
                </label>
                <input type="range" min="0.05" max="1" step="0.05" value={p1} onChange={(e) => setP1(+e.target.value)} />
              </div>

              <div className="control">
                <label><span>Unreliable pattern</span></label>
                <div className="seg">
                  {['bernoulli', 'markov', 'cyclic'].map((pt) => (
                    <button key={pt} className={pattern === pt ? 'active' : ''} onClick={() => setPattern(pt)}>
                      {pt === 'bernoulli' ? 'Bernoulli' : pt === 'markov' ? 'Markovian' : 'Cyclic'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control">
                <label><span>Dynamics</span></label>
                <div className="seg">
                  <button className={!timeVarying ? 'active' : ''} onClick={() => setTimeVarying(false)}>
                    time-invariant
                  </button>
                  <button className={timeVarying ? 'active' : ''} onClick={() => setTimeVarying(true)}>
                    time-varying
                  </button>
                </div>
              </div>

              <div className="btnrow">
                <button className="ctl" onClick={() => { setP0(0.3); setP1(0.3); setPattern('bernoulli'); setTimeVarying(false); }}>
                  Fig. 3 (equal)
                </button>
                <button className="ctl active" onClick={() => { setP0(0.3); setP1(0.8); setPattern('bernoulli'); setTimeVarying(false); }}>
                  Fig. 3 (unequal)
                </button>
              </div>

              <div className="readout">
                <div style={{ color: 'var(--fedavg)' }}>
                  FedAvg error &nbsp;=&nbsp; <b>{lastFa ? lastFa.toExponential(2) : '—'}</b>
                </div>
                <div style={{ color: 'var(--fedpbc)' }}>
                  FedPBC error &nbsp;=&nbsp; <b>{lastFp ? lastFp.toExponential(2) : '—'}</b>
                </div>
                <div className="muted">
                  gap &nbsp;=&nbsp; <b>{gap ? gap.toFixed(1) + '×' : '—'}</b>{' '}
                  {gap && gap > 2 ? '(FedPBC closer to optimum)' : ''}
                </div>
              </div>
            </div>
          </div>

          <p className="small muted" style={{ marginTop: 6 }}>
            Neither curve reaches exactly zero — the random active set keeps jittering the model, as
            the authors note. The point is the <em>floor</em>: FedAvg plateaus far above optimum;
            FedPBC settles one to two orders of magnitude lower.
          </p>
        </div>
      </div>
    </section>
  );
}
