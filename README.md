# Implicit Gossiping in Federated Learning — an interactive explainer

A live, in-browser walkthrough of **“Empowering Federated Learning with Implicit Gossiping:
Mitigating Connection Unreliability Amidst Unknown and Arbitrary Dynamics”**
(Xiang, Ioannidis, Yeh, Joe-Wong & Su, 2024 — [arXiv:2404.10091](https://arxiv.org/abs/2404.10091)).

It shows how **FedPBC** (Federated Postponed Broadcast) removes the bias that **FedAvg** silently
accumulates when clients connect at different, unreliable rates — building the intuition from a
two-client counterexample all the way to the convergence guarantee.

> This is an independent explainer. All credit for the method and results belongs to the authors.

## What's inside

Six scrollytelling sections:

1. **The setting** — animated clients (vehicles) with flickering uplinks to a base station.
2. **The bias** — interactive two-client counterexample reproducing the paper's Fig. 2 / Eq. (3)
   *exactly* (the closed form collapses to `150·p₂/(1+p₂)`).
3. **Why it works** — the doubly-stochastic mixing matrix `W⁽ᵗ⁾`, with a live "watch the average"
   demo that shows FedPBC conserving the fair average while FedAvg drifts.
4. **The race** — the quadratic experiment (Fig. 3) **simulated live in your browser**: FedAvg
   plateaus at a bias floor while FedPBC keeps descending.
5. **Real datasets** — an explorer over the paper's Table 1 results (SVHN / CIFAR-10 / CINIC-10).
6. **The guarantee** — Theorem 1 and the role of the connectivity floor `c`.

Interactive figures marked **live** run the paper's quadratic experiment in the browser; those
marked **from paper** reproduce reported numbers.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Build a static bundle:

```bash
npm run build    # outputs to dist/
npm run preview
```

## Tech

Vite + React, [KaTeX](https://katex.org/) for math, hand-rolled SVG for all plots and diagrams.
The federated-learning simulation engine lives in [`src/lib/sim.js`](src/lib/sim.js).

## Citation

```bibtex
@article{xiang2024implicitgossiping,
  title   = {Empowering Federated Learning with Implicit Gossiping:
             Mitigating Connection Unreliability Amidst Unknown and Arbitrary Dynamics},
  author  = {Xiang, Ming and Ioannidis, Stratis and Yeh, Edmund and
             Joe-Wong, Carlee and Su, Lili},
  journal = {arXiv preprint arXiv:2404.10091},
  year    = {2024}
}
```
