// The landing-page library: what a workspace can add, and the design system
// its pages are drawn with. Mock data, in memory, like the rest of the demo.
//
// A component's `description` is written for the agent as much as the reader:
// it says when the component should be used. `render` names the section in
// pages/library/sections.jsx that draws it, and `text` lists the pieces of
// copy that can be rewritten in chat.

// The design system a workspace starts with. Everything here can be changed on
// the Design system tab; sections read it through the CSS variables below.
export const DEFAULT_DESIGN = {
  brand: "Meridian",
  logo: null, // a data URL once a logo has been uploaded
  colors: { primary: "#0F766E", ink: "#0F172A", muted: "#5B6676", surface: "#F4F7F6", accent: "#F59E0B" },
  headFont: "Lora",
  bodyFont: "Poppins",
  headSize: 52, // px, the main headline; other headings scale with it
  bodySize: 16, // px, body text; other text scales with it
  radius: 10,
};

export const COLOR_ROLES = [
  { key: "primary", name: "Primary", use: "Buttons, links and highlights" },
  { key: "ink", name: "Ink", use: "Headings and body text" },
  { key: "muted", name: "Muted", use: "Secondary text" },
  { key: "surface", name: "Surface", use: "Section backgrounds" },
  { key: "accent", name: "Accent", use: "Badges and small highlights" },
];

export const SIZE_LIMITS = { headSize: [36, 72], bodySize: [14, 20], radius: [0, 24] };

// Free fonts from Google Fonts, loaded on demand when one is chosen.
export const GOOGLE_FONTS = [
  ...["Inter", "Poppins", "Manrope", "DM Sans", "Work Sans", "Plus Jakarta Sans", "Outfit", "Space Grotesk", "Montserrat",
    "Raleway", "Nunito", "Lato", "Open Sans", "Roboto", "IBM Plex Sans", "Sora", "Figtree"].map((name) => ({ name, kind: "Sans serif" })),
  ...["Lora", "Playfair Display", "Merriweather", "Fraunces", "DM Serif Display", "Libre Baskerville", "Source Serif 4",
    "Crimson Pro", "EB Garamond"].map((name) => ({ name, kind: "Serif" })),
];

export const fontStack = (name) =>
  `'${name}', ${GOOGLE_FONTS.find((f) => f.name === name)?.kind === "Serif" ? "Georgia, serif" : "system-ui, sans-serif"}`;

// Black or white, whichever reads better on the given background colour.
export function readableOn(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#0F172A" : "#FFFFFF";
}

// The CSS variables every section reads, so a page always follows the
// workspace's design system.
export function designVars(design = DEFAULT_DESIGN) {
  const c = design.colors;
  return {
    "--lp-primary": c.primary,
    "--lp-on-primary": readableOn(c.primary),
    "--lp-ink": c.ink,
    "--lp-muted": c.muted,
    "--lp-surface": c.surface,
    "--lp-accent": c.accent,
    "--lp-radius": `${design.radius}px`,
    "--lp-font-head": fontStack(design.headFont),
    "--lp-font-body": fontStack(design.bodyFont),
    "--lp-head-scale": design.headSize / DEFAULT_DESIGN.headSize,
    "--lp-body-scale": design.bodySize / DEFAULT_DESIGN.bodySize,
  };
}

export const CATEGORIES = ["Header", "Hero", "Social proof", "Features", "Pricing", "Forms", "Calculators", "CTA", "Content", "Footer"];

