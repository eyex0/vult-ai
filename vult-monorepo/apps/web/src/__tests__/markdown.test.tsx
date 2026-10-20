import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/lib/markdown";

const html = (md: string) => renderToStaticMarkup(<Markdown>{md}</Markdown>);

describe("Markdown", () => {
  it("renders headings, lists, emphasis and links", () => {
    const out = html("## Title\n- **bold** item\n- _it_\n\n1. one\n2. two\n\n> quote\n\nSee [docs](https://vult.example).");
    expect(out).toContain("<h3>Title</h3>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>it</em>");
    expect(out).toContain("<ol><li>one</li><li>two</li></ol>");
    expect(out).toContain("<blockquote>quote</blockquote>");
    expect(out).toContain('href="https://vult.example"');
  });

  it("escapes HTML and neutralises unsafe links", () => {
    const out = html('<img src=x onerror=alert(1)> [x](javascript:alert(1))');
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
    expect(out).toContain('href="#"');
  });
});
