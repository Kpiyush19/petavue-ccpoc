/* Small shared pieces for the chat-first harness concept pages. */
import { cn } from "../../utils/cn";

/* Markdown-lite: **bold**, blank-line paragraphs, "- " bullets. The scripted
   replies use nothing richer, so this stays tiny instead of pulling a full
   renderer into the page. */
export function Md({ text, className }) {
  if (!text) return null;
  const lines = String(text).split("\n");
  const out = [];
  let bullets = [];
  const flush = (key) => {
    if (!bullets.length) return;
    out.push(
      <ul key={`ul-${key}`} className="flex flex-col gap-1.5 my-1 pl-5 list-disc marker:text-[var(--text-muted)]">
        {bullets.map((b, i) => (
          <li key={i} className="text-[13px] leading-[21px] text-[var(--text-primary)]">{boldify(b)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };
  lines.forEach((ln, i) => {
    if (ln.startsWith("- ")) { bullets.push(ln.slice(2)); return; }
    flush(i);
    if (ln.trim() === "") return;
    out.push(
      <p key={`p-${i}`} className="text-[13px] leading-[21px] text-[var(--text-primary)]">{boldify(ln)}</p>
    );
  });
  flush("end");
  return <div className={cn("flex flex-col gap-2", className)}>{out}</div>;
}

function boldify(s) {
  const parts = String(s).split("**");
  return parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className="font-semibold">{p}</strong> : p));
}

export const fmtMoney = (n) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
};

/* Finding copy shared by the campaign pages — keyed by the ids in the mock. */
export const FINDING_COPY = {
  "audience-leak": {
    title: "Audience leak — $4,210/mo",
    line: "38% of impressions reach non-ICP titles. None of them has converted in 90 days.",
    prompt: "Find where my LinkedIn ads are leaking spend",
  },
  "abm-overlap": {
    title: "ABM overlap — $1,150/mo",
    line: "Double-pays for 214 accounts the Tier-1 ABM campaign already covers.",
    prompt: "Find where my LinkedIn ads are leaking spend",
  },
  "creative-fatigue": {
    title: "Creative fatigue",
    line: "The audience is right; the ads are exhausted. Frequency and CPL are climbing while response falls.",
    prompt: "Fix the Facebook creative fatigue",
  },
  "pause-candidate": {
    title: "Pause candidate — $8.3K/mo",
    line: "$0.31 back per $1 in, −50% week over week. The CRM says these queries never convert.",
    prompt: "Should I pause G_Search_NonBrand_Automation?",
  },
  "tracking-break": {
    title: "Tracking break on the Google account",
    line: "0 reported conversions since Sep 2 while spend and clicks run normally — judge this campaign from the CRM column.",
    prompt: "Why is Google reporting 0 conversions?",
  },
};

/* The per-finding prompt override where the finding sits on a LinkedIn
   retargeting campaign (fatigue there is the LinkedIn flow, not Meta). */
export const findingPrompt = (campaignId, findingId) =>
  findingId === "creative-fatigue" && campaignId === "li-retargeting-dm"
    ? "Find where my LinkedIn ads are leaking spend"
    : FINDING_COPY[findingId]?.prompt;
