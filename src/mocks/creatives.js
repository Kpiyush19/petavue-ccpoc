// Ad creatives: what the agent makes and how it answers when one is edited in
// chat. Scripted, like the rest of the mock, but every reply that claims a
// change returns the change, so the artboard really updates.
//
// A creative has a type (image, carousel or video), a style (professional,
// meme or UGC), a format, and one or more slides. An image has one slide; a
// carousel's slides are its cards; a video's slides are its scenes, each with
// a length in seconds, so a video here is a storyboard that can be played
// through, not a rendered file.
//
// A slide is a set of layers on an artboard, not a flat image, so each layer
// can be picked and changed on its own. Layers sit in a fixed order (logo,
// eyebrow, headline, body, button, image); `dx`/`dy` is how far one has been
// dragged from where the layout puts it. Colours name a role in the design
// system ("primary", "ink"…) or are a hex value, so a creative follows the
// brand until a layer is given a colour of its own.

import { readableOn } from "./library";
import { shorten } from "./pageBuilder";

// LinkedIn and Meta only, at the sizes each platform publishes. `base` is the
// text size, in px, on that artboard.
export const FORMATS = [
  { id: "li-square", platform: "LinkedIn", label: "LinkedIn · Square", size: "1200 × 1200", w: 1200, h: 1200, shape: "square",
    base: { logo: 34, eyebrow: 26, headline: 84, body: 34, cta: 30 } },
  { id: "li-landscape", platform: "LinkedIn", label: "LinkedIn · Landscape", size: "1200 × 628", w: 1200, h: 628, shape: "landscape",
    base: { logo: 26, eyebrow: 19, headline: 54, body: 24, cta: 22 } },
  { id: "li-video", platform: "LinkedIn", label: "LinkedIn · Wide video", size: "1920 × 1080", w: 1920, h: 1080, shape: "landscape",
    base: { logo: 44, eyebrow: 32, headline: 96, body: 42, cta: 38 } },
  { id: "meta-square", platform: "Meta", label: "Meta · Feed", size: "1080 × 1350", w: 1080, h: 1350, shape: "square",
    base: { logo: 32, eyebrow: 25, headline: 80, body: 33, cta: 29 } },
  { id: "meta-story", platform: "Meta", label: "Meta · Story or Reel", size: "1080 × 1920", w: 1080, h: 1920, shape: "story",
    base: { logo: 40, eyebrow: 30, headline: 100, body: 42, cta: 36 } },
];
export const formatById = (id) => FORMATS.find((f) => f.id === id) || FORMATS[0];

export const KINDS = [
  { id: "image", label: "Image", description: "One static image", unit: "slide" },
  { id: "carousel", label: "Carousel", description: "Cards people swipe through, 2 to 10", unit: "card" },
  { id: "video", label: "Video", description: "A storyboard of timed scenes", unit: "scene" },
];
export const kindById = (id) => KINDS.find((k) => k.id === id) || KINDS[0];

// What each style shows and hides, and the background it starts on.
export const STYLES = [
  { id: "professional", label: "Professional", description: "Polished and product-led", bg: "surface", align: "left", hidden: [] },
  { id: "meme", label: "Meme", description: "A caption over a picture, for humour", bg: "white", align: "center", hidden: ["eyebrow", "cta"] },
  { id: "ugc", label: "UGC", description: "A customer's own words, with their photo or clip", bg: "surface", align: "left", hidden: ["eyebrow"] },
];
export const styleById = (id) => STYLES.find((x) => x.id === id) || STYLES[0];

export const MAX_SLIDES = 10;

export const COLOR_CHOICES = [
  { id: "primary", label: "Primary" },
  { id: "ink", label: "Ink" },
  { id: "accent", label: "Accent" },
  { id: "muted", label: "Muted" },
  { id: "surface", label: "Surface" },
  { id: "white", label: "White" },
];

// A role or a hex value, as a hex value.
export const resolveColor = (color, design) => (color === "white" ? "#FFFFFF" : design.colors[color] || color);

