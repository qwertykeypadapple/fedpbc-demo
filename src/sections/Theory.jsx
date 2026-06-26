import { useState } from 'react';
import { M } from '../components/MathTeX.jsx';

export default function Theory() {
  const [c, setC] = useState(0.3);
  const staleness = 1 / c; // Prop. 2: E[t - tau_i(t)] <= 1/c

  return (
    <section id="theory">
      <div className="wrap">
        <p className="eyebrow">6 · The guarantee</p>
        <h2>What's actually proven</h2>
        <p className="lead muted">
          The headline isn't just "it works in experiments." FedPBC comes with a convergence
          guarantee for <em>non-convex</em> objectives — with none of the usual escape hatches.
        </p>

        <h3>Main result (Theorem 1)</h3>
        <p>
          Under standard smoothness, bounded-variance, and bounded-heterogeneity assumptions, the
          server model's averaged gradient norm vanishes at the optimal first-order rate:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <M display>
            {`\\frac{1}{T}\\sum_{t=0}^{T-1}\\mathbb{E}\\big[\\lVert\\nabla F(\\bar{x}^t)\\rVert^2\\big]\\;\\le\\;\\frac{6\\,(F(\\bar{x}^0)-F^\\star)}{\\eta s T}+54\\,\\eta s L\\Big(\\kappa^2L^2+1+\\tfrac{1}{1-\\sqrt{\\rho}}\\Big)(\\sigma^2+\\zeta^2)`}
          </M>
        </div>
        <p>
          With <M>{'\\eta=1/\\sqrt{T}'}</M> this is <M>{'O(1/\\sqrt{T})'}</M> — matching the best
          possible rate for first-order methods on smooth non-convex problems. Three things make
          this notable:
        </p>
        <ul className="muted">
          <li>
            No <strong>"balancedness"</strong> assumption on the <M>{'p_i^t'}</M> — they can be
            arbitrary and unknown.
          </li>
          <li>
            No requirement that gradients or their noise be <strong>bounded</strong>.
          </li>
          <li>
            By contrast, FedAvg (Proposition 1) provably converges to a point that can be{' '}
            <em>arbitrarily far</em> from the optimum.
          </li>
        </ul>
      </div>

      <div className="wrap-wide">
        <div className="panel">
          <span className="sourcetag live">interactive</span>
          <h3 style={{ marginTop: 8 }}>The one quantity that controls everything: the floor <M>{'c'}</M></h3>
          <p className="small muted">
            The only assumption on connectivity is a lower bound: <M>{'p_i^t \\ge c'}</M> for some
            constant <M>{'c\\in(0,1)'}</M>. Intuitively, no client is allowed to disappear forever.
            A larger <M>{'c'}</M> means clients reappear sooner, which tightens the bound on{' '}
            <strong>staleness</strong> (Proposition 2):
          </p>
          <div style={{ overflowX: 'auto' }}>
            <M display>{`\\mathbb{E}\\big[t-\\tau_i(t)\\big]\\le \\frac{1}{c}`}</M>
          </div>

          <div className="control" style={{ maxWidth: 460, marginTop: 8 }}>
            <label>
              <span>connectivity floor <M>{'c'}</M></span>
              <span className="val">{c.toFixed(2)}</span>
            </label>
            <input type="range" min="0.05" max="0.95" step="0.01" value={c} onChange={(e) => setC(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 8 }}>
            <Stat label="Expected staleness ≤" value={staleness.toFixed(1) + ' rounds'} hint="how long, on average, before a client's link is active again" />
            <Stat label="Mixing rate ρ ≤" value={(1 - (c * c) / 8).toFixed(3)} hint="smaller ρ ⇒ faster consensus ⇒ tighter bound (special uniform case ρ ≤ 1 − c²/8)" />
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>
            As <M>{'c\\to 0'}</M> the staleness bound blows up and the spectral gap closes — exactly
            why a client that never connects can never be corrected. The remarkable part is that{' '}
            <em>any</em> positive floor is enough for convergence.
          </p>
        </div>
      </div>

      <div className="wrap">
        <h3>The one-line takeaway</h3>
        <p>
          When clients connect at different, unpredictable rates, <span className="fa">FedAvg</span>{' '}
          quietly optimizes the wrong objective. <span className="fp">FedPBC</span> fixes it by
          postponing the broadcast — turning unreliable participation into doubly-stochastic gossip
          — and converges to a true stationary point with no knowledge of the connection dynamics
          at all.
        </p>
        <p className="muted small">
          For the full assumptions, lemmas, and proofs, see{' '}
          <a href="https://arxiv.org/abs/2404.10091" target="_blank" rel="noreferrer">
            the paper (arXiv:2404.10091)
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Source Serif 4', fontSize: 30, fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
      <div className="small muted">{hint}</div>
    </div>
  );
}
