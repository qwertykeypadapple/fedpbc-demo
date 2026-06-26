// =============================================================================
// Simulation engine for "Empowering Federated Learning with Implicit Gossiping"
// (Xiang, Ioannidis, Yeh, Joe-Wong, Su, 2024 — arXiv:2404.10091)
//
// We reproduce the quadratic case study (Sec. 4 & Sec. 7.1) live in the browser.
// Local objective:  F_i(x) = 1/2 ||x - u_i||^2,  global optimum x* = mean_i(u_i).
//
// Faithfulness note: with exact local gradients the per-round FedAvg map is
//   x <- a*x + (1-a)*mean_{i in A^t}(u_i),   a = (1-eta)^s,
// whose stationary point is independent of a and equals the paper's closed
// form Eq. (3). For 2 clients it collapses to 150*p2/(1+p2) (Fig. 2 caption).
// =============================================================================

// ---- Seeded RNG (mulberry32) ----------------------------------------------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  let u = 0,
    v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---- Closed forms for the 2-client counterexample (Sec. 4 / Eq. 3) ---------
// FedAvg's biased expected output for two clients with optima u1,u2 and
// time-invariant activity probabilities p1,p2.
export function fedAvgTwoClient(u1, u2, p1, p2) {
  const num =
    p1 * (1 - p2) * u1 +
    (1 - p1) * p2 * u2 +
    p1 * p2 * ((u1 + u2) / 2);
  const den = p1 + p2 - p1 * p2; // = 1 - (1-p1)(1-p2)
  if (den === 0) return (u1 + u2) / 2; // both never connect: undefined; show fair value
  return num / den;
}

// FedPBC recovers the true (unweighted) optimum regardless of p1,p2.
export function fedPbcTwoClient(u1, u2) {
  return (u1 + u2) / 2;
}

// ---- Unreliable activity patterns ------------------------------------------
// Effective per-round activity probability for client i at round t.
export function effectiveProb(p, t, { timeVarying, gamma, period, floor }) {
  if (!timeVarying) return p;
  const eps = Math.sin((2 * Math.PI * t) / period); // sine-modulated, Eq. (9)
  let pt = p * (1 - gamma + gamma * eps);
  return Math.max(floor, Math.min(1, pt));
}

// ---- Main simulator --------------------------------------------------------
export class FLSim {
  constructor(cfg) {
    this.cfg = cfg;
    this.reset(cfg.seed ?? 1);
  }

  reset(seed) {
    const { m, u } = this.cfg;
    this.rng = mulberry32(seed >>> 0);
    this.t = 0;
    this.u = u;
    this.xStar = u.reduce((s, v) => s + v, 0) / m;
    // FedAvg: single global model, broadcast to all at the start of each round.
    this.xFedAvg = this.cfg.x0 ?? 0;
    // FedPBC: per-client local copies; only active clients are synced at round end.
    this.xPBC = this.cfg.x0 ?? 0;
    this.xLocal = new Array(m).fill(this.cfg.x0 ?? 0);
    // Markov chain state per client (ON/OFF), seeded by a Bernoulli draw.
    this.markovOn = u.map((_, i) => this.rng() < this.cfg.probs[i]);
    this.lastActive = u.map(() => false);
  }

  // Determine which clients have an active uplink in round t.
  activeSet(t) {
    const { m, probs, pattern, markovStickiness } = this.cfg;
    const active = new Array(m);
    for (let i = 0; i < m; i++) {
      const p = effectiveProb(probs[i], t, this.cfg);
      if (pattern === 'bernoulli') {
        active[i] = this.rng() < p;
      } else if (pattern === 'markov') {
        // 2-state chain whose stationary ON-probability is p.
        const stay = markovStickiness ?? 0.7; // P(stay ON)
        const pOff2On = (1 - stay) * (p / Math.max(1e-6, 1 - p));
        if (this.markovOn[i]) {
          this.markovOn[i] = this.rng() < stay;
        } else {
          this.markovOn[i] = this.rng() < Math.min(1, pOff2On);
        }
        active[i] = this.markovOn[i];
      } else {
        // cyclic: contiguous active window of length p*period, staggered by i.
        const period = this.cfg.period ?? 40;
        const offset = (i / m) * period;
        const phase = (((t - offset) % period) + period) % period;
        active[i] = phase < p * period;
      }
    }
    return active;
  }

  step() {
    const { m, s, eta, sigma } = this.cfg;
    const t = this.t;
    const active = this.activeSet(t);
    const a = Math.pow(1 - eta, s); // contraction of s exact local steps

    // ---- FedAvg: every client starts the round from the global model -------
    {
      let sum = 0,
        cnt = 0;
      for (let i = 0; i < m; i++) {
        if (!active[i]) continue;
        const z = this.xFedAvg; // broadcast at the START of the round
        let report = a * z + (1 - a) * this.u[i];
        if (sigma) report += sigma * gaussian(this.rng);
        sum += report;
        cnt++;
      }
      if (cnt > 0) this.xFedAvg = sum / cnt; // else hold (uplink-free round)
    }

    // ---- FedPBC: postponed broadcast --------------------------------------
    // Every client keeps computing locally from its own model (Sec. 7.2),
    // then the server averages ONLY the active reports and re-syncs ONLY the
    // active clients. Inactive clients keep their locally-evolved model. This
    // is exactly the doubly-stochastic mixing W^(t) of Eq. (4): active clients
    // form an averaging clique, inactive rows are the identity.
    {
      const temp = new Array(m);
      for (let i = 0; i < m; i++) {
        let r = a * this.xLocal[i] + (1 - a) * this.u[i]; // s local steps
        if (sigma) r += sigma * gaussian(this.rng);
        temp[i] = r;
      }
      let sum = 0,
        cnt = 0;
      for (let i = 0; i < m; i++) {
        if (!active[i]) continue;
        sum += temp[i];
        cnt++;
      }
      if (cnt > 0) {
        const avg = sum / cnt; // implicit gossip among active clients
        for (let i = 0; i < m; i++) this.xLocal[i] = active[i] ? avg : temp[i];
        this.xPBC = avg; // PS model x^{t+1}
      } else {
        for (let i = 0; i < m; i++) this.xLocal[i] = temp[i]; // hold PS, keep computing
      }
    }

    this.lastActive = active;
    this.t++;
    return {
      t: this.t,
      errFedAvg: Math.abs(this.xFedAvg - this.xStar),
      errPBC: Math.abs(this.xPBC - this.xStar),
      xFedAvg: this.xFedAvg,
      xPBC: this.xPBC,
      active,
    };
  }
}

// Build the standard Fig. 3 setup: m clients, first half at p0, second at p1,
// optima spread linearly so that non-uniform activity induces a real bias.
export function makeRaceConfig({
  m = 100,
  p0 = 0.3,
  p1 = 0.8,
  s = 5,
  eta = 0.005,
  sigma = 0,
  pattern = 'bernoulli',
  timeVarying = false,
  gamma = 0.5,
  period = 40,
  floor = 0.02,
  markovStickiness = 0.7,
  seed = 1,
} = {}) {
  const probs = new Array(m);
  const u = new Array(m);
  for (let i = 0; i < m; i++) {
    probs[i] = i < m / 2 ? p0 : p1;
    u[i] = (i + 1) / 1000; // u_i in (0, 0.1], x* = mean
  }
  return {
    m,
    probs,
    u,
    s,
    eta,
    sigma,
    pattern,
    timeVarying,
    gamma,
    period,
    floor,
    markovStickiness,
    seed,
    x0: 0,
  };
}