// The colour each layer takes on a given background, so text stays readable.
function paletteFor(bg, design) {
  if (bg === "primary") {
    const on = readableOn(design.colors.primary) === "#FFFFFF" ? "white" : "ink";
    return { logo: on, eyebrow: on, headline: on, body: on, cta: on };
  }
  const dark = readableOn(resolveColor(bg, design)) === "#FFFFFF";
  return dark
    ? { logo: "white", eyebrow: "accent", headline: "white", body: "surface", cta: "primary" }
    : { logo: "ink", eyebrow: "primary", headline: "ink", body: "muted", cta: "primary" };
}

export function recolor(layers, bg, design) {
  const palette = paletteFor(bg, design);
  return layers.map((l) => (palette[l.id] ? { ...l, color: palette[l.id] } : l));
}

// What the ad says, by what it is for. No figures or claims are made up: the
// points and the customer quote below are the ones already in the workspace's
// landing-page components.
const BRIEFS = [
  { re: /webinar|event|session|live/, name: "Webinar ad", eyebrow: "Live webinar", headline: "How revenue teams call the quarter early", body: "A 40-minute session with a live forecast review.", cta: "Save your seat" },
  { re: /launch|new feature|announc|release/, name: "Launch ad", eyebrow: "New", headline: "Deal-level risk, now in every forecast", body: "See which deals decide the quarter, and why.", cta: "See what's new" },
  { re: /retarget|remarket|visited|warm|fatigue|refresh/, name: "Retargeting ad", eyebrow: "Still deciding?", headline: "See {brand} on your own pipeline", body: "A 30-minute call. No preparation needed.", cta: "Book a demo" },
  { re: /guide|report|ebook|e-book|download|whitepaper/, name: "Guide ad", eyebrow: "Free guide", headline: "The forecast review, step by step", body: "How revenue teams run the weekly call.", cta: "Get the guide" },
  { re: /./, name: "Demo campaign ad", eyebrow: "Revenue forecasting", headline: "Forecast revenue you can defend", body: "See what will close, what will slip, and why.", cta: "Book a demo" },
];
const POINTS = [
  ["Deal-level risk", "Every open deal gets a likelihood to close and the reason behind it."],
  ["Nightly forecast", "The number updates itself from your CRM, with what changed since yesterday."],
  ["Board-ready report", "One page for finance: commit, best case, and the gap to plan."],
];
const OPENERS = {
  meme: { headline: "When the board asks if you'll hit the number", body: "And the forecast is three spreadsheets and a feeling" },
  ugc: { headline: "“We stopped arguing about whose number was right.”", body: "Dana Reyes, VP Revenue Operations, Calloway" },
};

const LAYER_NAMES = { logo: "Logo", eyebrow: "Eyebrow", headline: "Headline", body: "Supporting text", cta: "Button", image: "Image", background: "Background" };
export const layerName = (id) => LAYER_NAMES[id] || id;

