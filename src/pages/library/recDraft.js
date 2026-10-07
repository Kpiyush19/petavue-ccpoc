/* The landing page or ad creative a recommendation arrives with.
   The page is drafted the first time the recommendation is looked at, from
   the workspace's published components, like any page built in chat. It is
   an ordinary draft after that: it opens in the page builder, can be changed
   there, and publishing it is what accepts the recommendation. */
import { useEffect } from "react";
import { buildPage } from "../../mocks/pageBuilder";
import { buildCreative } from "../../mocks/creatives";
import useCreativesStore from "./useCreativesStore";
import useDesignStore from "./useDesignStore";
import useLibraryStore from "./useLibraryStore";
import usePagesStore from "./usePagesStore";

export function ensureDraft(rec) {
  const pages = usePagesStore.getState();
  const existing = pages.pages.find((p) => p.recId === rec.id);
  if (existing) return existing;

  const d = rec.draftPage;
  const built = buildPage(d.prompt, useLibraryStore.getState(), d.templateId);
  if (!built.sections) return null;

  // The form moves up to sit under the hero, and the copy is the ad's.
  const form = built.sections.find((s) => s.sourceId === "lead-form");
  const rest = built.sections.filter((s) => s !== form);
  const heroAt = rest.findIndex((s) => s.sourceId.startsWith("hero"));
  const ordered = form && heroAt >= 0 ? [...rest.slice(0, heroAt + 1), form, ...rest.slice(heroAt + 1)] : built.sections;
  const sections = ordered.map((s) => {
    const copy = s.sourceId.startsWith("hero") ? d.hero : s.sourceId === "lead-form" ? d.form : s.sourceId === "header-simple" ? { button: d.hero.button } : null;
    return copy ? { ...s, overrides: { ...s.overrides, copy: { ...s.overrides.copy, ...copy } } } : s;
  });

  const page = pages.create({ recId: rec.id, recTitle: rec.shortTitle, runReview: !!rec.runReview });
  pages.setSections(page.id, sections, { name: d.name, templateId: built.templateId });
  pages.say(page.id, {
    role: "assistant",
    working: ["Read the recommendation and the ad it is for", ...built.working],
    used: { template: built.used.template, components: sections.map((s) => s.name), reasons: sections.map((s) => ({ name: s.name, why: s.description })) },
    text: d.note,
  });
  return usePagesStore.getState().get(page.id);
}

// The draft for a recommendation, made on first use.
export function useRecDraft(rec) {
  const page = usePagesStore((s) => (rec?.draftPage ? s.pages.find((p) => p.recId === rec.id) : null));
  useEffect(() => {
    if (rec?.draftPage && !page) ensureDraft(rec);
  }, [rec?.id, rec?.draftPage, page]); // eslint-disable-line react-hooks/exhaustive-deps
  return page || null;
}

// The same for an ad creative: made once, from the design system, then an
// ordinary draft that opens in the creative editor.
export function ensureCreativeDraft(rec) {
  const store = useCreativesStore.getState();
  const existing = store.creatives.find((c) => c.recId === rec.id);
  if (existing) return existing;
  const d = rec.draftCreative;
  const { working, text, ...made } = buildCreative(d.prompt, useDesignStore.getState().design, d.picked);
  const creative = store.create({ recId: rec.id });
  store.apply(creative.id, { ...made, name: d.name });
  store.say(creative.id, { role: "assistant", working: ["Read the recommendation and the ad it replaces", ...working], text: d.note });
  return useCreativesStore.getState().get(creative.id);
}

export function useRecCreative(rec) {
  const creative = useCreativesStore((s) => (rec?.draftCreative ? s.creatives.find((c) => c.recId === rec.id) : null));
  useEffect(() => {
    if (rec?.draftCreative && !creative) ensureCreativeDraft(rec);
  }, [rec?.id, rec?.draftCreative, creative]); // eslint-disable-line react-hooks/exhaustive-deps
  return creative || null;
}
