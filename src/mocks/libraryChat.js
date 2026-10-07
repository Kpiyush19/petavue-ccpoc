// What the agent says and does when a workspace component is edited in chat.
// Scripted, like the rest of the mock, but every reply that claims a change
// returns the change itself, so the preview really updates.
//
// A reply is { text, patch?, action? }: `patch` is { vars, copy } to merge into
// the component's overrides; `action` is "undo" or "reset".

import { componentById, readableOn } from "./library";

// Double quotes first, so an apostrophe inside the words is kept.
const quoted = (text) =>
  (text.match(/["“]([^"”]{2,})["”]/) || text.match(/(?:^|\s)['‘]([^'’]{2,})['’](?=[\s.,]|$)/))?.[1]?.trim();
const afterTo = (text) => text.match(/\b(?:to|say|says|read|reads)\s*:?\s+(.{2,})$/i)?.[1]?.replace(/[.\s]+$/, "").trim();

// Supporting text is checked first: "subheading" and "subtitle" contain the
// words that mean the headline.
const PIECES = [
  { key: "lead", re: /sub-?head(ing|line)?|subtitle|description|paragraph|supporting text|text under/, label: "supporting text" },
  { key: "headline", re: /headline|heading|title/, label: "headline" },
  { key: "button", re: /button|\bcta\b|call to action/, label: "button" },
];

const HELP =
  "I can change this component's **text** (headline, supporting text, button), its **colour**, its **corners** and its **headline size**. Tell me what you want, for example: change the headline to \"Stop guessing your forecast\".";

export function editReply(text, item, design) {
  const t = text.trim().toLowerCase();
  const source = componentById(item.sourceId);
  const can = (piece) => source.text.includes(piece);

  if (/\bundo\b|revert (that|it)|go back/.test(t)) {
    return item.history.length
      ? { action: "undo", text: "Undone. The component is back to how it was before the last change." }
      : { text: "There is nothing to undo yet." };
  }
  if (/\breset\b|start over|original/.test(t)) {
    return { action: "reset", text: "Reset. The component is back to how it came from the library." };
  }

  // Text: a piece of copy and the words to put there.
  const piece = PIECES.find((p) => p.re.test(t));
  const words = quoted(text) || afterTo(text);
  if (piece && words && !/bigger|larger|smaller|increase|decrease|reduce/.test(t)) {
    if (!can(piece.key)) return { text: `This component has no ${piece.label} to change.` };
    return { patch: { copy: { [piece.key]: words } }, text: `Done. The ${piece.label} now reads **“${words}”**.` };
  }

  // Headline size, relative to the design system.
  if (/bigger|larger|increase/.test(t) || /smaller|reduce|decrease/.test(t)) {
    if (!can("headline")) return { text: "This component has no headline to resize." };
    const up = /bigger|larger|increase/.test(t);
    const now = Number(item.overrides.vars["--lp-head-adjust"] || 1);
    const next = Math.min(1.5, Math.max(0.7, +(now * (up ? 1.15 : 0.87)).toFixed(2)));
    if (next === now) return { text: `The headline is already as ${up ? "large" : "small"} as it can go here.` };
    return { patch: { vars: { "--lp-head-adjust": next } }, text: `Done. The headline is ${up ? "larger" : "smaller"} on this component only. Your design system is unchanged.` };
  }

  // Corners.
  if (/square|sharp/.test(t)) return { patch: { vars: { "--lp-radius": "0px" } }, text: "Done. The corners are square on this component." };
  if (/pill|fully round/.test(t)) return { patch: { vars: { "--lp-radius": "999px" } }, text: "Done. Buttons and fields are pill-shaped on this component." };
  if (/\bround(er|ed)?\b|\bsoft(er)?\b/.test(t)) return { patch: { vars: { "--lp-radius": "20px" } }, text: "Done. The corners are rounder on this component." };

  // Colour: the accent, the ink, a hex value, or back to the brand colour.
  const hex = text.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[0];
  const colour = (value, name) => ({
    patch: { vars: { "--lp-primary": value, "--lp-on-primary": readableOn(value) } },
    text: `Done. This component now uses ${name} where it used your primary colour.`,
  });
  if (/brand colou?r|primary colou?r|back to (the )?(brand|primary|default)/.test(t)) {
    return { patch: { vars: { "--lp-primary": undefined, "--lp-on-primary": undefined } }, text: "Done. This component is back on your primary colour." };
  }
  if (hex) return colour(hex.toUpperCase(), `**${hex.toUpperCase()}**`);
  if (/accent/.test(t)) return colour(design.colors.accent, `your accent colour (**${design.colors.accent}**)`);
  if (/\b(dark|ink|black)\b/.test(t)) return colour(design.colors.ink, `your ink colour (**${design.colors.ink}**)`);

  return { text: HELP };
}

export const editGreeting = (item) =>
  `Tell me what to change on **${item.name}**. I can rewrite its text, change its colour or corners, and resize its headline. Changes stay in draft until you publish.`;
