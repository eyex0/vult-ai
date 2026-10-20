import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe Markdown renderer for notes and assistant replies.
 * Supports headings (#–###), paragraphs, bullet/numbered lists, blockquotes,
 * **bold**, _italic_ / *italic*, `code` and [links](https://…). Output is React elements — no HTML injection.
 */
function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(_([^_]+)_)|(\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[2]) out.push(<strong key={k}>{inline(m[2], i)}</strong>);
    else if (m[4]) {
      const href = /^(https?:|mailto:|\/)/.test(m[5]!) ? m[5] : "#";
      out.push(
        <a key={k} href={href} target={href!.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {m[4]}
        </a>,
      );
    } else if (m[7]) out.push(<code key={k} className="rounded bg-white/10 px-1 py-px text-[0.9em]">{m[7]}</code>);
    else if (m[9] || m[11]) out.push(<em key={k}>{m[9] ?? m[11]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  const lines = children.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1]!.length;
      const Tag = (`h${level + 1}`) as "h2" | "h3" | "h4";
      blocks.push(<Tag key={i}>{inline(h[2]!, i)}</Tag>);
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]!)) items.push(lines[i++]!.replace(/^\s*[-*]\s+/, ""));
      blocks.push(
        <ul key={i}>
          {items.map((t, j) => (
            <li key={j}>{inline(t, j)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i]!)) items.push(lines[i++]!.replace(/^\s*\d+\.\s+/, ""));
      blocks.push(
        <ol key={i}>
          {items.map((t, j) => (
            <li key={j}>{inline(t, j)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i]!)) quote.push(lines[i++]!.replace(/^>\s?/, ""));
      blocks.push(<blockquote key={i}>{inline(quote.join(" "), i)}</blockquote>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !/^(#{1,3}\s|\s*[-*]\s|\s*\d+\.\s|>)/.test(lines[i]!)) para.push(lines[i++]!);
    blocks.push(
      <p key={i}>
        {para.map((p, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {inline(p, j)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return <div className={className}>{blocks}</div>;
}
