import { create } from "zustand";
import { INITIAL_WORKSPACE, TEMPLATES, componentById } from "../../mocks/library";

/* What this workspace has taken from the library.
   A workspace component is a copy of a library component with its own name,
   description and status. It starts as a draft; only published components are
   given to the agent. Changes made in chat are kept in `overrides` (section
   variables and rewritten copy), with `history` behind them for undo.
   Components and templates each sit in a `folder` and carry `tags`.
   A template is either one taken from the library (`templates`, by id, with
   its folder and tags) or a page saved as one (`saved`, which keeps the
   sections exactly as they were on that page).
   In memory: it resets on reload, like the rest of the mock. */

let seq = 0;
let savedSeq = 0;
const noOverrides = () => ({ vars: {}, copy: {} });
const copyOf = (sourceId, { status = "draft", folder = "", tags = [] } = {}) => {
  const source = componentById(sourceId);
  return {
    uid: `wc-${++seq}`, sourceId, name: source.name, description: source.description, status, folder, tags,
    overrides: noOverrides(), history: [], thread: [],
  };
};

const useLibraryStore = create((set, get) => {
  const update = (uid, change) =>
    set((s) => ({ items: s.items.map((i) => (i.uid === uid ? { ...i, ...change(i) } : i)) }));

  return {
    items: INITIAL_WORKSPACE.components.map((c) => copyOf(c.sourceId, c)),
    templates: INITIAL_WORKSPACE.templates.map((t) => ({ ...t })),
    saved: [],

    addComponent: (sourceId) => {
      const item = copyOf(sourceId);
      set((s) => ({ items: [...s.items, item] }));
      return item;
    },

    // A copy sits next to its original, keeps its look, and starts as a draft.
    duplicate: (uid) => {
      const { items } = get();
      const at = items.findIndex((i) => i.uid === uid);
      if (at < 0) return null;
      const original = items[at];
      const copy = {
        ...original,
        uid: `wc-${++seq}`,
        name: `${original.name} (copy)`,
        status: "draft",
        tags: [...original.tags],
        overrides: { vars: { ...original.overrides.vars }, copy: { ...original.overrides.copy } },
        history: [],
        thread: [],
      };
      set({ items: [...items.slice(0, at + 1), copy, ...items.slice(at + 1)] });
      return copy;
    },

    setStatus: (uid, status) => update(uid, () => ({ status })),
    // details: any of { name, description, folder, tags }
    updateDetails: (uid, details) => update(uid, () => details),
    remove: (uid) => set((s) => ({ items: s.items.filter((i) => i.uid !== uid) })),

    // A change made in chat. The component goes back to draft: the change is
    // not given to the agent until it is published again.
    applyEdit: (uid, patch) =>
      update(uid, (i) => ({
        history: [...i.history, i.overrides],
        overrides: { vars: { ...i.overrides.vars, ...patch.vars }, copy: { ...i.overrides.copy, ...patch.copy } },
        status: "draft",
      })),
    undoEdit: (uid) =>
      update(uid, (i) => (i.history.length ? { overrides: i.history[i.history.length - 1], history: i.history.slice(0, -1), status: "draft" } : {})),
    resetEdits: (uid) => update(uid, (i) => ({ history: [...i.history, i.overrides], overrides: noOverrides(), status: "draft" })),
    say: (uid, message) => update(uid, (i) => ({ thread: [...i.thread, message] })),

    // A template needs its sections, so any the workspace lacks are added as
    // drafts. Returns how many were added.
    addTemplate: (id) => {
      const { items, templates } = get();
      const sections = TEMPLATES.find((t) => t.id === id)?.sections || [];
      const missing = sections.filter((sourceId) => !items.some((i) => i.sourceId === sourceId));
      set({
        templates: templates.some((t) => t.id === id) ? templates : [...templates, { id, folder: "", tags: [] }],
        items: [...items, ...missing.map((sourceId) => copyOf(sourceId))],
      });
      return missing.length;
    },
    // A page saved as a template: { name, description, folder, tags } and the
    // page's sections as they stand.
    saveTemplate: (details, sections) => {
      const template = {
        id: `tpl-saved-${++savedSeq}`,
        ...details,
        sections: sections.map((s) => s.sourceId),
        snapshots: sections.map((s) => ({ sourceId: s.sourceId, name: s.name, overrides: { vars: { ...s.overrides.vars }, copy: { ...s.overrides.copy } } })),
      };
      set((s) => ({ saved: [...s.saved, template] }));
      return template;
    },
    updateTemplate: (id, details) =>
      set((s) => ({
        templates: s.templates.map((t) => (t.id === id ? { ...t, folder: details.folder, tags: details.tags } : t)),
        saved: s.saved.map((t) => (t.id === id ? { ...t, ...details } : t)),
      })),
    removeTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id), saved: s.saved.filter((t) => t.id !== id) })),
  };
});

/* Every template the workspace can use: the ones taken from the library, with
   the folder and tags given to them here, then the pages saved as templates.
   Takes the store's state, so it also works on a snapshot outside React. */
export function workspaceTemplates(state) {
  const taken = state.templates
    .map((t) => ({ ...TEMPLATES.find((x) => x.id === t.id), folder: t.folder, tags: t.tags }))
    .filter((t) => t.name);
  return [...taken, ...state.saved.map((t) => ({ ...t, saved: true }))];
}

// The folders in use, in the order they first appear.
export const foldersOf = (list) => [...new Set(list.map((x) => x.folder).filter(Boolean))];

export default useLibraryStore;
