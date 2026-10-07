import { create } from "zustand";

/* The ad creatives made in chat.
   A creative has a type, a style, a format and its slides (one for an image,
   the cards of a carousel, the scenes of a video), with the conversation that
   made it. `at` is the slide on screen. Every change keeps the state before
   it, so it can be undone from chat or the toolbar. A creative drafted for a
   recommendation carries `recId`. In memory: resets on reload. */

let seq = 0;
const snapshotOf = (c) => ({ kind: c.kind, style: c.style, format: c.format, slides: c.slides, at: c.at });
const SLIDE_KEYS = ["bg", "align", "layers"];

// A creative with its current slide's bg, align and layers alongside, which
// is what the artboard draws and the chat replies read.
export const flat = (creative, at = creative.at) => ({ ...creative, ...creative.slides[at] });

const useCreativesStore = create((set, get) => {
  const update = (id, change) => set((s) => ({ creatives: s.creatives.map((c) => (c.id === id ? { ...c, ...change(c) } : c)) }));
  const onSlide = (c, patch) => c.slides.map((s, i) => (i === c.at ? { ...s, ...patch(s) } : s));

  return {
    creatives: [],

    create: (extra = {}) => {
      const creative = {
        id: `creative-${++seq}`, name: "New creative", kind: "image", style: "professional", format: "li-square",
        slides: [], at: 0, history: [], thread: [], status: "draft", ...extra,
      };
      set((s) => ({ creatives: [creative, ...s.creatives] }));
      return creative;
    },

    // change: any of { name, kind, style, format, slides, at } for the
    // creative, and { bg, align, layers } for the slide on screen. A change
    // moves an approved creative back to draft.
    apply: (id, change) =>
      update(id, (c) => {
        const whole = Object.fromEntries(Object.entries(change).filter(([k]) => !SLIDE_KEYS.includes(k)));
        const part = Object.fromEntries(Object.entries(change).filter(([k]) => SLIDE_KEYS.includes(k)));
        const next = { ...c, ...whole };
        return {
          ...whole,
          slides: Object.keys(part).length ? onSlide(next, () => part) : next.slides,
          history: c.slides.length ? [...c.history, snapshotOf(c)] : c.history,
          status: "draft",
        };
      }),
    // One layer of the slide on screen. `record: false` is for the steps of a
    // drag, which are recorded once when the drag starts.
    patchLayer: (id, layerId, patch, { record = true } = {}) =>
      update(id, (c) => ({
        slides: onSlide(c, (s) => ({ layers: s.layers.map((l) => (l.id === layerId ? { ...l, ...patch } : l)) })),
        history: record ? [...c.history, snapshotOf(c)] : c.history,
        status: "draft",
      })),
    checkpoint: (id) => update(id, (c) => ({ history: [...c.history, snapshotOf(c)] })),
    // Looking at another slide is not a change, so it is not recorded.
    goto: (id, at) => update(id, (c) => ({ at: Math.min(c.slides.length - 1, Math.max(0, at)) })),
    undo: (id) => update(id, (c) => (c.history.length ? { ...c.history[c.history.length - 1], history: c.history.slice(0, -1), status: "draft" } : {})),
    say: (id, message) => update(id, (c) => ({ thread: [...c.thread, message] })),
    approve: (id) => update(id, () => ({ status: "approved" })),
    get: (id) => get().creatives.find((c) => c.id === id),
  };
});

export default useCreativesStore;
