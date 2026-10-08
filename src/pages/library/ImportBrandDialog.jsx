/* Import a design system from a website.
   Three steps in one dialog: where the site is, the reading of it, and what
   was found, shown on a sample section before anything is applied. The
   reading is scripted, like the rest of the mock: what comes back depends on
   the address, so the same site always gives the same brand. */
import { useEffect, useState } from "react";
import { CheckCircle, CircleNotch, Globe } from "@phosphor-icons/react";
import { Dialog, TextInput } from "@/ui";
import { COLOR_ROLES, designVars, fontStack } from "../../mocks/library";
import { ScaledPreview, Section } from "./parts";
import useDesignStore, { loadFont } from "./useDesignStore";

// What a site can come back as. The first is Petavue's own brand.
const FOUND = [
  { colors: { primary: "#3661ED", ink: "#232532", muted: "#757A97", surface: "#F5F8FF", accent: "#08BD50" }, headFont: "Poppins", bodyFont: "Manrope", radius: 8 },
  { colors: { primary: "#0B5FFF", ink: "#0A1F44", muted: "#5A6B85", surface: "#F3F7FF", accent: "#FFB020" }, headFont: "Sora", bodyFont: "Inter", radius: 12 },
  { colors: { primary: "#E4572E", ink: "#1B1B1F", muted: "#66666E", surface: "#FBF6F2", accent: "#17BEBB" }, headFont: "Fraunces", bodyFont: "DM Sans", radius: 6 },
  { colors: { primary: "#0E9F6E", ink: "#111827", muted: "#6B7280", surface: "#F3FAF7", accent: "#F59E0B" }, headFont: "Space Grotesk", bodyFont: "Work Sans", radius: 14 },
  { colors: { primary: "#111827", ink: "#111827", muted: "#6B7280", surface: "#F7F7F8", accent: "#2563EB" }, headFont: "Plus Jakarta Sans", bodyFont: "Plus Jakarta Sans", radius: 20 },
];

const STEPS = [
  "Opening the homepage",
  "Reading colours from buttons, links and backgrounds",
  "Reading fonts and text sizes",
  "Measuring corners and spacing",
  "Finding the logo, header and footer",
];
// What on the site matched a Library component, and how it will be restyled.
const MATCHED = ["Header with links", "Hero with product shot", "Call-to-action banner", "Footer with four columns"];

const hostOf = (url) => url.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0].toLowerCase();
const nameFrom = (host) => { const word = host.split(".")[0] || ""; return word ? word[0].toUpperCase() + word.slice(1) : ""; };
function readSite(host) {
  if (host.includes("petavue")) return FOUND[0];
  let h = 0;
  for (const ch of host) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return FOUND[1 + (h % (FOUND.length - 1))];
}

