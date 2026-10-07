/* The page as code: the HTML the preview is showing, read from the preview
   itself so the two can never disagree, wrapped in the document it is
   published as (title, description, design tokens, tracking pixel). */
import { useMemo } from "react";

const VOID = new Set(["img", "input", "br", "hr", "meta", "link"]);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/* Indents markup one tag per line; an element holding only text stays on one. */
function indent(html, depth) {
  const tokens = html.match(/<[^>]+>|[^<]+/g) || [];
  const pad = (n) => "  ".repeat(n);
  const lines = [];
  let d = depth;
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (!t.startsWith("<")) {
      if (t.trim()) lines.push(pad(d) + t.trim());
    } else if (t.startsWith("</")) {
      d -= 1;
      lines.push(pad(d) + t);
    } else {
      const name = t.match(/^<([\w-]+)/)?.[1];
      const closed = VOID.has(name) || t.endsWith("/>");
      const next = tokens[i + 1];
      const after = tokens[i + 2];
      if (!closed && next === `</${name}>`) {
        lines.push(pad(d) + t + next);
        i += 1;
      } else if (!closed && next && !next.startsWith("<") && after === `</${name}>`) {
        lines.push(pad(d) + t + next.trim() + after);
        i += 2;
      } else {
        lines.push(pad(d) + t);
        if (!closed) d += 1;
      }
    }
  }
  return lines.join("\n");
}

/* The published document for the sections found under `root`. */
export function documentFor(root, { title, description, vars, pixel, slug, noindex, gtm }) {
  const sections = [...root.querySelectorAll("[data-key]")]
    .map((el) => el.firstElementChild?.outerHTML || "")
    .map((h) => h.replace(/ data-(piece|picked)="[^"]*"/g, "").replace(/ style=""/g, ""))
    .map((h) => indent(h, 2));
  const tokens = Object.entries(vars).map(([k, v]) => `        ${k}: ${v};`).join("\n");
  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${esc(title)}</title>`,
    description && `    <meta name="description" content="${attr(description)}" />`,
    noindex && '    <meta name="robots" content="noindex" />',
    gtm && `    <script async src="https://www.googletagmanager.com/gtm.js?id=${attr(gtm)}"></script>`,
    '    <link rel="stylesheet" href="https://pages.petavue.com/assets/sections.css" />',
    "    <style>",
    "      :root {",
    tokens,
    "      }",
    "    </style>",
    pixel && `    <script async src="https://pages.petavue.com/pixel.js" data-page="${attr(slug)}"></script>`,
    "  </head>",
    '  <body class="lp">',
    sections.join("\n\n"),
    "  </body>",
    "</html>",
  ].filter(Boolean).join("\n");
}

/* Tag names and attributes, coloured in one pass over the escaped source. */
const paint = (source) =>
  esc(source).replace(/(&lt;\/?)([\w-]+)|([\w:-]+)(=)("[^"]*")/g, (m, lt, tag, name, eq, value) =>
    tag
      ? `${lt}<span class="lib-code__tag">${tag}</span>`
      : `<span class="lib-code__attr">${name}</span>${eq}<span class="lib-code__value">${value}</span>`);

export default function PageCode({ source }) {
  const lines = useMemo(() => source.split("\n"), [source]);
  return (
    <div className="lib-code" tabIndex={0} aria-label="Page HTML">
      <pre className="lib-code__gutter" aria-hidden="true">{lines.map((_, i) => i + 1).join("\n")}</pre>
      <pre className="lib-code__source"><code dangerouslySetInnerHTML={{ __html: paint(source) }} /></pre>
    </div>
  );
}
