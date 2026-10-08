import { create } from "zustand";

/* The landing pages built in chat.
   A page is a list of section snapshots, the conversation that built it, and
   where it is published. Once a page is published, later changes are held
   back (`unpublished`) until it is published again. A page drafted for a
   recommendation carries `recId`. In memory: it resets on reload, like the
   rest of the mock. */

let seq = 0;

const usePagesStore = create((set, get) => {
  const update = (id, change) => set((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, ...change(p) } : p)) }));

  return {
    pages: [],

    create: (extra = {}) => {
      const page = {
        id: `page-${++seq}`, name: "New page", templateId: null, sections: [], history: [], thread: [],
        status: "draft", unpublished: false, settings: null, meta: {}, ...extra,
      };
      set((s) => ({ pages: [page, ...s.pages] }));
      return page;
    },

    // A new set of sections. `meta` renames the page when it is rebuilt from a template.
    setSections: (id, sections, meta = {}) =>
      update(id, (p) => ({
        ...meta,
        history: p.sections.length ? [...p.history, p.sections] : p.history,
        sections,
        unpublished: p.status === "published",
      })),
    undo: (id) =>
      update(id, (p) => (p.history.length
        ? { sections: p.history[p.history.length - 1], history: p.history.slice(0, -1), unpublished: p.status === "published" }
        : {})),
    say: (id, message) => update(id, (p) => ({ thread: [...p.thread, message] })),

    // The page's own settings (name, access, SEO, Open Graph, tracking,
    // forms). On a live page they wait for the next publish, like any change.
    setMeta: (id, name, meta) => update(id, (p) => ({ name, meta, unpublished: p.status === "published" })),

    // settings: { domain, slug }: where the page is live.
    publish: (id, settings) => update(id, () => ({ status: "published", unpublished: false, settings })),
    // Offline again. The settings are kept, so publishing again starts from them.
    unpublish: (id) => update(id, () => ({ status: "draft", unpublished: false })),
    remove: (id) => set((s) => ({ pages: s.pages.filter((p) => p.id !== id) })),
    get: (id) => get().pages.find((p) => p.id === id),
  };
});

export const pageUrl = (page) => (page.settings ? `${page.settings.domain}/${page.settings.slug}` : null);

export default usePagesStore;
