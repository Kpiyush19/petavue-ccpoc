/**
 * Home — one box, and the three things most worth a decision.
 *
 * A short greeting, one "Ask anything" composer, and three prompts under it:
 * build a dashboard, build a landing page, generate an ad creative. Below,
 * the top three recommendations as cards, each showing what it would change;
 * the rest live on the Recommendations page. Nothing else is on this page.
 *
 * Under the text box, Output says what the chat should make. Auto leaves it
 * to Sage. Landing page and Ad creative open in place: Home becomes the chat
 * on the left and the page or artboard on the right, without leaving Home.
 * A dashboard is built in the Sage chat.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowRight, ArrowUp, Eye, FileText, ImageSquare, Layout, Lightning, Note, Palette, Paperclip, Rows, SlidersHorizontal, Sparkle, SquaresFour,
  Warning, X,
} from "@phosphor-icons/react";
import SourceIcon from "../../components/SourceIcon";
import { Button, ModelModeMenu, Tooltip, readSageMode } from "@/ui";
import { apiGet, apiPost } from "../../api";
import { FORMATS, KINDS, STYLES } from "../../mocks/creatives";
import { ROI_PROMPT, ROI_REPORT_SESSION_ID } from "../../mocks/paidMediaRoi";
import { platformOf } from "../../mocks/agentWorkflows";
import useDesignStore from "../library/useDesignStore";
import useLibraryStore, { workspaceTemplates } from "../library/useLibraryStore";
import CreativeEditorPage from "../library/CreativeEditorPage";
import PageBuilderPage from "../library/PageBuilderPage";
import ComposerMenu from "./ComposerMenu";
import { cn } from "../../utils/cn";
import HarnessChat from "./HarnessChat";
import { chatStore } from "./chatStore";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ── Tiny in-card drawings (pure SVG, no chart lib) ─────────────────── */
const URGENCY = {
  "act-now": { label: "Act now", icon: Lightning, tone: "text-[#e11d48] bg-[#fff1f2]" },
  "this-week": { label: "This week", icon: Warning, tone: "text-[#b45309] bg-[#fffbeb]" },
  monitor: { label: "This month", icon: Eye, tone: "text-[#1d4ed8] bg-[#eff6ff]" },
};

// What a recommendation is about, said with the same icons the prompts use.
// A change to a campaign setting has no deliverable, so it gets its own.
const MAKES = {
  dashboard: { label: "Dashboard", icon: SquaresFour },
  report: { label: "Report", icon: FileText },
  memo: { label: "Memo", icon: Note },
  landing: { label: "Landing page", icon: Layout },
  creative: { label: "Ad creative", icon: ImageSquare },
  change: { label: "Campaign change", icon: SlidersHorizontal },
};
const kindOf = (rec) =>
  rec.draftPage ? "landing" : rec.draftCreative ? "creative" : rec.workflowId === "paid-media-roi" ? "dashboard" : rec.type === "handoff" ? "memo" : "change";

/* One recommendation as a card. Every recommendation has the same parts,
   whether it changes a budget, a list or a page: what kind of thing it is,
   what it says and why, then how soon and where. The card opens it on the
   Recommendations page. */
function RecCard({ rec, onOpen }) {
  const u = URGENCY[rec.urgency] || URGENCY.monitor;
  const kind = MAKES[kindOf(rec)];
  const channel = rec.platform ? platformOf(rec.platform).label : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col gap-3 p-5 rounded-2xl border border-solid border-[var(--color-grey-100)] bg-white cursor-pointer text-left transition-[box-shadow,border-color] hover:border-[var(--color-grey-200)] hover:shadow-[0_10px_28px_-16px_rgba(16,24,40,0.28)]"
    >
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
        <kind.icon size={15} className="text-primary-500" /> {kind.label}
      </span>

      <span className="flex flex-col gap-1.5">
        <span className="text-[14px] leading-[20px] font-medium text-[var(--text-primary)] line-clamp-2">{rec.title}</span>
        <span className="text-[12px] leading-[18px] text-[var(--text-secondary)] line-clamp-2">{rec.basis}</span>
      </span>

      <span className="mt-auto flex items-center justify-between gap-2 pt-3 border-solid border-x-0 border-b-0 border-t border-t-[var(--color-grey-100)]">
        <span className={cn("inline-flex items-center gap-1 h-[22px] px-2 rounded-md text-[12px] font-medium", u.tone)}>
          <u.icon size={12} /> {u.label}
        </span>
        {channel && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <SourceIcon name={channel} size={13} /> {channel}
          </span>
        )}
      </span>
    </button>
  );
}