function formatFrom(t) {
  if (/story|stories|reel|vertical/.test(t)) return "meta-story";
  if (/wide video|16:9|widescreen/.test(t)) return "li-video";
  if (/landscape|horizontal|\bwide\b|banner/.test(t)) return "li-landscape";
  if (/meta|facebook|instagram/.test(t)) return "meta-square";
  if (/linkedin|square/.test(t)) return "li-square";
  return null;
}
const kindFrom = (t) => (/carousel|swipe|cards\b/.test(t) ? "carousel" : /video|reel|storyboard/.test(t) ? "video" : /static|single image|one image/.test(t) ? "image" : null);
export const styleFrom = (t) => (/meme|funny|humou?r/.test(t) ? "meme" : /\bugc\b|user.generated|testimonial|customer('s)? (voice|quote|story|words)/.test(t) ? "ugc" : /professional|polished|product-led/.test(t) ? "professional" : null);

// The format a request will be made in: the one chosen, else the one it
// names, else the usual one for that type.
export function formatFor(prompt, formatId = null, kind = null) {
  const t = prompt.toLowerCase();
  const type = kind || kindFrom(t) || "image";
  return formatById(formatId || formatFrom(t) || (type === "video" ? "meta-story" : "li-square"));
}

let slideSeq = 0;
const layer = (id, kind, extra = {}) => ({ id, kind, name: LAYER_NAMES[id], scale: 1, dx: 0, dy: 0, hidden: false, ...extra });

// One slide. copy: { eyebrow, headline, body, cta }; `plain` is a slide with
// no image; `bg` overrides the style's background.
function makeSlide(copy, styleId, design, { plain = false, bg, align, seconds = 3 } = {}) {
  const style = styleById(styleId);
  const ground = bg || style.bg;
  const hide = (id) => style.hidden.includes(id) || !copy[id];
  const layers = recolor([
    layer("logo", "logo"),
    layer("eyebrow", "text", { text: copy.eyebrow || "", font: "body", hidden: hide("eyebrow") }),
    // A quote reads smaller than a headline; a meme's punchline as large as its caption.
    layer("headline", "text", { text: copy.headline, font: "head", scale: styleId === "ugc" ? 0.72 : styleId === "meme" ? 0.9 : 1 }),
    layer("body", "text", { text: copy.body || "", font: "body", hidden: !copy.body, scale: styleId === "meme" ? 2 : 1 }),
    layer("cta", "button", { text: copy.cta || "", font: "body", hidden: hide("cta") }),
    layer("image", "image", { src: null, hidden: plain }),
  ], ground, design);
  return { id: `slide-${++slideSeq}`, bg: ground, align: align || style.align, seconds, layers };
}

// The slides a type needs: one for an image; an opener, the points and a
// closing card for a carousel or a video.
function slidesFor(kind, styleId, brief, design) {
  const say = (line) => line.replace("{brand}", design.brand || "us");
  const opener = makeSlide({ ...brief, headline: say(brief.headline), ...OPENERS[styleId] }, styleId, design);
  if (kind === "image") return [opener];
  const points = POINTS.map(([headline, body], i) => makeSlide({ eyebrow: `0${i + 1}`, headline, body }, styleId, design, { plain: true }));
  const closing = makeSlide({ headline: say(styleId === "professional" ? "See {brand} on your own pipeline" : brief.headline), cta: brief.cta }, "professional", design, { plain: true, bg: "primary", align: "center" });
  return [opener, ...points, closing];
}

const typeNote = {
  image: "",
  carousel: " It has five cards: an opener, three points and a closing card with the button. LinkedIn and Meta both take 2 to 10.",
  video: " This is a storyboard, not a rendered video file: five scenes of 3 seconds each, which you can play through. 15 to 30 seconds is the length LinkedIn recommends.",
};
const styleNote = {
  professional: "",
  meme: " The picture is a placeholder: a meme needs your own image, so upload one on the image layer.",
  ugc: " The quote and name are the ones in your published testimonial. The photo is a placeholder: add the customer's photo or clip on the image layer.",
};

// The first build. `picked` is what was chosen before asking: { format, kind, style }.
// `picked.copy` replaces the opener's words, for a creative drafted to a brief.
export function buildCreative(prompt, design, picked = {}) {
  const t = prompt.toLowerCase();
  const brief = { ...BRIEFS.find((b) => b.re.test(t)), ...picked.copy };
  const kind = picked.kind || kindFrom(t) || "image";
  const style = picked.style || styleFrom(t) || "professional";
  const format = formatFor(prompt, picked.format, kind);
  const slides = slidesFor(kind, style, brief, design);
  const unit = kindById(kind).unit;
  return {
    name: `${brief.name}${kind === "image" ? "" : ` · ${kindById(kind).label.toLowerCase()}`}`,
    kind,
    style,
    format: format.id,
    slides,
    at: 0,
    working: ["Read your design system", `Set up a ${format.label} artboard (${format.size})`, `Wrote the copy and placed ${slides.length === 1 ? "6 layers" : `${slides.length} ${unit}s`}`],
    text: `Here is a first version: a **${style === "ugc" ? "UGC" : styleById(style).label.toLowerCase()} ${kindById(kind).label.toLowerCase()}** for **${format.label}**, in your colours and fonts. I used no figures or claims you haven't given me.${typeNote[kind]}${styleNote[style]}\n\nEvery part is its own layer: click one to change it here or with the tools above it, drag it to move it, or double-click text to type over it.`,
  };
}

// ── What the agent asks before it makes a creative ────────────────────────

const AD_GOALS = {
  demo: { label: "Book a demo", hint: "demo" },
  webinar: { label: "Register for the webinar", hint: "webinar" },
  guide: { label: "Download the guide", hint: "guide" },
};
const AD_AUDIENCES = {
  cold: { label: "People who don't know us yet", hint: "" },
  visited: { label: "People who visited the site", hint: "retargeting" },
  open: { label: "Accounts with an open opportunity", hint: "retargeting" },
};

export function creativeQuestions(prompt) {
  const t = prompt.toLowerCase();
  const goal = /webinar|event|session/.test(t) ? "webinar" : /guide|report|ebook|download/.test(t) ? "guide" : "demo";
  const audience = /retarget|remarket|visited|warm/.test(t) ? "visited" : "cold";
  const options = (map, recommended) => Object.entries(map).map(([id, o]) => ({ id, label: o.label, recommended: id === recommended }));
  return [
    { id: "goal", short: "Goal", question: "What should the ad get people to do?", options: options(AD_GOALS, goal) },
    { id: "audience", short: "For", question: "Who should it speak to?", options: options(AD_AUDIENCES, audience) },
  ];
}

// Three concepts by angle, not three near-copies: what they get, one bold
// line, and a customer's own words.
// The request with the answers folded in. A demo ad to people who already
// know us is a retargeting ad.
export function askWith(prompt, answers) {
  const goal = AD_GOALS[answers.goal?.id];
  const audience = AD_AUDIENCES[answers.audience?.id];
  return `${prompt} ${goal?.hint || ""} ${!goal || goal.hint === "demo" ? audience?.hint || "" : ""}`;
}

export function creativeDirections(prompt, design, picked, answers) {
  const goal = AD_GOALS[answers.goal?.id];
  const audience = AD_AUDIENCES[answers.audience?.id];
  const ask = askWith(prompt, answers);
  const offer = buildCreative(ask, design, { ...picked, style: "professional" });
  const first = offer.slides[0];
  const bold = {
    ...offer,
    slides: [
      { ...first, id: `slide-${++slideSeq}`, bg: "primary", align: "center", layers: recolor(first.layers, "primary", design).map((l) => (l.id === "image" ? { ...l, hidden: true } : l)) },
      ...offer.slides.slice(1).map((sl) => ({ ...sl, id: `slide-${++slideSeq}` })),
    ],
  };
  const proof = buildCreative(ask, design, { ...picked, style: "ugc" });
  const why = [goal && `It asks people to ${goal.label.toLowerCase()}.`, audience && `It speaks to ${audience.label.toLowerCase()}.`].filter(Boolean).join(" ");
  const say = (made, label) => ({ ...made, text: `${made.text.split("\n\n")[0].replace("Here is a first version", `Here is the **${label}** version`)}${why ? ` ${why}` : ""}\n\n${made.text.split("\n\n").slice(1).join("\n\n")}` });
  const warm = answers.audience?.id === "visited" || answers.audience?.id === "open";
  return [
    { id: "offer", label: "Offer", note: "Says what they get, with the product", recommended: !warm, made: say(offer, "Offer") },
    { id: "bold", label: "Bold line", note: "One line on your brand colour", made: say(bold, "Bold line") },
    { id: "proof", label: "Customer proof", note: "A customer's own words", recommended: warm, made: say(proof, "Customer proof") },
  ];
}

const quoted = (text) => (text.match(/["“]([^"”]{2,})["”]/) || text.match(/(?:^|\s)['‘]([^'’]{2,})['’](?=[\s.,]|$)/))?.[1]?.trim();
const afterTo = (text) => text.match(/\b(?:to|say|says|read|reads)\s*:?\s+(.{2,})$/i)?.[1]?.replace(/[.\s]+$/, "").trim();

// Supporting text first: "subheading" contains the word for the headline.
const NAMED = [
  ["background", /background|backdrop|\bbg\b/],
  ["body", /sub-?head(ing|line)?|subtitle|supporting text|description|body|paragraph|bottom caption|attribution/],
  ["eyebrow", /eyebrow|label|tag ?line|small text/],
  ["headline", /headline|heading|title|caption|quote/],
  ["cta", /button|\bcta\b|call to action/],
  ["logo", /logo/],
  ["image", /image|picture|photo|chart|screenshot|product shot|clip/],
];

const COLOR_WORDS = [
  ["primary", /primary|brand colou?r/],
  ["accent", /accent/],
  ["ink", /\b(ink|dark|black|navy)\b/],
  ["white", /\bwhite\b/],
  ["surface", /\b(surface|light)\b/],
  ["muted", /\b(muted|grey|gray)\b/],
];

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const HELP =
  "I can **rewrite** or **shorten** any text, make a layer **bigger** or **smaller**, change a **colour** or the **background**, **hide** or **show** a layer, **centre** the layout, switch the **format**, the **type** (image, carousel, video) or the **style** (professional, meme, UGC), **add** or **remove** a card or scene, or try **another version**. Click a layer first to point me at it.";

// Show and hide what a style calls for, on every slide. The text is kept.
function restyle(slides, styleId, design) {
  const style = styleById(styleId);
  return slides.map((s, i) => {
    const closing = slides.length > 1 && i === slides.length - 1;
    const bg = closing ? s.bg : style.bg;
    const layers = recolor(s.layers, bg, design).map((l) => {
      if (l.id === "eyebrow") return { ...l, hidden: style.hidden.includes("eyebrow") || !l.text };
      if (l.id === "cta") return { ...l, hidden: (style.hidden.includes("cta") && !closing) || !l.text };
      return { ...l, dx: 0, dy: 0 };
    });
    return { ...s, bg, align: closing ? s.align : style.align, layers };
  });
}

// A change to a creative. `creative` is the creative with its current slide's
// bg, align and layers alongside; `targetId` is the layer picked on the
// artboard. Returns { text, change?, action? }: `change` is merged in, its
// bg, align and layers going to the current slide.
export function creativeReply(text, creative, targetId, design) {
  const t = text.trim().toLowerCase();
  const ask = t.split(/["“'‘]/)[0];
  const { layers, slides, at } = creative;
  const unit = kindById(creative.kind).unit;

  if (/\bundo\b|revert (that|it)|go back/.test(t)) {
    return creative.history.length ? { action: "undo", text: "Undone. The creative is back to how it was before the last change." } : { text: "There is nothing to undo yet." };
  }

  // Cards and scenes.
  if (creative.kind !== "image") {
    if (/\b(add|another|new)\b.*\b(slide|card|scene)\b/.test(ask)) {
      if (slides.length >= MAX_SLIDES) return { text: `A ${kindById(creative.kind).label.toLowerCase()} takes up to ${MAX_SLIDES} ${unit}s, and this one is full.` };
      const [headline, body] = POINTS[(slides.length - 1) % POINTS.length];
      const fresh = makeSlide({ eyebrow: `0${slides.length - 1}`, headline, body }, creative.style, design, { plain: true });
      const to = slides.length - 1;
      return { change: { slides: [...slides.slice(0, to), fresh, ...slides.slice(to)], at: to }, text: `Done. I added a ${unit} before the closing one. It is ${unit} ${to + 1} of ${slides.length + 1}.` };
    }
    if (/\b(remove|delete|drop)\b.*\b(slide|card|scene)\b/.test(ask)) {
      if (slides.length <= 2) return { text: `A ${kindById(creative.kind).label.toLowerCase()} needs at least 2 ${unit}s.` };
      return { change: { slides: slides.filter((_, i) => i !== at), at: Math.max(0, at - 1) }, text: `Done. I removed ${unit} ${at + 1}. ${slides.length - 1} are left.` };
    }
    const seconds = creative.kind === "video" && ask.match(/\b(\d{1,2})\s*(s|sec|secs|seconds?)\b/);
    if (seconds) {
      const n = clamp(Number(seconds[1]), 1, 15);
      return { change: { slides: slides.map((s, i) => (i === at ? { ...s, seconds: n } : s)) }, text: `Done. Scene ${at + 1} runs for ${n} seconds. The video is now ${slides.reduce((sum, s, i) => sum + (i === at ? n : s.seconds), 0)} seconds long.` };
    }
  }

  // Another type: image, carousel or video.
  const kind = /\b(make|turn|change|switch|as an?|into)\b/.test(ask) ? kindFrom(ask) : null;
  if (kind) {
    const label = kindById(kind).label.toLowerCase();
    if (kind === creative.kind) return { text: `It is already ${kind === "image" ? "an" : "a"} ${label}.` };
    if (kind === "image") return { change: { kind, slides: [slides[at]], at: 0 }, text: `Done. This is now a single image: I kept the ${unit} you were on and dropped the others.` };
    const brief = { ...BRIEFS[BRIEFS.length - 1], cta: layers.find((l) => l.id === "cta")?.text || "Book a demo" };
    const next = slides.length > 1 ? slides : [slides[0], ...slidesFor(kind, creative.style, brief, design).slice(1)];
    return { change: { kind, slides: next, at: Math.min(at, next.length - 1) }, text: `Done. This is now a ${label} with ${next.length} ${kindById(kind).unit}s.${typeNote[kind]}` };
  }

  // Another style.
  const style = /\b(make|turn|change|switch|style|more|as an?|into)\b/.test(ask) ? styleFrom(ask) : null;
  if (style) {
    const label = styleById(style).label;
    if (style === creative.style) return { text: `It is already in the ${label} style.` };
    return { change: { style, slides: restyle(slides, style, design) }, text: `Done. This is now in the **${label}** style. The words are the same; say if you want them rewritten to fit.${styleNote[style]}` };
  }

  // Another size. Layers keep their text and colours and are laid out again.
  const wanted = /format|size|version for|resize|make (it|this) (a |an )?|for (meta|linkedin|facebook|instagram)|\bas an? /.test(ask) || /^(story|landscape|square)$/.test(t) ? formatFrom(ask) : null;
  if (wanted) {
    const format = formatById(wanted);
    if (wanted === creative.format) return { text: `It is already **${format.label}**.` };
    return {
      change: { format: wanted, slides: slides.map((s) => ({ ...s, layers: s.layers.map((l) => ({ ...l, dx: 0, dy: 0 })) })) },
      text: `Done. This is now **${format.label}** (${format.size}). The layers were laid out again for the new shape, with the same text and colours.`,
    };
  }

  // Another version: the next background, with or without the image.
  if (/another|different|variation|variant|alternative|new version|try again/.test(ask)) {
    const order = ["surface", "primary", "ink"];
    const bg = order[(order.indexOf(creative.bg) + 1) % order.length];
    const centred = bg === "primary";
    const next = recolor(layers, bg, design).map((l) => ({ ...l, dx: 0, dy: 0, hidden: l.id === "image" ? centred : l.hidden }));
    return {
      change: { bg, align: centred ? "center" : "left", layers: next },
      text: centred
        ? "Here is another version: your primary colour as the background, centred, with no image. The words are the same."
        : `Here is another version on your ${bg === "ink" ? "ink" : "surface"} colour, with the image. The words are the same.`,
    };
  }

  if (/\bcent(er|re)(ed|d)?\b/.test(ask) && !/colou?r/.test(ask)) {
    return creative.align === "center" ? { text: "The layout is already centred." } : { change: { align: "center" }, text: "Done. The layout is centred." };
  }
  if (/left.?align|align(ed)? (it |this |everything )?(to the )?left|\bto the left\b/.test(ask)) {
    return creative.align === "left" ? { text: "The layout is already aligned left." } : { change: { align: "left" }, text: "Done. The layout is aligned left." };
  }

  // Which layer this is about: one named in the message, else the one picked.
  const named = NAMED.find(([, re]) => re.test(ask))?.[0];
  const id = named || targetId;
  const hex = text.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[0]?.toUpperCase();
  const colour = hex || COLOR_WORDS.find(([, re]) => re.test(ask))?.[0];
  const colourName = (c) => (c.startsWith("#") ? `**${c}**` : c === "white" ? "white" : `your ${c} colour`);

  if (id === "background") {
    if (!colour) return { text: "Which colour should the background be? Name one from your design system (primary, ink, surface, accent) or give a hex value." };
    return { change: { bg: colour, layers: recolor(layers, colour, design) }, text: `Done. The background is ${colourName(colour)}, and I changed the text colours so everything stays readable.` };
  }
  if (!id) return { text: HELP };

  const target = layers.find((l) => l.id === id);
  const label = `**${target.name}**`;
  const put = (patch) => ({ layers: layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  if (/\b(remove|delete|hide|drop|take out|get rid of)\b/.test(ask)) {
    return target.hidden ? { text: `${label} is already hidden.` } : { change: put({ hidden: true }), gone: true, text: `Done. ${label} is hidden. Ask me to show it again, or switch it back on under the artboard.` };
  }
  if (/\b(show|bring back|restore|unhide|add)\b/.test(ask)) {
    return target.hidden ? { change: put({ hidden: false }), text: `Done. ${label} is back.` } : { text: `${label} is already showing.` };
  }

  if (/bigger|larger|increase|\bgrow\b/.test(ask) || /smaller|reduce|decrease|shrink/.test(ask)) {
    const up = /bigger|larger|increase|\bgrow\b/.test(ask);
    const next = clamp(+(target.scale * (up ? 1.15 : 0.87)).toFixed(2), 0.5, 2);
    if (next === target.scale) return { text: `${label} is already as ${up ? "large" : "small"} as it can go.` };
    return { change: put({ scale: next }), text: `Done. ${label} is ${up ? "larger" : "smaller"}.` };
  }

  if (target.text !== undefined) {
    const words = quoted(text) || (!colour && afterTo(text));
    if (words) return { change: put({ text: words, hidden: false }), text: `Done. ${label} now reads **“${words}”**.` };
    if (/short|trim|tight|concise|fewer words|\bcut\b|brief/.test(ask)) {
      const next = shorten(target.text);
      if (next === target.text) return { text: `${label} is already short. Give me the words you want and I'll use them.` };
      return { change: put({ text: next }), text: `Done. ${label} now reads **“${next}”**. I only cut words; nothing new was added.` };
    }
  }

  if (colour) {
    if (target.kind === "image") return { text: "The image takes its colours from your design system. I can hide it, resize it, or you can replace it with an upload." };
    return { change: put({ color: colour }), text: `Done. ${label} is ${colourName(colour)}.` };
  }

  return {
    text: target.text !== undefined
      ? `For ${label} I can **rewrite** it (give me the words in quotes), **shorten** it, make it **bigger** or **smaller**, change its **colour**, or **hide** it.`
      : `For ${label} I can make it **bigger** or **smaller**, or **hide** it.`,
  };
}

export const CREATIVE_GREETING =
  "Tell me what the ad is for. I can make an image, a carousel or a video storyboard for LinkedIn or Meta, in a professional, meme or UGC style, always in your design system and as layers you can change one at a time.";
