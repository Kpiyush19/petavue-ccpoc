/**
 * In-memory chat store — separate threads, newest first.
 *
 * Threads survive route changes (leaving for a campaign page and coming
 * back) because they live at module scope, not in the page component.
 * They intentionally don't survive a reload: the transcript is a working
 * surface, while approvals/automations persist in the harness mock state.
 */
let seq = 0;
const chats = []; // { id, title, thread, convo }
let activeId = null;

export const chatStore = {
  list: () => chats,
  get: (id) => chats.find((c) => c.id === id) || null,
  activeId: () => activeId,
  setActive: (id) => { activeId = id; },
  create() {
    const c = { id: `c${++seq}`, title: "New chat", thread: [], convo: { branch: null, phase: "start" } };
    chats.unshift(c);
    activeId = c.id;
    return c;
  },
  save(id, { thread, convo }) {
    const c = chats.find((x) => x.id === id);
    if (!c) return;
    c.thread = thread;
    c.convo = convo;
    const firstUser = thread.find((m) => m.role === "user");
    if (firstUser) c.title = firstUser.text;
  },
};
