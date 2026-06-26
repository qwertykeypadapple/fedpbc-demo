const ARXIV = 'https://arxiv.org/abs/2404.10091';

export function Masthead() {
  return (
    <header className="masthead">
      <div className="wrap">
        <a
          className="walkthrough-badge"
          href="https://federation-quest.onrender.com/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="wb-eyebrow">▶ Prefer to play?</span>
          <span className="wb-text">Understand this by an interactive walkthrough</span>
          <span className="wb-arrow">Launch the quest →</span>
        </a>
        <p className="eyebrow">Interactive companion · Federated Learning</p>
        <h1>Why a one-line change beats FedAvg when connections are unreliable</h1>
        <p className="lead muted">
          A live, in-browser walkthrough of <em>Empowering Federated Learning with Implicit
          Gossiping</em> — how <span className="fp">FedPBC</span> removes the bias that{' '}
          <span className="fa">FedAvg</span> silently accumulates when clients drop in and out at
          different rates.
        </p>
        <p className="byline">
          Ming Xiang · Stratis Ioannidis · Edmund Yeh · Carlee Joe-Wong · Lili Su · (2024)
        </p>
        <p className="venue">Northeastern University &amp; Carnegie Mellon University · arXiv:2404.10091</p>
        <div className="paperlinks">
          <a className="pill primary" href={ARXIV} target="_blank" rel="noreferrer">
            Read the paper ↗
          </a>
          <a className="pill" href={ARXIV.replace('/abs/', '/pdf/')} target="_blank" rel="noreferrer">
            PDF ↗
          </a>
          <a className="pill" href="#bias">
            Jump to the demo ↓
          </a>
        </div>
        <p className="disclaimer">
          This site is an independent explainer. Interactive figures marked{' '}
          <span className="sourcetag live">live</span> run the paper's quadratic experiment in your
          browser; those marked <span className="sourcetag cited">from paper</span> reproduce
          reported numbers. All credit for the method and results belongs to the authors.
        </p>
      </div>
    </header>
  );
}

const TOC_ITEMS = [
  ['scenario', '1 · The setting'],
  ['bias', '2 · The bias'],
  ['mechanism', '3 · Why it works'],
  ['race', '4 · The race'],
  ['results', '5 · Real datasets'],
  ['theory', '6 · The guarantee'],
];

export function TOC() {
  return (
    <nav className="toc">
      <div className="wrap-wide">
        {TOC_ITEMS.map(([id, label]) => (
          <a key={id} href={'#' + id}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <p>
          Built as an interactive explainer of{' '}
          <a href={ARXIV} target="_blank" rel="noreferrer">
            Xiang, Ioannidis, Yeh, Joe-Wong &amp; Su (2024), arXiv:2404.10091
          </a>
          . The quadratic case study is simulated live; the real-dataset table reproduces the
          paper's reported accuracies. Notation and figures follow the original paper.
        </p>
        <p className="faint">
          Not affiliated with the authors. FedPBC = Federated Postponed Broadcast · FedAvg =
          Federated Averaging.
        </p>
      </div>
    </footer>
  );
}
