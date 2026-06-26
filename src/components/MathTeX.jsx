import katex from 'katex';

// Inline / display math rendered with KaTeX.
export function M({ children, display = false }) {
  const html = katex.renderToString(String(children), {
    displayMode: display,
    throwOnError: false,
    output: 'html',
  });
  return (
    <span
      className={display ? 'katex-display-wrap' : 'katex-inline-wrap'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
