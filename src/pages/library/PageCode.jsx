/* The page as code: the project it is published from.
   The markup is read from the preview itself, so the two can never disagree.
   It is laid out as the files a developer would expect: one component per
   section, the page that orders them, the design system as tokens, the
   stylesheet the sections use, and the page's settings. */
import { useMemo, useState } from "react";
import { zipSync, strToU8 } from "fflate";
import {
  BracketsCurly, CaretDown, CaretRight, Copy, DownloadSimple, FileCode, FileCss, FileHtml, FileText, FolderSimple, MagnifyingGlass,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/ui";
import sectionsCss from "./sections.css?raw";

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
export function documentFor(root, { title, description, vars, pixel, slug, noindex, gtm, canonical, og }) {
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
    canonical && `    <link rel="canonical" href="${attr(canonical)}" />`,
    og && `    <meta property="og:title" content="${attr(og.title)}" />`,
    og?.description && `    <meta property="og:description" content="${attr(og.description)}" />`,
    og?.image && '    <meta property="og:image" content="https://pages.petavue.com/assets/og-image.png" />',
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

// "Hero with product shot" becomes HeroWithProductShot.
const componentName = (name) => name.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^(.)/, (c) => c.toUpperCase());

// Markup as JSX: class and for renamed, inline custom properties as an object.
const toJsx = (html) => html
  .replace(/ class="/g, ' className="')
  .replace(/ for="/g, ' htmlFor="')
  .replace(/ style="([^"]*)"/g, (_, css) => {
    const pairs = css.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
      const at = d.indexOf(":");
      return `"${d.slice(0, at).trim()}": "${d.slice(at + 1).trim()}"`;
    });
    return pairs.length ? ` style={{ ${pairs.join(", ")} }}` : "";
  })
  .replace(/<(img|input|br|hr)([^>]*?)\/?>/g, "<$1$2 />");

/* The project for the sections found under `root`: [{ path, content }]. */
export function projectFor(root, opts) {
  const { title, description, vars, pixel, slug, noindex, gtm, canonical, og, sections, settings } = opts;
  const nodes = [...root.querySelectorAll("[data-key]")];
  const seen = {};
  const parts = nodes.map((el, i) => {
    const base = componentName(sections[i]?.name || `Section ${i + 1}`);
    seen[base] = (seen[base] || 0) + 1;
    const name = seen[base] > 1 ? `${base}${seen[base]}` : base;
    const html = (el.firstElementChild?.outerHTML || "").replace(/ data-(piece|picked)="[^"]*"/g, "").replace(/ style=""/g, "");
    return { name, html };
  });
  const tokens = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  const pageName = componentName(slug || "page") || "Page";

  const files = [
    { path: "README.md", content: [
      `# ${title}`,
      "",
      "A landing page built in Petavue from published Library components.",
      "",
      "- `src/pages` holds the page: the sections in order.",
      "- `src/sections` holds one component per section on the page.",
      "- `src/styles/tokens.css` is your design system. Change a value there and every section follows.",
      "- `page.config.json` holds the page settings: address, search, sharing, tracking and forms.",
      "- `index.html` is the page as it is served.",
    ].join("\n") },
    { path: "index.html", content: documentFor(root, { title, description, vars, pixel, slug, noindex, gtm, canonical, og }) },
    { path: "package.json", content: JSON.stringify({
      name: slug || "landing-page", private: true, version: "1.0.0", type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
      devDependencies: { vite: "^7.0.0", "@vitejs/plugin-react": "^5.0.0" },
    }, null, 2) },
    { path: "page.config.json", content: JSON.stringify(settings, null, 2) },
    { path: `src/pages/${pageName}.jsx`, content: [
      ...parts.map((p) => `import ${p.name} from "../sections/${p.name}";`),
      'import "../styles/tokens.css";',
      'import "../styles/sections.css";',
      "",
      `export default function ${pageName}() {`,
      "  return (",
      '    <main className="lp">',
      ...parts.map((p) => `      <${p.name} />`),
      "    </main>",
      "  );",
      "}",
    ].join("\n") },
    ...parts.map((p) => ({ path: `src/sections/${p.name}.jsx`, content: [
      `export default function ${p.name}() {`,
      "  return (",
      indent(toJsx(p.html), 2),
      "  );",
      "}",
    ].join("\n") })),
    { path: "src/styles/sections.css", content: sectionsCss.trim() },
    { path: "src/styles/tokens.css", content: `/* Your design system. Every section reads these. */\n:root {\n${tokens}\n}` },
    pixel && { path: "src/lib/tracking.js", content: [
      "// The Petavue tracking pixel: visits and form completions on this page.",
      'const script = document.createElement("script");',
      "script.async = true;",
      'script.src = "https://pages.petavue.com/pixel.js";',
      `script.dataset.page = "${slug || ""}";`,
      "document.head.appendChild(script);",
    ].join("\n") },
  ].filter(Boolean);
  return files.sort((a, b) => {
    const [da, db] = [a.path.includes("/"), b.path.includes("/")];
    return da === db ? a.path.localeCompare(b.path) : da ? -1 : 1;
  });
}

/* Light colouring, one pass over the escaped source, by kind of file. */
const paintMarkup = (source) =>
  esc(source).replace(/(&lt;\/?)([\w-]+)|([\w:-]+)(=)("[^"]*")|\b(import|export default function|from|return)\b/g, (m, lt, tag, name, eq, value, word) =>
    word ? `<span class="lib-code__word">${word}</span>`
      : tag ? `${lt}<span class="lib-code__tag">${tag}</span>`
        : `<span class="lib-code__attr">${name}</span>${eq}<span class="lib-code__value">${value}</span>`);
