import { useEffect, useRef, useState } from 'react';
import { M } from '../components/MathTeX.jsx';

// Animated motivation: moving clients (vehicles) with flickering uplinks to a
// base station — the paper's Fig. 1 scenario.
const CLIENTS = [
  { id: 1, y: 150, speed: 0.7, p: 0.85, color: '#1f4e8c' },
  { id: 2, y: 150, speed: 0.45, p: 0.4, color: '#d1495b' },
  { id: 3, y: 198, speed: 0.95, p: 0.6, color: '#2e7d57' },
  { id: 4, y: 198, speed: 0.6, p: 0.25, color: '#c98a00' },
];
const W = 860;
const TOWER_X = W / 2;
const TOWER_Y = 96;

export default function Scenario() {
  const [, force] = useState(0);
  const state = useRef(
    CLIENTS.map((c, i) => ({ x: (i * 220) % W, active: true, flick: 0 }))
  );
  const raf = useRef(0);

  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(48, now - last);
      last = now;
      state.current.forEach((s, i) => {
        s.x += CLIENTS[i].speed * dt * 0.12;
        if (s.x > W + 40) s.x = -40;
        s.flick -= dt;
        if (s.flick <= 0) {
          s.flick = 420 + Math.random() * 420;
          s.active = Math.random() < CLIENTS[i].p; // uplink on w.p. p_i
        }
      });
      force((n) => n + 1);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <section id="scenario">
      <div className="wrap">
        <p className="eyebrow">1 · The setting</p>
        <h2>Clients that come and go</h2>
        <p className="lead muted">
          In <strong>federated learning</strong>, a central <em>parameter server</em> trains a
          shared model with help from many clients — phones, sensors, vehicles — that never reveal
          their raw data. They only send model <em>updates</em>.
        </p>
        <p>
          The catch: clients live in the real world. A car passing a base station, a phone entering
          a tunnel — uplinks flicker on and off. The paper models this directly: in round{' '}
          <M>{'t'}</M>, client <M>{'i'}</M>'s uplink is active with probability <M>{'p_i^t'}</M>,
          which is <strong>unknown</strong>, <strong>time-varying</strong>, and{' '}
          <strong>arbitrary</strong> — and crucially, different clients connect at different rates.
        </p>
      </div>

      <div className="wrap-wide">
        <div className="panel" style={{ padding: 12 }}>
          <svg viewBox={`0 0 ${W} 280`} className="scene" style={{ background: 'linear-gradient(180deg,#eef4fb,#f7faff)' }}>
            {/* ground */}
            <rect x="0" y="232" width={W} height="48" fill="#eef1f5" />
            <line x1="0" y1="232" x2={W} y2="232" stroke="#d8dee7" />
            {/* roads */}
            <line x1="0" y1="168" x2={W} y2="168" stroke="#c7cfda" strokeWidth="1" strokeDasharray="14 12" />
            <line x1="0" y1="216" x2={W} y2="216" stroke="#c7cfda" strokeWidth="1" strokeDasharray="14 12" />

            {/* base station */}
            <g>
              <line x1={TOWER_X} y1={TOWER_Y} x2={TOWER_X - 16} y2={TOWER_Y + 78} stroke="#7c8696" strokeWidth="3" />
              <line x1={TOWER_X} y1={TOWER_Y} x2={TOWER_X + 16} y2={TOWER_Y + 78} stroke="#7c8696" strokeWidth="3" />
              <line x1={TOWER_X - 8} y1={TOWER_Y + 39} x2={TOWER_X + 8} y2={TOWER_Y + 39} stroke="#7c8696" strokeWidth="2" />
              <circle cx={TOWER_X} cy={TOWER_Y - 4} r="6" fill="#1f4e8c" />
              {[16, 26, 36].map((r, i) => (
                <path
                  key={i}
                  d={`M ${TOWER_X - r} ${TOWER_Y - 4} A ${r} ${r} 0 0 1 ${TOWER_X + r} ${TOWER_Y - 4}`}
                  fill="none"
                  stroke="#1f4e8c"
                  strokeWidth="1.5"
                  opacity={0.5 - i * 0.13}
                />
              ))}
              <text x={TOWER_X} y={TOWER_Y + 96} textAnchor="middle" fontFamily="Inter" fontSize="12.5" fontWeight="700" fill="#4a5160">
                Parameter Server
              </text>
            </g>

            {/* clients */}
            {CLIENTS.map((c, i) => {
              const s = state.current[i];
              const cx = s.x;
              const cy = c.y;
              return (
                <g key={c.id}>
                  {/* uplink */}
                  <line
                    x1={cx}
                    y1={cy - 12}
                    x2={TOWER_X}
                    y2={TOWER_Y}
                    stroke={c.color}
                    strokeWidth={s.active ? 1.6 : 1}
                    strokeDasharray="3 5"
                    opacity={s.active ? 0.55 : 0.0}
                  />
                  {/* vehicle */}
                  <g transform={`translate(${cx},${cy})`}>
                    <rect x="-20" y="-13" width="40" height="20" rx="5" fill={c.color} opacity="0.92" />
                    <rect x="-12" y="-11" width="24" height="9" rx="2" fill="#fff" opacity="0.55" />
                    <circle cx="-11" cy="9" r="4" fill="#384150" />
                    <circle cx="11" cy="9" r="4" fill="#384150" />
                    {/* signal bars */}
                    {[0, 1, 2].map((b) => (
                      <rect
                        key={b}
                        x={-6 + b * 5}
                        y={-26 - b * 3}
                        width="3.4"
                        height={5 + b * 3}
                        rx="1"
                        fill={s.active ? c.color : '#c7cfda'}
                        opacity={s.active ? 1 : 0.7}
                      />
                    ))}
                  </g>
                  <text x={cx} y={cy + 24} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10.5" fill="#8a93a3">
                    p={c.p}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="small muted" style={{ margin: '8px 4px 2px' }}>
            Four clients with different connection rates <M>{'p_i'}</M>. A dashed line shows an{' '}
            <em>active</em> uplink this round. Notice some clients (high <M>{'p_i'}</M>) are heard
            from far more often than others — that imbalance is the whole problem.
          </p>
        </div>
      </div>

      <div className="wrap">
        <p style={{ marginTop: 28 }}>
          You might guess this just slows training down. It does something worse:{' '}
          <strong>it quietly biases the answer.</strong> The model still trains, the loss still
          drops — but it converges to the <em>wrong</em> place, tilted toward whoever happened to
          connect most. Let's make that visible.
        </p>
      </div>
    </section>
  );
}
