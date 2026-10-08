// What the agent says and does when it builds a landing page in chat.
// Scripted, like the rest of the mock, but the rule it follows is the real
// one: a page is made only from components the workspace has published, laid
// out by a template the workspace has added. Every reply that claims a change
// returns the new list of sections, so the page on screen really changes.
//
// A page section is a snapshot of a workspace component at the moment it was
// placed: { key, sourceId, name, overrides }. Later edits to the component do
// not change a page that already uses it.

import { CATEGORIES, TEMPLATES, componentById } from "./library";
import { editReply } from "./libraryChat";

// Which template a request points at, and the words that mean each section.
const TEMPLATE_HINTS = {
  "tpl-demo": /demo|campaign|paid|lead/,
  "tpl-launch": /launch|pricing|announc|plan/,
  "tpl-roi": /\broi\b|calculator|cost|justify/,
  "tpl-signup": /sign-?up|newsletter|waitlist|webinar|email/,
};

const ALIASES = {
  "header-simple": /header|nav(igation)?( bar)?/,
  "hero-split": /hero/,
  "hero-demo": /hero|demo form/,
  "hero-form": /hero|email capture/,
  "logo-cloud": /logos?|customer names/,
  "stats-band": /stats?|numbers/,
  "testimonial": /testimonial|quote/,
  "feature-grid": /feature grid|features|benefits/,
  "feature-split": /feature with image|feature image/,
  "pricing-three": /pricing|plans/,
  "lead-form": /form/,
  "roi-calculator": /\broi\b|calculator/,
  "cta-banner": /\bcta\b|call.to.action|banner/,
  "compare-table": /comparison|compare/,
  "faq": /faq|questions/,
  "footer-columns": /footer/,
};

let seq = 0;
const snapshot = (item) => ({
  key: `s-${++seq}`,
  sourceId: item.sourceId,
  name: item.name,
  // What the agent read when it chose this: kept so the reply can show it.
  description: item.description,
  overrides: { vars: { ...item.overrides.vars }, copy: { ...item.overrides.copy } },
});

const rank = (sourceId) => CATEGORIES.indexOf(componentById(sourceId).category);
const list = (names) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ── How the agent reads the workspace ─────────────────────────────────────
// A component's name, description, folder and tags are its instructions. The
// agent scores each one against the request by the words they share, so a
// copy described as "Use for webinar pages" wins a webinar request over the
// original, and "from the Launch folder" or "tagged demo" steers the choice.

const STOP = new Set(("a an and are as at be build can for from in into is it landing make of on or our page pages section that the this to use used "
  + "when with your we us my new create want need please about tagged tag folder template components component").split(" "));
const words = (text) => String(text || "").toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) || [];
const stem = (w) => w.replace(/(ing|ers|er|es|s)$/, "");

// How many of the request's words a thing's own words cover, and which ones.
function matchOf(request, thing) {
  const own = new Set(words(`${thing.name} ${thing.description} ${thing.folder || ""} ${(thing.tags || []).join(" ")}`).map(stem));
  const hits = [...new Set(words(request).filter((w) => own.has(stem(w))))];
  return { score: hits.length, hits };
}

// The published copy of a component that fits the request best.
function publishedFor(workspace, sourceId, request = "") {
  const copies = workspace.items.filter((i) => i.sourceId === sourceId && i.status === "published");
  if (copies.length < 2) return copies[0] ? { item: copies[0], chosenOver: null } : null;
  const scored = copies.map((item) => ({ item, ...matchOf(request, item) })).sort((a, b) => b.score - a.score);
  const [best, next] = scored;
  return { item: best.item, chosenOver: best.score > next.score ? { name: next.item.name, hits: best.hits } : null };
}

// The templates the workspace can use. Mirrors workspaceTemplates in the
// store; kept here so the mock does not import from a page.
function templatesOf(workspace) {
  const taken = workspace.templates.map((t) => ({ ...TEMPLATES.find((x) => x.id === t.id), folder: t.folder, tags: t.tags })).filter((t) => t.name);
  return [...taken, ...(workspace.saved || []).map((t) => ({ ...t, saved: true }))];
}