export default function ImportBrandDialog({ onClose, onApplied }) {
  const current = useDesignStore((s) => s.design);
  const setDesign = useDesignStore((s) => s.setDesign);
  const [step, setStep] = useState("form"); // form | reading | review
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(0);

  const host = hostOf(url);
  const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host);
  const found = valid ? readSite(host) : null;
  const brand = company.trim() || nameFrom(host);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The reading: one line ticks off at a time, then the review opens.
  useEffect(() => {
    if (step !== "reading") return undefined;
    if (done >= STEPS.length) { const t = setTimeout(() => setStep("review"), 450); return () => clearTimeout(t); }
    const t = setTimeout(() => setDone((n) => n + 1), 620);
    return () => clearTimeout(t);
  }, [step, done]);

  const start = () => {
    setTried(true);
    if (!valid) return;
    loadFont(found.headFont);
    loadFont(found.bodyFont);
    setDone(0);
    setStep("reading");
  };
  const apply = () => {
    setDesign({ brand, colors: { ...found.colors }, headFont: found.headFont, bodyFont: found.bodyFont, radius: found.radius });
    onApplied(brand, host);
  };

  const confirm = step === "form" ? start : step === "review" ? apply : () => {};
  const candidate = found && { ...current, ...found, brand };

  return (
    <div className="lib-dialog__scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Import from your website" onClick={(e) => e.stopPropagation()}>
        <Dialog
          size="lg"
          title="Import from your website"
          cancelLabel={step === "review" ? "Back" : "Cancel"}
          confirmLabel={step === "form" ? "Read my website" : step === "reading" ? "Reading…" : "Apply to design system"}
          onClose={onClose}
          onCancel={step === "review" ? () => setStep("form") : onClose}
          onConfirm={confirm}
          className="lib-dialog lib-dialog--form lib-dialog--publish lib-import"
        >
          {step === "form" && (
            <>
              <p className="lib-import__lead">
                Petavue opens your homepage and reads your colours, fonts, corners and logo, so pages and ad creatives match your brand from the first draft.
              </p>
              <TextInput
                label="Website address"
                placeholder="yourcompany.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && start()}
                error={tried && !valid}
                errorMessage="Enter an address like yourcompany.com."
                autoFocus
              />
              <TextInput label="Company name" placeholder={nameFrom(host) || "Your company"} value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === "Enter" && start()} />
              <p className="lib-publish__note">Nothing changes until you have seen what was found and applied it.</p>
            </>
          )}

          {step === "reading" && (
            <div className="lib-import__reading">
              <span className="lib-import__site"><Globe size={14} /> {host}</span>
              <ul className="lib-import__steps">
                {STEPS.map((label, i) => (
                  <li key={label} className={i < done ? "lib-import__step lib-import__step--done" : i === done ? "lib-import__step lib-import__step--now" : "lib-import__step"}>
                    {i < done ? <CheckCircle size={16} weight="fill" /> : <CircleNotch size={16} className={i === done ? "lib-import__spin" : ""} />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === "review" && (
            <div className="lib-import__review">
              <div className="lib-import__found">
                <span className="lib-import__site"><Globe size={14} /> Found on {host}</span>

                <div className="lib-import__block">
                  <span className="lib-import__label">Colours</span>
                  <ul className="lib-import__colors">
                    {COLOR_ROLES.map((r) => (
                      <li key={r.key}>
                        <span className="lib-import__chip" style={{ background: found.colors[r.key] }} />
                        <span className="lib-import__role">{r.name}</span>
                        <span className="lib-import__hex">{found.colors[r.key]}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lib-import__block">
                  <span className="lib-import__label">Typography</span>
                  <span className="lib-import__font" style={{ fontFamily: fontStack(found.headFont) }}>{found.headFont} <i>headings</i></span>
                  <span className="lib-import__font lib-import__font--body" style={{ fontFamily: fontStack(found.bodyFont) }}>{found.bodyFont} <i>body text</i></span>
                </div>

                <div className="lib-import__block">
                  <span className="lib-import__label">Corners and buttons</span>
                  <span className="lib-import__button" style={{ background: found.colors.primary, borderRadius: found.radius }}>Button · {found.radius}px corners</span>
                </div>

                <div className="lib-import__block">
                  <span className="lib-import__label">Matched to your Library</span>
                  <p className="lib-dialog__hint lib-dialog__hint--flush">{MATCHED.join(", ")}. They keep their layout and take on this brand.</p>
                </div>
              </div>

              <div className="lib-import__sample">
                <span className="lib-import__label">How a page will look as {brand}</span>
                <div className="lib-import__frame">
                  <ScaledPreview height={330}>
                    <div style={designVars(candidate)}>
                      <Section item={{ sourceId: "hero-split", overrides: { vars: {}, copy: { lead: `${brand} reads your pipeline every night and tells you what will close, what will slip, and why.` } } }} />
                      <Section id="cta-banner" />
                    </div>
                  </ScaledPreview>
                </div>
                <p className="lib-dialog__hint lib-dialog__hint--flush">Your logo, text sizes and anything you change later stay editable on the Design system tab.</p>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
}