/* The same recommendation as a table row, for the list view: one column per
   part, so several can be compared down the page. */
const LIST_COLS = "168px minmax(0,1fr) 150px 116px 24px";
function RecRow({ rec, onOpen }) {
  const u = URGENCY[rec.urgency] || URGENCY.monitor;
  const kind = MAKES[kindOf(rec)];
  const channel = rec.platform ? platformOf(rec.platform).label : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid w-full items-center gap-4 min-h-[60px] px-4 py-2.5 border-solid border-x-0 border-b-0 border-t border-t-[var(--color-grey-100)] bg-white cursor-pointer text-left transition-colors hover:bg-[var(--color-grey-50)]"
      style={{ gridTemplateColumns: LIST_COLS }}
    >
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
        <kind.icon size={15} className="text-primary-500" /> {kind.label}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[14px] leading-[20px] font-medium text-[var(--text-primary)]">{rec.title}</span>
        <span className="truncate text-[12px] leading-[18px] text-[var(--text-secondary)]">{rec.basis}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 min-w-0 text-[12px] text-[var(--text-secondary)]">
        {channel && <><SourceIcon name={channel} size={13} /> <span className="truncate">{channel}</span></>}
      </span>
      <span>
        <span className={cn("inline-flex items-center gap-1 h-[22px] px-2 rounded-md text-[12px] font-medium", u.tone)}>
          <u.icon size={12} /> {u.label}
        </span>
      </span>
      <ArrowRight size={13} className="text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

// How the recommendations are laid out, remembered between visits.
const VIEW_KEY = "home-recs-view";
const storedView = () => { try { return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid"; } catch { return "grid"; } };

const OUTPUTS = [
  { id: "auto", label: "Auto", description: "Chat, dashboards and answers, from your request", icon: Sparkle },
  { id: "landing", label: "Landing page", description: "Built from your published components", icon: Layout },
  { id: "creative", label: "Ad creative", description: "For LinkedIn and Meta, in your design system", icon: ImageSquare },
];

const PLACEHOLDER = {
  auto: "Ask anything…",
  landing: "Describe the page you want…",
  creative: "Describe the ad you want…",
};

const FORMAT_OPTIONS = [
  { id: "auto", label: "Auto", description: "The usual size for the type" },
  ...FORMATS.map((f) => ({ id: f.id, label: f.label, description: f.size })),
];
const KIND_OPTIONS = KINDS.map(({ id, label, description }) => ({ id, label, description }));
const STYLE_OPTIONS = STYLES.map(({ id, label, description }) => ({ id, label, description }));

// Prompts under the box, in place of /new's ready-made skills: a spread of
// what can be built, two of each. `text` is what is sent.
const PROMPTS = [
  { kind: "dashboard", label: "Paid channel ROI dashboard", text: "Which paid channels drive revenue?" },
  { kind: "landing", label: "Demo page for the Q4 campaign", text: "Build a landing page for our Q4 demo campaign" },
  { kind: "creative", label: "LinkedIn carousel for the demo offer", text: "Make a LinkedIn carousel ad creative for our Q4 demo campaign" },
  { kind: "report", label: "Monthly paid media report", text: "Write the monthly paid media report" },
  { kind: "landing", label: "Webinar sign-up page", text: "Build a page that collects sign-ups for the autumn webinar" },
  { kind: "creative", label: "Retargeting ad for site visitors", text: "Make an ad creative for retargeting site visitors" },
  { kind: "dashboard", label: "Pipeline coverage dashboard", text: "Build a pipeline coverage dashboard" },
  { kind: "report", label: "Spend reallocation plan", text: "Write a spend reallocation plan" },
];

const greetingOf = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

export default function HarnessHomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  // The model the chat runs on, and files attached to the request. Both are
  // the Sage home's controls; in the prototype they are carried, not used.
  const [sageMode, setSageMode] = useState(readSageMode);
  const [files, setFiles] = useState([]);
  const [recView, setRecView] = useState(storedView);
  const pickView = (v) => { setRecView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* the choice still holds for this visit */ } };
  const fileRef = useRef(null);

  // Separate chats: each ask starts its own thread, all held in chatStore
  // (module scope — survives leaving for a campaign page). The page keeps
  // the ACTIVE thread as state and mirrors every turn back into the store.
  const [activeChatId, setActiveChatId] = useState(null);
  const [thread, setThread] = useState([]);
  const [convo, setConvo] = useState({ branch: null, phase: "start" });
  const pendingSeed = useRef(null);
  const chatOpen = !!activeChatId;
  // The page or creative being made in place: { type, id, prompt, ... }.
  const [canvas, setCanvas] = useState(null);
  const canvasRef = useRef(null);
  useEffect(() => { canvasRef.current = canvas; }, [canvas]);

  // What the chat is asked to make, and for a landing page, from which template.
  const [output, setOutput] = useState("auto");
  const [templateId, setTemplateId] = useState("auto");
  const [formatId, setFormatId] = useState("auto");
  const [kindId, setKindId] = useState("image");
  const [styleId, setStyleId] = useState("professional");
  const library = useLibraryStore();
  const brand = useDesignStore((s) => s.design.brand);
  const templateOptions = [
    { id: "auto", label: "Auto", description: "Sage picks the one that fits" },
    ...workspaceTemplates(library).map((t) => ({ id: t.id, label: t.name, description: t.folder ? `${t.folder} · ${t.description}` : t.description })),
  ];

  const { data } = useQuery({ queryKey: ["harness-overview"], queryFn: () => apiGet("/api/harness/overview") });
  const { data: recData } = useQuery({ queryKey: ["recommendations"], queryFn: () => apiGet("/api/recommendations") });

  // Typing, a chip or a finding row starts a NEW chat; recent rows reopen one.
  const openChatWith = (text) => {
    const c = chatStore.create();
    setThread([]);
    setConvo({ branch: null, phase: "start" });
    pendingSeed.current = text;
    setActiveChatId(c.id);
  };


  // Campaign pages send "Fix in chat" over via router state. location.key
  // dedupes it per navigation, so re-renders don't re-send the prompt.
  // A bare /home navigation (sidebar "Home" while in the thread) closes the
  // chat — the thread has no header of its own, the rail is the way out.
  const consumedSeed = useRef(null);
  const chatOpenRef = useRef(false);
  useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);
  useEffect(() => {
    const seed = location.state?.seed;
    if (seed && consumedSeed.current !== location.key) {
      consumedSeed.current = location.key;
      openChatWith(seed);
    } else if (!seed && (chatOpenRef.current || canvasRef.current)) {
      setActiveChatId(null);
      setCanvas(null);
      // Approvals change the findings — refetch so Home shows the closed loop.
      qc.invalidateQueries({ queryKey: ["harness-overview"] });
    }
  }, [location.key]);

  // Every turn is mirrored into the store, so a thread survives leaving for
  // a campaign page and shows up under the recent-chats rows.
  useEffect(() => {
    if (activeChatId) chatStore.save(activeChatId, { thread, convo });
  }, [activeChatId, thread, convo]);

  // Seed is sent by the chat itself once mounted (it owns send/state).
  const seedRef = useRef(null);
  useEffect(() => {
    if (chatOpen && pendingSeed.current && seedRef.current) {
      const text = pendingSeed.current;
      pendingSeed.current = null;
      seedRef.current(text);
    }
  }, [chatOpen, thread.length]);

  // A landing page is built here, from the workspace's library.
  const startPage = (text, picked = true) =>
    setCanvas({ type: "page", id: "new", prompt: text, templateId: picked && templateId !== "auto" ? templateId : null });

  // An ad creative is made in its own screen, as layers on an artboard.
  const startCreative = (text, picked = true) => setCanvas({
    type: "creative", id: "new", prompt: text,
    format: picked && formatId !== "auto" ? formatId : null, kind: picked ? kindId : null, style: picked ? styleId : null,
  });

  // A dashboard is built in the Sage workspace chat. As on the Sage home, the
  // demo answers one question, so that question is what is sent.
  const startDashboard = async () => {
    const state = { initialMessage: ROI_PROMPT, initialFiles: null };
    try {
      const created = await apiPost("/api/sessions", {});
      const sid = created?.session?.session_id;
      if (!sid) throw new Error("no session id");
      navigate(`/chat/${sid}`, { state });
    } catch {
      navigate(`/chat/${ROI_REPORT_SESSION_ID}`, { state });
    }
  };

  // A row names its own kind, whatever the Output menu says. A row that
  // matches the chosen output keeps the template or format picked under it.
  const go = (row) => {
    if (row.kind === "dashboard" || row.kind === "report") return startDashboard();
    if (row.kind === "landing") return startPage(row.text, output === "landing");
    if (row.kind === "creative") return startCreative(row.text, output === "creative");
    return openChatWith(row.text);
  };


  const start = (text) => {
    if (output === "landing") return startPage(text);
    if (output === "creative") return startCreative(text);
    // On Auto, Sage picks the output from the request. A dashboard is not an
    // output of its own: asking for one is just a chat that builds one.
    if (/\blanding page\b/i.test(text)) return startPage(text, false);
    if (/\bad creatives?\b/i.test(text)) return startCreative(text, false);
    if (/\bdashboards?\b|\breports?\b|which paid channels/i.test(text)) return startDashboard();
    return openChatWith(text);
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessage("");
    start(trimmed);
  };

  if (canvas) {
    const embedded = { ...canvas, onId: (id) => setCanvas((c) => (c ? { ...c, id } : c)), onBack: () => setCanvas(null) };
    return (
      <div className="h-full w-full">
        {canvas.type === "page" ? <PageBuilderPage embedded={embedded} /> : <CreativeEditorPage embedded={embedded} />}
      </div>
    );
  }

  if (chatOpen) {
    // Just the thread — no app chrome, like any AI chat. The sidebar's Home
    // item brings you back (and refetches, so fixes show as closed).
    return (
      <div className="flex flex-col h-full w-full bg-white">
        <HarnessChat
          thread={thread} setThread={setThread} convo={convo} setConvo={setConvo}
          registerSend={(fn) => { seedRef.current = fn; }}
          onMake={(type, text) => (type === "page" ? startPage(text, false) : startCreative(text, false))}
        />
      </div>
    );
  }

  // The first six still waiting for a decision, in the order the
  // Recommendations page lists them.
  const open = (recData?.items || []).filter((r) => r.lifecycle === "needs-decision");
  const top = open.slice(0, 6);

  return (
    <div className="flex h-full w-full overflow-x-auto">
      <div className="flex flex-col h-full w-full min-w-[960px] overflow-y-auto bg-grey-50">
        <div className="flex flex-col shrink-0 w-full max-w-[1040px] min-h-full mx-auto px-8 pb-10">

          {/* The Sage home's layout (/new): greeting, one line on what the
              box is for, the composer, then prompts where /new has skills. */}
          {/* Centred in the page. It leaves room at the bottom of the window
              for the recommendations' heading and about half of each card,
              so there is plainly more to scroll to. */}
          <div className="flex shrink-0 flex-col items-center justify-center min-h-[calc(100vh-156px)] py-12">

          <motion.div {...fadeUp(0)} className="flex flex-col items-center gap-2 mb-7 text-center">
            <div className="flex items-center justify-center gap-3">
              <Sparkle size={30} weight="fill" className="text-primary-500" />
              <h1 className="m-0 text-[34px] leading-[44px] font-medium text-[#232532] tracking-[-0.015em]">
                {greetingOf()}{data?.greetingName ? `, ${data.greetingName}` : ""}.
              </h1>
            </div>
            <p className="m-0 text-[16px] leading-[24px] text-[var(--text-secondary)]">
              Ask anything about your marketing performance, or start by building something.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.05)} className="w-full max-w-[720px]">
            {/* One grey frame: the white box holds the request, the tray under it holds how it's built. */}
            <div
              className="flex flex-col p-1 rounded-[22px] bg-[var(--color-grey-100)]"
              style={{ boxShadow: "0px 18px 40px -20px rgba(54,97,237,0.18)" }}
            >
            <div className="flex flex-col bg-white border border-solid border-[#d4d9ea] rounded-[18px] transition-colors hover:border-primary-300 focus-within:!border-primary-500">
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-5 pt-4">
                  {files.map((f) => (
                    <span key={f.name} className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-lg bg-[var(--color-grey-50)] border border-solid border-[var(--color-grey-100)] text-[12px] text-[var(--text-secondary)]">
                      <span className="truncate max-w-[160px]">{f.name}</span>
                      <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((all) => all.filter((x) => x !== f))} className="flex items-center justify-center w-5 h-5 rounded border-none bg-transparent cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={PLACEHOLDER[output]}
                rows={3}
                autoFocus
                className="w-full resize-none border-none outline-none bg-transparent px-5 pt-4 pb-1 text-[15px] leading-[22px] text-[var(--text-primary)] placeholder:text-[#adb2ce]"
              />
              {/* Attach and what to make on the left; the model and send on the right. */}
              <div className="flex items-end justify-between gap-3 px-3 pb-3 pt-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    aria-label="Attach files"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 border-none bg-transparent text-[var(--text-muted)] cursor-pointer transition-colors hover:bg-[var(--color-grey-50)] hover:text-[var(--text-secondary)]"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    hidden
                    aria-label="Files to attach"
                    onChange={(e) => {
                      const added = Array.from(e.target.files || []);
                      e.target.value = "";
                      setFiles((all) => [...all, ...added.filter((f) => !all.some((x) => x.name === f.name))].slice(0, 5));
                    }}
                  />
                  <div className="composer-tools composer-tools--wrap">
                    <ComposerMenu label="Output" value={output} options={OUTPUTS} onChange={setOutput} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 [&_.mm\_\_pill]:!h-8 [&_.mm\_\_pill]:!border-[var(--color-grey-300)] [&_.mm\_\_pill]:!text-[var(--color-grey-600)] [&_.mm\_\_pill-spark]:!text-inherit [&_.mm\_\_pill-caret]:!text-inherit [&_.mm\_\_pill-label]:!text-inherit [&_.mm\_\_pill-label]:!text-[12px] [&_.mm\_\_pill-label]:!font-medium">
                  <ModelModeMenu value={sageMode} onChange={setSageMode} placement="bottom" />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    aria-label="Send"
                    className={cn(
                      "flex items-center justify-center w-11 h-11 rounded-full shrink-0 border-none transition-colors",
                      message.trim() ? "bg-primary-500 text-white cursor-pointer hover:bg-primary-600" : "bg-[#eef0f7] text-[#adb2ce] cursor-not-allowed",
                    )}
                  >
                    <ArrowUp size={18} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
            <div className="composer-tools composer-tools--wrap px-2.5 py-1.5">
                {output === "creative" && (
                  <>
                    <ComposerMenu label="Type" value={kindId} options={KIND_OPTIONS} onChange={setKindId} variant="ghost" />
                    <ComposerMenu label="Style" value={styleId} options={STYLE_OPTIONS} onChange={setStyleId} variant="ghost" />
                    <ComposerMenu label="Format" value={formatId} options={FORMAT_OPTIONS} onChange={setFormatId} variant="ghost" />
                  </>
                )}
                {output === "landing" && <ComposerMenu label="Template" value={templateId} options={templateOptions} onChange={setTemplateId} variant="ghost" />}
                <Button variant="ghost" size="md" onClick={() => navigate("/library", { state: { tab: "design" } })}>
                  <Palette size={16} />
                  <span>Design system</span>
                  <span className="composer-menu__value">{brand || "Not set"}</span>
                </Button>
            </div>
            </div>
          </motion.div>

          {/* Prompts — pills, as /new shows skills. The icon says what each makes. */}
          <motion.div {...fadeUp(0.1)} className="flex flex-col items-center gap-4 w-full max-w-[760px] mt-7">
            <p className="m-0 text-[12px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Start by building</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {PROMPTS.map((pr) => {
                const m = MAKES[pr.kind];
                return (
                  <Tooltip key={pr.label} title={m.label} arrow placement="top" describeChild>
                    <button
                      type="button"
                      onClick={() => go(pr)}
                      className="inline-flex items-center gap-2 h-9 pl-2.5 pr-4 rounded-full bg-white border border-solid border-[#e1e5f1] text-[12px] text-[var(--text-primary)] cursor-pointer transition-colors hover:border-primary-300 hover:bg-primary-50"
                    >
                      <m.icon size={14} className="text-primary-500" />
                      {pr.label}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </motion.div>

          </div>

          {/* Recommendations — the top six, as cards or as a table. The rest are a click away. */}
          {top.length > 0 && (
            <motion.div {...fadeUp(0.1)} className="flex flex-col gap-5 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[16px] leading-[24px] font-medium text-[var(--text-primary)]">Recommendations</span>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--color-grey-100)]" role="group" aria-label="Show recommendations as">
                    {[{ id: "grid", label: "Grid view", icon: SquaresFour }, { id: "list", label: "List view", icon: Rows }].map((v) => (
                      <Tooltip key={v.id} title={v.label} placement="top" describeChild>
                        <button
                          type="button"
                          aria-label={v.label}
                          aria-pressed={recView === v.id}
                          onClick={() => pickView(v.id)}
                          className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-md border-none cursor-pointer transition-colors",
                            recView === v.id ? "bg-white text-[var(--text-primary)] shadow-[0_1px_2px_rgba(16,24,40,0.08)]" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                          )}
                        >
                          <v.icon size={15} />
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="md"
                    label={`View all${open.length > top.length ? ` ${open.length}` : ""}`}
                    icon={ArrowRight}
                    iconPosition="suffix"
                    onClick={() => navigate("/recommendations")}
                  />
                </div>
              </div>

              {recView === "grid" ? (
                <div className="grid grid-cols-3 gap-4 items-stretch">
                  {top.map((r) => <RecCard key={r.id} rec={r} onOpen={() => navigate(`/recommendations?rec=${r.id}`)} />)}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-solid border-[var(--color-grey-100)] bg-white">
                  <div
                    className="grid items-center gap-4 h-9 px-4 bg-[var(--color-grey-50)] text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]"
                    style={{ gridTemplateColumns: LIST_COLS }}
                  >
                    <span>Type</span><span>Recommendation</span><span>Channel</span><span>When</span><span />
                  </div>
                  {top.map((r) => <RecRow key={r.id} rec={r} onOpen={() => navigate(`/recommendations?rec=${r.id}`)} />)}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