export const COMPONENTS = [
  { id: "header-simple", render: "HeaderSimple", text: ["button"], category: "Header", name: "Header with links",
    description: "Logo, four links and a demo button. Use at the top of every page." },
  { id: "hero-split", render: "HeroSplit", text: ["headline", "lead", "button"], category: "Hero", name: "Hero with product shot",
    description: "Headline and two buttons beside a product image. Use when the page sells the product itself." },
  { id: "hero-demo", render: "HeroDemo", text: ["headline", "lead", "button"], category: "Hero", name: "Hero with demo form",
    description: "Headline and reasons beside a four-field demo form. Use when the only goal is a booked demo." },
  { id: "hero-form", render: "HeroForm", text: ["headline", "lead", "button"], category: "Hero", name: "Hero with email capture",
    description: "Centred headline with an email field. Use when the only goal is a sign-up." },
  { id: "logo-cloud", render: "LogoCloud", text: ["headline"], category: "Social proof", name: "Customer logo strip",
    description: "A row of six customer names. Use directly under the hero." },
  { id: "stats-band", render: "StatsBand", text: [], category: "Social proof", name: "Stats band",
    description: "Four headline numbers on a coloured band. Use when there are results to quote." },
  { id: "testimonial", render: "Testimonial", text: [], category: "Social proof", name: "Single testimonial",
    description: "One long customer quote with name and role. Use before a form or pricing." },
  { id: "feature-grid", render: "FeatureGrid", text: ["headline"], category: "Features", name: "Feature grid, three columns",
    description: "Three short benefits with icons. Use to summarise what the product does." },
  { id: "feature-split", render: "FeatureSplit", text: ["headline", "lead"], category: "Features", name: "Feature with image",
    description: "One feature explained in detail beside an image. Use for the main capability." },
  { id: "pricing-three", render: "PricingThree", text: ["headline"], category: "Pricing", name: "Pricing, three plans",
    description: "Three plans with the middle one highlighted. Use on pricing and launch pages." },
  { id: "lead-form", render: "LeadForm", text: ["headline", "lead", "button"], category: "Forms", name: "Demo request form",
    description: "Four fields beside the reasons to book a demo. Use as the main conversion point." },
  { id: "roi-calculator", render: "RoiCalculator", text: ["headline", "button"], category: "Calculators", name: "ROI calculator",
    description: "Three inputs and a yearly saving. Use for visitors comparing cost against return." },
  { id: "cta-banner", render: "CtaBanner", text: ["headline", "button"], category: "CTA", name: "Call-to-action banner",
    description: "One line and one button on a dark band. Use near the end of a page." },
  { id: "faq", render: "Faq", text: ["headline"], category: "Content", name: "Frequently asked questions",
    description: "Four questions with the first one open. Use to answer objections before the form." },
  { id: "footer-columns", render: "FooterColumns", text: [], category: "Footer", name: "Footer with four columns",
    description: "Logo, four link columns and the legal line. Use at the bottom of every page." },
];

export const TEMPLATES = [
  { id: "tpl-demo", name: "Demo request page",
    description: "For paid campaigns that should end in a booked demo.",
    sections: ["header-simple", "hero-split", "logo-cloud", "feature-grid", "testimonial", "lead-form", "footer-columns"] },
  { id: "tpl-launch", name: "Product launch page",
    description: "For announcing a product or a new plan, with pricing on the page.",
    sections: ["header-simple", "hero-split", "stats-band", "feature-split", "pricing-three", "cta-banner", "footer-columns"] },
  { id: "tpl-roi", name: "ROI calculator page",
    description: "For visitors who need to justify the cost before they talk to sales.",
    sections: ["header-simple", "hero-form", "roi-calculator", "testimonial", "faq", "footer-columns"] },
  { id: "tpl-signup", name: "Sign-up page",
    description: "A short page with one goal: collect an email address.",
    sections: ["header-simple", "hero-form", "logo-cloud", "feature-grid", "footer-columns"] },
];

export const componentById = (id) => COMPONENTS.find((c) => c.id === id);

// What the workspace starts with: enough published components to build a
// page, the template they belong to, and two drafts so both states are on
// screen. A component in a workspace is a copy of a library component: it has
// its own name, description and status, and only published copies are given
// to the agent.
// Everything in a workspace sits in a folder and carries tags. The agent reads
// both, with the name and description, when it chooses what to use.
export const INITIAL_WORKSPACE = {
  components: [
    { sourceId: "header-simple", status: "published", folder: "Shared", tags: ["every page"] },
    { sourceId: "hero-split", status: "published", folder: "Demo campaigns", tags: ["demo", "product"] },
    { sourceId: "hero-demo", status: "published", folder: "Demo campaigns", tags: ["demo", "form"] },
    { sourceId: "hero-form", status: "published", folder: "Launch", tags: ["sign-up"] },
    { sourceId: "logo-cloud", status: "published", folder: "Shared", tags: ["proof"] },
    { sourceId: "feature-grid", status: "published", folder: "Demo campaigns", tags: ["product"] },
    { sourceId: "testimonial", status: "published", folder: "Shared", tags: ["proof"] },
    { sourceId: "lead-form", status: "published", folder: "Demo campaigns", tags: ["demo", "form"] },
    { sourceId: "cta-banner", status: "published", folder: "Shared", tags: [] },
    { sourceId: "footer-columns", status: "published", folder: "Shared", tags: ["every page"] },
    { sourceId: "pricing-three", status: "published", folder: "Launch", tags: ["pricing"] },
    { sourceId: "faq", status: "draft", folder: "Launch", tags: [] },
  ],
  templates: [{ id: "tpl-demo", folder: "Demo campaigns", tags: ["demo", "paid"] }],
};

// "demo, Paid ,  " becomes ["demo", "paid"].
export const parseTags = (value) => [...new Set(String(value || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