const paintCss = (source) => esc(source).replace(/(\/\*[\s\S]*?\*\/)|(^|\n)(\s*)([\w-]+)(\s*:)(?=[^\n{]*;)/g, (m, comment, nl, pad, prop, colon) =>
  (comment ? `<span class="lib-code__attr">${comment}</span>` : `${nl}${pad}<span class="lib-code__tag">${prop}</span>${colon}`));
const paintJson = (source) => esc(source).replace(/("[^"]*")(\s*:)|("[^"]*")/g, (m, key, colon, str) =>
  (key ? `<span class="lib-code__tag">${key}</span>${colon}` : `<span class="lib-code__value">${str}</span>`));
const paint = (path, source) => (/\.(jsx|html)$/.test(path) ? paintMarkup(source) : path.endsWith(".css") ? paintCss(source) : path.endsWith(".json") ? paintJson(source) : esc(source));

const iconFor = (path) => (path.endsWith(".css") ? FileCss : path.endsWith(".html") ? FileHtml : path.endsWith(".json") ? BracketsCurly : path.endsWith(".md") ? FileText : FileCode);

// Paths as a tree: folders first, each with its files.
function treeOf(files) {
  const root = { dirs: {}, files: [] };
  for (const f of files) {
    const parts = f.path.split("/");
    let at = root;
    parts.slice(0, -1).forEach((d) => { at.dirs[d] = at.dirs[d] || { dirs: {}, files: [] }; at = at.dirs[d]; });
    at.files.push({ name: parts[parts.length - 1], path: f.path });
  }
  return root;
}

function Tree({ node, base, depth, open, onToggle, active, onPick }) {
  return (
    <>
      {Object.keys(node.dirs).sort().map((d) => {
        const path = `${base}${d}/`;
        const isOpen = open[path] !== false;
        return (
          <div key={path}>
            <button type="button" className="lib-files__row" style={{ paddingLeft: 12 + depth * 14 }} aria-expanded={isOpen} onClick={() => onToggle(path)}>
              {isOpen ? <CaretDown size={11} /> : <CaretRight size={11} />}
              <FolderSimple size={14} />
              <span>{d}</span>
            </button>
            {isOpen && <Tree node={node.dirs[d]} base={path} depth={depth + 1} open={open} onToggle={onToggle} active={active} onPick={onPick} />}
          </div>
        );
      })}
      {node.files.map((f) => {
        const Icon = iconFor(f.path);
        return (
          <button key={f.path} type="button" className={`lib-files__row lib-files__row--file${active === f.path ? " lib-files__row--on" : ""}`} style={{ paddingLeft: 12 + depth * 14 + 15 }} aria-current={active === f.path} onClick={() => onPick(f.path)}>
            <Icon size={14} />
            <span>{f.name}</span>
          </button>
        );
      })}
    </>
  );
}

export default function PageCode({ files, name = "landing-page" }) {
  const [picked, setPicked] = useState(null);
  const [open, setOpen] = useState({});
  const [query, setQuery] = useState("");
  const shown = query.trim() ? files.filter((f) => f.path.toLowerCase().includes(query.trim().toLowerCase())) : files;
  // The page itself opens first; a file that has gone falls back to it.
  const file = files.find((f) => f.path === picked) || files.find((f) => f.path.startsWith("src/pages/")) || files[0];
  const tree = useMemo(() => treeOf(shown), [shown]);
  const lines = useMemo(() => (file ? file.content.split("\n") : []), [file]);
  if (!file) return <div className="lib-code" />;

  const copy = () => navigator.clipboard?.writeText(file.content).then(() => toast.success(`${file.path.split("/").pop()} copied.`), () => toast.error("Could not copy."));
  const download = () => {
    const zip = zipSync(Object.fromEntries(files.map((f) => [`${name}/${f.path}`, strToU8(f.content)])));
    const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
    Object.assign(document.createElement("a"), { href: url, download: `${name}.zip` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`${files.length} files downloaded as a zip.`);
  };

  return (
    <div className="lib-project">
      <aside className="lib-files" aria-label="Project files">
        <div className="lib-files__head">
          <span className="lib-files__title">Files</span>
          <span className="lib-files__count">{files.length}</span>
        </div>
        <label className="lib-files__search">
          <MagnifyingGlass size={13} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files" aria-label="Search files" />
        </label>
        <div className="lib-files__list">
          <Tree node={tree} base="" depth={0} open={query.trim() ? {} : open} onToggle={(path) => setOpen((o) => ({ ...o, [path]: o[path] === false }))} active={file.path} onPick={setPicked} />
          {!shown.length && <p className="lib-files__none">No file matches.</p>}
        </div>
      </aside>

      <div className="lib-project__main">
        <div className="lib-project__bar">
          <span className="lib-project__tab">{file.path}</span>
          <span className="lib-project__meta">{lines.length} lines</span>
          <Button variant="secondaryGhost" size="sm" icon={Copy} iconPosition="prefix" label="Copy" onClick={copy} />
          <Button variant="secondaryGhost" size="sm" icon={DownloadSimple} iconPosition="prefix" label="Download .zip" onClick={download} />
        </div>
        <div className="lib-code" tabIndex={0} aria-label={file.path}>
          <pre className="lib-code__gutter" aria-hidden="true">{lines.map((_, i) => i + 1).join("\n")}</pre>
          <pre className="lib-code__source"><code dangerouslySetInnerHTML={{ __html: paint(file.path, file.content) }} /></pre>
        </div>
      </div>
    </div>
  );
}