// The template a request points at: by its hint, or by the words it shares.
function templateFor(request, templates) {
  const t = request.toLowerCase();
  const scored = templates
    .map((tpl) => ({ tpl, score: matchOf(request, tpl).score + (TEMPLATE_HINTS[tpl.id]?.test(t) ? 2 : 0) }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].tpl : null;
}

// Why a section a template asks for could not be placed.
function missingReason(workspace, sourceId) {
  return workspace.items.some((i) => i.sourceId === sourceId) ? "still a draft" : "not in your workspace";
}

function fromTemplate(template, workspace, request = "") {
  // A page saved as a template is placed as it was saved.
  if (template.snapshots) {
    return { sections: template.snapshots.map((s) => snapshot({ ...s, description: workspace.items.find((i) => i.sourceId === s.sourceId && i.name === s.name)?.description || componentById(s.sourceId).description })), skipped: [], choices: [] };
  }
  const sections = [];
  const skipped = [];
  const choices = [];
  for (const sourceId of template.sections) {
    const found = publishedFor(workspace, sourceId, request);
    if (!found) { skipped.push({ name: componentById(sourceId).name, reason: missingReason(workspace, sourceId) }); continue; }
    sections.push(snapshot(found.item));
    if (found.chosenOver) choices.push({ name: found.item.name, over: found.chosenOver.name, hits: found.chosenOver.hits });
  }
  return { sections, skipped, choices };
}

function skippedNote(skipped) {
  if (!skipped.length) return "";
  const drafts = skipped.filter((s) => s.reason === "still a draft").map((s) => s.name);
  const absent = skipped.filter((s) => s.reason !== "still a draft").map((s) => s.name);
  const parts = [];
  if (drafts.length) parts.push(`${list(drafts)} ${drafts.length === 1 ? "is" : "are"} still in draft`);
  if (absent.length) parts.push(`${list(absent)} ${absent.length === 1 ? "is" : "are"} not in your workspace`);
  return `\n\nI left out ${plural(skipped.length, "section")} the template asks for: ${parts.join(", and ")}. Publish them in the Library and ask me to add them.`;
}

// Where the agent chose between two published copies, and what decided it.
function choiceNote(choices) {
  if (!choices.length) return "";
  return `\n\n${choices.map((c) => `I used **${c.name}** rather than ${c.over}, because its description and tags match your request (${list(c.hits.map((h) => `“${h}”`))}).`).join(" ")}`;
}

// What the reply shows under "Built from": each section and the description
// the agent followed in choosing it.
const usedOf = (templateName, sections, title) => ({
  title,
  template: templateName,
  components: sections.map((s) => s.name),
  reasons: sections.map((s) => ({ name: s.name, why: s.description })),
});

// The first build. `templateId` is the template chosen before asking, when
// there was one. A workspace is recommended, not required: with nothing
// published the agent still builds, from the library as it comes.
export function buildPage(prompt, workspace, templateId = null) {
  const t = prompt.toLowerCase();
  const published = workspace.items.filter((i) => i.status === "published");

  if (!published.length) {
    const template = TEMPLATES.find((tpl) => TEMPLATE_HINTS[tpl.id].test(t)) || TEMPLATES[0];
    const sections = template.sections.map((sourceId) => snapshot({ ...componentById(sourceId), sourceId, overrides: { vars: {}, copy: {} } }));
    return {
      name: template.name,
      templateId: null,
      sections,
      working: ["Read your design system", "Found no published components in your workspace", `Used the library's ${template.name} layout as it comes`],
      used: usedOf(template.name, sections, "Built from the library, not your workspace"),
      text: `Here is a first version. Your workspace has no published components, so I built it on my own from the library's **${template.name}** layout, in your design system.\n\nThis works, but it is not what I'd recommend: these sections have not been reviewed by your team. Publish the components you want me to keep to in the **Library**, and I'll build from those.\n\nTell me what to change, or publish it when it is ready.`,
    };
  }

  const mine = templatesOf(workspace);
  const chosen = mine.find((tpl) => tpl.id === templateId);
  const template = chosen || templateFor(prompt, mine) || mine[0];

  // A template that would suit the request better but has not been added.
  const ideal = TEMPLATES.find((tpl) => TEMPLATE_HINTS[tpl.id].test(t));
  const idealNote = !chosen && ideal && !mine.some((m) => m.id === ideal.id) && !(template && matchOf(prompt, template).score)
    ? `\n\nThe **${ideal.name}** template would suit this request better, but it is not in your workspace.`
    : "";

  if (template) {
    const { sections, skipped, choices } = fromTemplate(template, workspace, prompt);
    const how = chosen ? "the template you picked" : template.saved ? "a page you saved as a template" : "your template";
    return {
      name: template.name.replace(/ template$/i, ""),
      templateId: template.id,
      sections,
      working: ["Read your design system", `Chose the ${template.name.replace(/ template$/i, "")} template`, `Read the description of each published component and placed ${sections.length}`],
      used: usedOf(template.name, sections),
      text: `Here is a first version, built from **${template.name}** (${how}) with ${plural(sections.length, "published component")} and your design system.${choiceNote(choices)}${skippedNote(skipped)}${idealNote}\n\nTell me what to change, or publish it when it is ready.`,
    };
  }

  // No template in the workspace: one of each kind, in the usual page order.
  const seen = new Set();
  const choices = [];
  const sections = [...published]
    .sort((a, b) => rank(a.sourceId) - rank(b.sourceId))
    .filter((i) => !seen.has(i.sourceId) && seen.add(i.sourceId))
    .map((i) => {
      const found = publishedFor(workspace, i.sourceId, prompt);
      if (found.chosenOver) choices.push({ name: found.item.name, over: found.chosenOver.name, hits: found.chosenOver.hits });
      return snapshot(found.item);
    });
  return {
    name: "Landing page",
    templateId: null,
    sections,
    working: ["Read your design system", "Found no template in your workspace", `Read the description of each published component and placed ${sections.length}`],
    used: usedOf(null, sections),
    text: `Here is a first version. Your workspace has no templates, so I arranged your ${plural(sections.length, "published component")} in the usual order for a landing page, on my own. A template is recommended: it keeps pages of the same kind consistent.${choiceNote(choices)}\n\nTell me what to change, or publish it when it is ready.`,
  };
}

// A page Petavue drafts on its own, from a list of sections and the words
// for them: { name, sections: [sourceId], copy: { [sourceId]: {...} } }. It
// follows the same rule as any page: published components only. `{brand}` in
// the copy becomes the workspace's brand.
export function buildFromSpec(spec, workspace, brand) {
  const fill = (v) => (typeof v === "string" ? v.replace(/\{brand\}/g, brand || "us") : v);
  const sections = [];
  const skipped = [];
  for (const sourceId of spec.sections) {
    const found = publishedFor(workspace, sourceId, spec.name);
    if (!found) { skipped.push({ name: componentById(sourceId).name, reason: missingReason(workspace, sourceId) }); continue; }
    const made = snapshot(found.item);
    const copy = Object.fromEntries(Object.entries(spec.copy?.[sourceId] || {}).map(([k, v]) => [k, fill(v)]));
    sections.push({ ...made, overrides: { ...made.overrides, copy: { ...made.overrides.copy, ...copy } } });
  }
  return { sections, skipped, used: usedOf(null, sections), skippedNote: skippedNote(skipped) };
}

// ── What the agent asks before it builds ──────────────────────────────────
// Asked in chat, one at a time, each with a recommended answer and a way to
// skip. The recommendation comes from the request itself.

// Each goal is a different page, not a different button. `needs` are the
// sections the goal cannot do without, `drops` are the ones that pull against
// it, and `hero` is the hero that suits it when the workspace has it.
const GOALS = {
  // A demo page is a form page: the hero carries the form, and the layouts
  // differ only in how much sits under it.
  demo: { label: "Book a demo", name: "Demo page", button: "Book a demo", hint: "demo", hero: "hero-demo", heroCovers: ["lead-form"], needs: [], drops: ["pricing-three"],
    shape: "the form is in the hero, on the first screen, and little else is on the page",
    layouts: [
      { id: "form", label: "Form only", note: "The form and your customers’ names, nothing else", keep: ["logo-cloud"] },
      { id: "proof", label: "Form and proof", note: "Adds a customer quote under the form", keep: ["logo-cloud", "testimonial"] },
      { id: "product", label: "Form and product", note: "Adds what the product does, and a quote", keep: ["logo-cloud", "feature-grid", "testimonial"] },
    ] },
  signup: { label: "Sign up with an email", name: "Sign-up page", button: "Get started", hint: "sign-up", hero: "hero-form", needs: ["cta-banner"], drops: ["lead-form", "testimonial", "pricing-three"],
    shape: "it is short, asks only for an email in the hero, and ends on one button" },
  pricing: { label: "See pricing and start a trial", name: "Pricing and trial page", button: "Start a trial", hint: "launch pricing", needs: ["pricing-three", "cta-banner"], drops: ["lead-form"],
    shape: "it has no demo form and leads to the plans and a trial button" },
};
// Sections every page keeps, whatever the layout.
const FRAME = ["header-simple", "lead-form", "footer-columns"];
// Who the page is for decides what the hero says under the headline.
const AUDIENCES = {
  revops: "See which deals put the quarter at risk, from the CRM data you already have.",
  sales: "Know which deals will slip before your forecast call, and what to do about each one.",
  finance: "A forecast you can take to the board, with the deals behind every number.",
};

// Reshapes a built page for its goal, from published components only. Returns
// the sections and what the goal wanted but the workspace could not supply.
function shapeFor(goal, sections, workspace, request) {
  const missing = [];
  let next = sections.filter((s) => !goal.drops.includes(s.sourceId));
  const place = (sourceId) => {
    const found = publishedFor(workspace, sourceId, request);
    if (!found) missing.push({ name: componentById(sourceId).name, reason: missingReason(workspace, sourceId) });
    return found && snapshot(found.item);
  };
  if (goal.hero && !next.some((s) => s.sourceId === goal.hero)) {
    const hero = place(goal.hero);
    if (hero) {
      // What the new hero already does is not repeated further down.
      next = next.map((s) => (s.sourceId.startsWith("hero") ? hero : s)).filter((s) => !(goal.heroCovers || []).includes(s.sourceId));
    }
  }
  for (const sourceId of goal.needs) {
    if (next.some((s) => s.sourceId === sourceId)) continue;
    const made = place(sourceId);
    if (!made) continue;
    // In the usual page order: before the first section that ranks after it.
    const at = next.findIndex((s) => rank(s.sourceId) > rank(sourceId));
    next = at < 0 ? [...next, made] : [...next.slice(0, at), made, ...next.slice(at)];
  }
  return { sections: next, missing };
}
const CAMPAIGNS = {
  demo: { label: "LinkedIn demo campaigns", headline: "See where this quarter’s number is at risk", ads: "LinkedIn demo ads" },
  retargeting: { label: "LinkedIn retargeting", headline: "See {brand} on your own pipeline", ads: "LinkedIn retargeting ads" },
  none: { label: "No campaign yet" },
};

export function pageQuestions(prompt) {
  const t = prompt.toLowerCase();
  const goal = /sign-?up|newsletter|waitlist|webinar|email/.test(t) ? "signup" : /pricing|launch|plan/.test(t) ? "pricing" : "demo";
  const campaign = /retarget/.test(t) ? "retargeting" : /demo|campaign|paid|linkedin/.test(t) ? "demo" : "none";
  const options = (map, recommended) => Object.entries(map).map(([id, o]) => ({ id, label: o.label, recommended: id === recommended }));
  return [
    { id: "goal", short: "Goal", question: "What should this page get visitors to do?", options: options(GOALS, goal) },
    { id: "audience", short: "For", question: "Who is the page for?", options: [
      { id: "revops", label: "Revenue operations leaders", recommended: true },
      { id: "sales", label: "Sales leaders" },
      { id: "finance", label: "Finance" },
    ] },
    { id: "campaign", short: "Traffic from", question: "Which campaign sends people here?", options: options(CAMPAIGNS, campaign) },
  ];
}

// Three ways to arrange the same page. Each is a full build, so the one that
// is chosen is placed as it was shown.
const ARRANGEMENTS = [
  { id: "form", label: "Form first", note: "The form sits right under the hero", lead: ["lead-form"] },
  { id: "pricing", label: "Plans first", note: "The plans sit right under the hero", lead: ["pricing-three"] },
  { id: "proof", label: "Proof first", note: "Customers and their words come first", lead: ["logo-cloud", "stats-band", "testimonial"] },
  { id: "product", label: "Product first", note: "What the product does comes first", lead: ["feature-grid", "feature-split"] },
];

export function pageDirections(prompt, workspace, templateId, answers, brand) {
  const goal = GOALS[answers.goal?.id];
  const campaign = CAMPAIGNS[answers.campaign?.id];
  const lead = AUDIENCES[answers.audience?.id];
  const built = buildPage(`${prompt} ${goal?.hint || ""}`, workspace, templateId);
  // A template picked by hand is followed as it is; otherwise the goal shapes
  // the page.
  const shaped = goal && !templateId && workspace.items.some((i) => i.status === "published")
    ? shapeFor(goal, built.sections, workspace, prompt)
    : { sections: built.sections, missing: [] };
  const reshaped = shaped.sections.length !== built.sections.length || shaped.sections.some((s, i) => s.sourceId !== built.sections[i].sourceId);
  const base = { ...built, sections: shaped.sections, name: (reshaped && goal.name) || built.name };
  const heroAt = base.sections.findIndex((s) => s.sourceId.startsWith("hero"));
  const withCopy = (s) => {
    const copy = {};
    if (goal && componentById(s.sourceId).text.includes("button") && ["Header", "Hero", "Forms", "CTA"].includes(componentById(s.sourceId).category)) copy.button = goal.button;
    if (campaign?.headline && s.sourceId.startsWith("hero")) copy.headline = campaign.headline.replace("{brand}", brand || "us");
    if (lead && s.sourceId.startsWith("hero")) copy.lead = lead;
    return Object.keys(copy).length ? { ...s, overrides: { ...s.overrides, copy: { ...s.overrides.copy, ...copy } } } : s;
  };
  const wanted = shaped.missing.map((m) => `**${m.name}** (${m.reason})`);
  const because = [
    goal && `The goal is “${goal.label.toLowerCase()}”, so ${goal.shape}, and the buttons say “${goal.button}”.`,
    wanted.length && `This goal would also use ${list(wanted)}. Publish ${wanted.length === 1 ? "it" : "them"} in the Library and ask me to add ${wanted.length === 1 ? "it" : "them"}.`,
    campaign?.headline && `The headline repeats the wording of your ${campaign.ads}, so the page says what the ad said.`,
    lead && `The line under the headline is written for ${answers.audience.label.toLowerCase()}.`,
  ].filter(Boolean).join(" ");
  // Only the arrangements this page has the sections for.
  const possible = ARRANGEMENTS.filter((a) => base.sections.some((s) => a.lead.includes(s.sourceId)));
  const recommended = (possible.find((a) => a.id === (answers.goal?.id === "pricing" ? "pricing" : "form")) || possible.find((a) => a.id === (answers.goal?.id === "signup" ? "proof" : "product")) || possible[0])?.id;
  const arrangements = possible.length ? possible : [{ id: "plain", label: "As built", note: "The sections in their usual order", lead: [] }];
  const finish = (a, ordered) => {
    // Each direction gets its own section keys, so previews do not collide.
    const sections = ordered.map((s) => ({ ...withCopy(s), key: `s-${++seq}` }));
    return {
      id: a.id, label: a.label, note: a.note, recommended: a.recommended,
      built: {
        ...base,
        sections,
        // The counts are of this direction's page, not the template's.
        working: base.working.map((w) => w.replace(/placed \d+$/, `placed ${sections.length}`)),
        used: { ...base.used, components: sections.map((s) => s.name), reasons: sections.map((s) => ({ name: s.name, why: s.description })) },
        text: `${base.text.split("\n\n")[0].replace("Here is a first version", `Here is the **${a.label}** version`).replace(/with \d+ published components?/, `with ${plural(sections.length, "published component")}`)}${because ? `\n\n${because}` : ""}${base.text.includes("\n\n") ? `\n\n${base.text.split("\n\n").slice(1).join("\n\n")}` : ""}`,
      },
    };
  };

  // A goal with its own layouts: each keeps a different amount of the page.
  if (goal?.layouts && shaped.sections !== built.sections) {
    return goal.layouts.map((l, i) => finish({ ...l, recommended: i === 0 }, base.sections.filter((s) => s.sourceId.startsWith("hero") || FRAME.includes(s.sourceId) || l.keep.includes(s.sourceId))));
  }

  return arrangements.map((a) => {
    const lead = base.sections.filter((s) => a.lead.includes(s.sourceId));
    const rest = base.sections.filter((s) => !a.lead.includes(s.sourceId));
    const at = rest.findIndex((s) => s.sourceId.startsWith("hero"));
    const ordered = heroAt < 0 || !lead.length ? base.sections : [...rest.slice(0, at + 1), ...lead, ...rest.slice(at + 1)];
    return finish({ ...a, recommended: a.id === recommended }, ordered);
  });
}

const HELP =
  "I can **add**, **remove** or **move** a section, **rewrite** the headline, supporting text or button, switch to another **template** in your workspace, or **undo** the last change. For example: add the pricing section, or move the form above the features.";

const quoted = (text) => (text.match(/["“]([^"”]{2,})["”]/) || text.match(/(?:^|\s)['‘]([^'’]{2,})['’](?=[\s.,]|$)/))?.[1]?.trim();
const afterTo = (text) => text.match(/\b(?:to|say|says|read|reads)\s*:?\s+(.{2,})$/i)?.[1]?.replace(/[.\s]+$/, "").trim();
const TEXT_PIECES = [
  { key: "lead", re: /sub-?head(ing|line)?|subtitle|description|paragraph|supporting text/, label: "supporting text" },
  { key: "headline", re: /headline|heading|title/, label: "headline" },
  { key: "button", re: /button|\bcta\b/, label: "button" },
];

// Every source id whose alias appears in the text, in the order they appear.
function mentioned(t) {
  return Object.entries(ALIASES)
    .map(([sourceId, re]) => ({ sourceId, at: t.search(re) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((m) => m.sourceId);
}

// A change to a page that already exists. Returns { text, sections?, action?, rebuild? }.
export function pageReply(text, page, workspace) {
  const t = text.trim().toLowerCase();
  const sections = page.sections;
  const onPage = (sourceIds) => sections.findIndex((s) => sourceIds.includes(s.sourceId));

  if (/\bundo\b|revert (that|it)|go back/.test(t)) {
    return page.history.length ? { action: "undo", text: "Undone. The page is back to how it was before the last change." } : { text: "There is nothing to undo yet." };
  }

  // Another template from the workspace.
  if (/template/.test(t)) {
    const mine = templatesOf(workspace);
    const asked = t.replace(/template/g, "");
    const wanted = mine.find((tpl) => t.includes(tpl.name.toLowerCase().replace(/ (page|template)$/, ""))) || templateFor(asked, mine)
      || TEMPLATES.find((tpl) => t.includes(tpl.name.toLowerCase().replace(" page", "")) || TEMPLATE_HINTS[tpl.id].test(asked));
    if (!wanted) return { text: `Which template? Your workspace has ${mine.length ? list(mine.map((m) => `**${m.name}**`)) : "none yet"}.` };
    if (!mine.some((m) => m.id === wanted.id)) return { text: `**${wanted.name}** is not in your workspace. Add it in the Library and I can use it.` };
    const built = fromTemplate(wanted, workspace, text);
    return {
      sections: built.sections,
      rebuild: { name: wanted.name.replace(/ template$/i, ""), templateId: wanted.id },
      used: usedOf(wanted.name, built.sections),
      text: `Done. The page now follows your **${wanted.name}** template, with ${plural(built.sections.length, "published component")}.${choiceNote(built.choices)}${skippedNote(built.skipped)}`,
    };
  }

  // Rewrite a piece of text. It lands on the first section that has that piece.
  const piece = TEXT_PIECES.find((p) => p.re.test(t));
  const words = quoted(text) || afterTo(text);
  // Only the request itself decides this, not the new words inside the quotes.
  const ask = t.split(/["“'‘]/)[0];
  if (piece && words && !/\b(add|remove|delete|move)\b/.test(ask)) {
    const at = sections.findIndex((s) => componentById(s.sourceId).text.includes(piece.key) && (piece.key !== "headline" || componentById(s.sourceId).category === "Hero"));
    const target = at >= 0 ? at : sections.findIndex((s) => componentById(s.sourceId).text.includes(piece.key));
    if (target < 0) return { text: `No section on this page has a ${piece.label} to change.` };
    const next = sections.map((s, i) => (i === target ? { ...s, overrides: { ...s.overrides, copy: { ...s.overrides.copy, [piece.key]: words } } } : s));
    return { sections: next, text: `Done. The ${piece.label} in **${sections[target].name}** now reads **“${words}”**.` };
  }

  const named = mentioned(t);

  if (/\b(remove|delete|drop|take out|get rid of)\b/.test(t)) {
    const at = onPage(named);
    if (!named.length) return { text: "Which section should I remove? Name it, for example: remove the testimonial." };
    if (at < 0) return { text: "That section is not on this page." };
    return { sections: sections.filter((_, i) => i !== at), text: `Done. I removed **${sections[at].name}**.` };
  }

  if (/\bmove\b|\bput\b.*\b(above|below|before|after)\b/.test(t)) {
    const present = named.filter((id) => sections.some((s) => s.sourceId === id));
    const from = onPage(present.slice(0, 1));
    if (from < 0) return { text: "Which section should I move? Name one that is on the page, for example: move the form above the features." };
    const rest = sections.filter((_, i) => i !== from);
    const anchorId = present.find((id) => id !== sections[from].sourceId);
    let to;
    if (anchorId && /above|before|below|after|under/.test(t)) {
      const anchor = rest.findIndex((s) => s.sourceId === anchorId);
      to = /above|before/.test(t) ? anchor : anchor + 1;
    } else if (/\btop\b|first/.test(t)) to = rest[0]?.sourceId === "header-simple" ? 1 : 0;
    else if (/\bup\b|higher|earlier/.test(t)) to = Math.max(0, from - 1);
    else if (/\bdown\b|lower|later/.test(t)) to = Math.min(rest.length, from + 1);
    else return { text: "Where should it go? Say up, down, or above or below another section." };
    if (to === from) return { text: `**${sections[from].name}** is already there.` };
    const next = [...rest.slice(0, to), sections[from], ...rest.slice(to)];
    return { sections: next, text: `Done. **${sections[from].name}** is now section ${to + 1} of ${next.length}.` };
  }

  if (/\b(add|include|insert|bring in)\b/.test(t)) {
    if (!named.length) return { text: "Which section should I add? Name it, for example: add the pricing section." };
    const fresh = named.find((id) => !sections.some((s) => s.sourceId === id)) || named[0];
    const name = componentById(fresh).name;
    if (sections.some((s) => s.sourceId === fresh)) return { text: `**${name}** is already on this page.` };
    const item = publishedFor(workspace, fresh, text)?.item;
    if (!item) {
      return { text: missingReason(workspace, fresh) === "still a draft"
        ? `**${name}** is still a draft, so I can't use it. Publish it in the Library and ask me again.`
        : `**${name}** is not in your workspace. Add and publish it in the Library and I can use it.` };
    }
    // Before the first section that normally comes later on a page.
    const before = sections.findIndex((s) => rank(s.sourceId) > rank(fresh));
    const at = before < 0 ? sections.length : before;
    const next = [...sections.slice(0, at), snapshot(item), ...sections.slice(at)];
    return { sections: next, text: `Done. I added **${item.name}** as section ${at + 1} of ${next.length}.` };
  }

  return { text: HELP };
}

// ── A change to the part picked on the canvas ─────────────────────────────
// target: { key, piece?, current? }. `piece` is headline, lead or button when
// a piece of text was picked rather than the whole section.

const PIECE_LABEL = { headline: "headline", lead: "supporting text", button: "button" };

// A shorter version of a line: its first sentence, or its first clause.
export function shorten(line) {
  const clean = line.trim();
  const sentences = clean.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 1) return sentences[0].trim();
  const end = /[.!?]$/.test(clean) ? clean.slice(-1) : "";
  const body = end ? clean.slice(0, -1) : clean;
  const words = body.split(/\s+/);
  const clause = body.split(/,| and | in the | so | before | with | on your /)[0].trim();
  if (clause.length < body.length && clause.split(/\s+/).length >= 2) return clause + end;
  return words.length > 7 ? words.slice(0, Math.ceil(words.length * 0.6)).join(" ") + end : clean;
}

export const targetLabel = (page, target) => {
  const section = page.sections.find((s) => s.key === target.key);
  if (!section) return "";
  return target.piece ? `${PIECE_LABEL[target.piece][0].toUpperCase()}${PIECE_LABEL[target.piece].slice(1)} · ${section.name}` : section.name;
};

// Returns null when the message is not about the picked part (undo, a template).
export function targetReply(text, page, target, design) {
  const t = text.trim().toLowerCase();
  const sections = page.sections;
  const at = sections.findIndex((s) => s.key === target.key);
  if (at < 0 || /\bundo\b|revert (that|it)|go back|template/.test(t)) return null;
  const section = sections[at];
  const withOverrides = (overrides) => sections.map((s, i) => (i === at ? { ...s, overrides } : s));
  const withCopy = (key, words) => withOverrides({ ...section.overrides, copy: { ...section.overrides.copy, [key]: words } });
  const ask = t.split(/["“'‘]/)[0];

  if (target.piece) {
    const label = PIECE_LABEL[target.piece];
    const words = quoted(text) || (!/colou?r|corner|bigger|smaller|larger|#[0-9a-f]{3}/.test(t) && afterTo(text));
    if (words) return { sections: withCopy(target.piece, words), text: `Done. The ${label} in **${section.name}** now reads **“${words}”**.` };
    if (/short|trim|tight|concise|fewer words|\bcut\b|brief/.test(t)) {
      const now = section.overrides.copy[target.piece] || target.current || "";
      const next = shorten(now);
      if (!now || next === now) return { text: `That ${label} is already short. Give me the words you want and I'll use them.` };
      return { sections: withCopy(target.piece, next), text: `Done. The ${label} now reads **“${next}”**. I only cut words; nothing new was added.` };
    }
  } else {
    if (/\b(remove|delete|drop|take out|get rid of)\b/.test(ask)) {
      return { sections: sections.filter((_, i) => i !== at), gone: true, text: `Done. I removed **${section.name}**.` };
    }
    if (/\bmove\b|\b(up|down|top|bottom|higher|lower)\b/.test(ask) && !/colou?r|corner|headline|button/.test(ask)) {
      const rest = sections.filter((_, i) => i !== at);
      let to = null;
      if (/\btop\b|first/.test(ask)) to = rest[0]?.sourceId === "header-simple" ? 1 : 0;
      else if (/bottom|last/.test(ask)) to = rest[rest.length - 1]?.sourceId === "footer-columns" ? rest.length - 1 : rest.length;
      else if (/\bup\b|higher|earlier/.test(ask)) to = Math.max(0, at - 1);
      else if (/\bdown\b|lower|later/.test(ask)) to = Math.min(rest.length, at + 1);
      if (to === null) return { text: "Where should it go? Say up, down, to the top or to the bottom." };
      if (to === at) return { text: `**${section.name}** is already there.` };
      const next = [...rest.slice(0, to), section, ...rest.slice(to)];
      return { sections: next, text: `Done. **${section.name}** is now section ${to + 1} of ${next.length}.` };
    }
  }

  // Its text, colour, corners or headline size, as when editing a component.
  const edit = editReply(text, { ...section, history: [] }, design);
  if (edit.action === "reset") return { sections: withOverrides({ vars: {}, copy: {} }), text: `Reset. **${section.name}** is back to how it is in your workspace.` };
  if (edit.patch) {
    const overrides = { vars: { ...section.overrides.vars, ...edit.patch.vars }, copy: { ...section.overrides.copy, ...edit.patch.copy } };
    return { sections: withOverrides(overrides), text: edit.text.replace(/this component/gi, `**${section.name}**`).replace(/the component/gi, `**${section.name}**`) };
  }
  return {
    text: target.piece
      ? `For this ${PIECE_LABEL[target.piece]} I can **shorten** it or **rewrite** it: give me the words in quotes. I can also change the colour or corners of its section.`
      : `For **${section.name}** I can **move** it up or down, **remove** it, **rewrite** its text, or change its **colour** and **corners**.`,
  };
}

export const BUILD_GREETING =
  "Tell me what the page is for. I'll build it from the components you have published and your design system.";
// A web address part from a page name: "Demo request page" becomes "demo-request".
export const slugFor = (name) =>
  name.toLowerCase().replace(/\bpage\b/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "page";
export const cleanSlug = (value) => value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+/, "");
