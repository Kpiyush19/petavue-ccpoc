/**
 * Home — the campaigns-first landing (UX concept, Sep 29 direction).
 *
 * Layout follows the assistant-home reference (Nov shot): short greeting,
 * one big "Ask anything" composer with a recent-chat pill above it and
 * suggestion chips below, then content as quiet list rows on a white page —
 * findings and campaigns read like the reference's meetings and tasks.
 * Anything typed (or any finding row) slides the page into the chat thread.
 *
 * Under the text box, Output says what the chat should make. Auto leaves it
 * to Sage. Landing page and Ad creative open in place: Home becomes the chat
 * on the left and the page or artboard on the right, without leaving Home.
 * Dashboard sends the request to the Sage chat that builds dashboards.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowUp, CaretRight, ChartBar, ChatCircleDots, CheckCircle, TrendUp, TrendDown,
  Coins, UsersThree, LinkBreak, Images, ImageSquare, Layout, Palette, Sparkle,
} from "@phosphor-icons/react";
import SourceIcon from "../../components/SourceIcon";
import { Button } from "@/ui";
import { apiGet, apiPost } from "../../api";
import { FORMATS, KINDS, STYLES } from "../../mocks/creatives";
import { ROI_PROMPT, ROI_REPORT_SESSION_ID } from "../../mocks/paidMediaRoi";
import useDesignStore from "../library/useDesignStore";
import useLibraryStore, { workspaceTemplates } from "../library/useLibraryStore";
import CreativeEditorPage from "../library/CreativeEditorPage";
import PageBuilderPage from "../library/PageBuilderPage";
import ComposerMenu from "./ComposerMenu";
import { cn } from "../../utils/cn";
import { fmtMoney } from "./bits";
import HarnessChat from "./HarnessChat";
import { chatStore } from "./chatStore";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ── Tiny in-card drawings (pure SVG, no chart lib) ─────────────────── */
function MiniBars({ data, tone = "var(--color-primary-500)" }) {
  const max = Math.max(...data);
  return (
    <span className="flex items-end gap-[3px] h-[26px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="w-[7px] rounded-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? tone : "var(--color-grey-100)",
          }}
        />
      ))}
    </span>
  );
}

function MiniArea({ data, stroke = "#F43F5E" }) {
  const W = 72, H = 26, P = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [
    P + (i / (data.length - 1)) * (W - P * 2),
    P + (1 - (v - min) / (max - min || 1)) * (H - P * 2),
  ]);
  const line = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg width={W} height={H} aria-hidden="true">
      <polygon points={`${P},${H} ${line} ${W - P},${H}`} fill={stroke} opacity="0.08" />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={stroke} />
    </svg>
  );
}

/* Platform-reported vs CRM-true, as two bars — the signature stat, drawn. */
function MiniCompare({ a, b }) {
  const pct = Math.max(8, (a / b) * 100);
  return (
    <span className="flex flex-col gap-[5px] w-full" aria-hidden="true">
      <span className="h-[7px] rounded-full bg-[var(--color-grey-100)] overflow-hidden">
        <span className="block h-full rounded-full bg-[var(--color-grey-300)]" style={{ width: `${pct}%` }} />
      </span>
      <span className="h-[7px] rounded-full bg-primary-500" />
    </span>
  );
}

function KpiViz({ viz }) {
  if (!viz) return null;
  if (viz.type === "bars") return <MiniBars data={viz.data} />;
  if (viz.type === "area") return <MiniArea data={viz.data} />;
  if (viz.type === "compare") return <MiniCompare a={viz.a} b={viz.b} />;
  return null;
}

function KpiTile({ kpi, onOpen }) {
  const Dir = kpi.dir === "up" ? TrendUp : kpi.dir === "down" ? TrendDown : null;
  // Direction color is semantic to money, not to the arrow: spend up is a cost
  // signal (neutral-amber), pipeline down is the bad one.
  const tone =
    kpi.dir === "flat" ? "text-[#757A97]" : kpi.dir === "down" ? "text-rose-600" : "text-amber-600";
  return (
    <div
      onClick={onOpen}
      className="group flex flex-col gap-1.5 px-5 py-4 bg-white border border-[var(--color-grey-100)] rounded-xl cursor-pointer hover:shadow-[0_4px_16px_-4px_rgba(16,24,40,0.08)] hover:border-[var(--color-grey-200)] transition-all"
    >
      <span className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#757A97]">{kpi.label}</span>
        <CaretRight size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-[24px] leading-[30px] font-medium text-[var(--text-primary)] tracking-[-0.01em] tabular-nums">{kpi.value}</span>
        {kpi.delta && (
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", tone)}>
            {Dir && <Dir size={11} weight="bold" />}
            {kpi.delta}
          </span>
        )}
      </span>
      {kpi.viz?.type === "compare" ? (
        <span className="flex flex-col gap-2 pt-1">
          <span className="text-[11px] leading-[16px] text-[var(--text-muted)]">{kpi.sub}</span>
          <KpiViz viz={kpi.viz} />
        </span>
      ) : (
        <span className="flex items-end justify-between gap-3 pt-1">
          <span className="text-[11px] leading-[16px] text-[var(--text-muted)]">{kpi.sub}</span>
          <KpiViz viz={kpi.viz} />
        </span>
      )}
    </div>
  );
}

/* Leading glyph — a category icon carrying the severity in its tone,
   the Linear-list treatment instead of a raw colored dot. */
const FINDING_ICON = {
  "opp-waste": Coins,
  "opp-tracking": LinkBreak,
  "opp-pause": TrendDown,
  "opp-handoff": UsersThree,
  "opp-fatigue": Images,
};
/* One finding as a quiet list row: icon + headline left, the number right.
   The row itself starts the fix in chat. */
function FindingRow({ opp, onFix, onOpen }) {
  const Icon = FINDING_ICON[opp.id] || Coins;
  return (
    <div
      onClick={opp.fixed ? onOpen : onFix}
      className="group flex items-center gap-3 h-11 px-3 -mx-3 rounded-lg cursor-pointer hover:bg-[var(--color-grey-50)] transition-colors"
    >
      <Icon size={16} weight="duotone" className={cn("shrink-0", opp.fixed ? "text-[var(--text-muted)]" : "text-[#8E93AF]")} />
      <span className="flex-1 min-w-0 truncate text-[14px] text-[var(--text-primary)]">{opp.title}</span>
      {opp.fixed ? (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700 whitespace-nowrap shrink-0">
          <CheckCircle size={14} weight="fill" className="text-emerald-500" /> {opp.fixedLabel}
        </span>
      ) : (
        <>
          <span className="text-[13px] text-[var(--text-secondary)] tabular-nums whitespace-nowrap shrink-0">{opp.stat}</span>
          <CaretRight size={13} className="shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}
    </div>
  );
}

/* One campaign as a list row — the reference's task rows. */
function CampaignRow({ c, onOpen }) {
  return (
    <div
      onClick={onOpen}
      className="group flex items-center gap-3 h-11 px-3 -mx-3 rounded-lg cursor-pointer hover:bg-[var(--color-grey-50)] transition-colors"
    >
      <SourceIcon name={c.channel} size={15} />
      <span className="flex-1 min-w-0 truncate text-[14px] text-[var(--text-primary)]">{c.name}</span>
      {c.openFindings > 0 && (
        <span className="text-[12px] text-amber-600 whitespace-nowrap shrink-0">
          {c.openFindings} finding{c.openFindings === 1 ? "" : "s"}
        </span>
      )}
      <span className="text-[13px] text-[var(--text-secondary)] tabular-nums whitespace-nowrap shrink-0 w-[72px] text-right">
        {fmtMoney(c.spend30d)}
      </span>
    </div>
  );
}

/* Section header — plain grey text left, quiet affordance right. */
function SectionHeader({ label, right }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[15px] font-medium text-[var(--text-secondary)]">{label}</span>
      {right}
    </div>
  );
}

// What a suggestion makes. A dashboard is just something the chat builds, so
// only the two real outputs carry a label; asks are plain rows.
const KIND = {
  chat: { icon: ChatCircleDots, label: null },
  dashboard: { icon: ChartBar, label: null },
  landing: { icon: Layout, label: "Landing page" },
  creative: { icon: ImageSquare, label: "Ad creative" },
};

// What the chat can be asked to make. Auto leaves the choice to Sage.
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

const SUGGESTIONS = {
  auto: [
    { kind: "chat", text: "Find where my LinkedIn ads are leaking spend" },
    { kind: "dashboard", text: "Which paid channels drive revenue?" },
    { kind: "landing", text: "Build a landing page for our Q4 demo campaign" },
    { kind: "creative", text: "Make an ad creative for retargeting site visitors" },
  ],
  landing: [
    { kind: "landing", text: "Build a landing page for our Q4 demo campaign" },
    { kind: "landing", text: "Build a landing page for the product launch" },
    { kind: "landing", text: "Build a page that collects sign-ups" },
  ],
  creative: [
    { kind: "creative", text: "Make an ad creative for our Q4 demo campaign" },
    { kind: "creative", text: "Make a LinkedIn ad creative for the autumn webinar" },
    { kind: "creative", text: "Make a Meta story for retargeting site visitors" },
  ],
};

/* One suggestion as a quiet row: what to ask on the left, what it makes on
   the right. The reference's meeting rows, pointed at the composer. */
function SuggestionRow({ row, showKind, onPick }) {
  const k = KIND[row.kind];
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex w-full items-center gap-3 h-11 px-3 rounded-[10px] border-none bg-transparent cursor-pointer text-left hover:bg-[var(--color-grey-50)] transition-colors"
    >
      <k.icon size={16} className="shrink-0 text-[#8E93AF]" />
      <span className="flex-1 min-w-0 truncate text-[14px] text-[var(--text-primary)]">{row.text}</span>
      {showKind && k.label && <span className="shrink-0 text-[12px] text-[#ADB2CE] whitespace-nowrap">{k.label}</span>}
      <CaretRight size={13} className="shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default function HarnessHomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

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
  const { data: campaignData } = useQuery({ queryKey: ["harness-campaigns"], queryFn: () => apiGet("/api/harness/campaigns") });

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

  const rows = SUGGESTIONS[output] || SUGGESTIONS.auto;

  // A row names its own kind, whatever the Output menu says. A row that
  // matches the chosen output keeps the template or format picked under it.
  const go = (row) => {
    if (row.kind === "dashboard") return startDashboard();
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

  const kpis = data?.kpis || [];
  const opps = data?.opportunities || [];
  const campaigns = (campaignData?.campaigns || []).slice().sort((a, b) => b.spend30d - a.spend30d).slice(0, 5);

  return (
    <div className="flex h-full w-full overflow-x-auto">
      <div className="flex flex-col h-full w-full min-w-[840px] overflow-y-auto bg-white">
        <div className="flex flex-col w-full max-w-[840px] mx-auto px-8 pb-12">

          {/* Hero zone — greeting + composer sit centered in the upper half
              of the viewport, like a homepage; the lists live below the fold.
              The padding is real, not just centring, so on a short window the
              greeting never touches the top and the lists never touch the
              suggestion rows. */}
          <div className="flex flex-col gap-6 min-h-[90vh] shrink-0 py-6">
          <div className="flex-[1.1]" aria-hidden="true" />

          {/* Greeting — just the hello. What the box can make is said by the
              suggestion rows, not by a sales line. */}
          <motion.h1
            {...fadeUp(0)}
            className="text-[26px] leading-[34px] font-medium text-[#232532] tracking-[-0.01em] m-0 text-center"
          >
            {getGreeting()}{data?.greetingName ? `, ${data.greetingName}` : ""}
          </motion.h1>

          {/* Composer block: big ask box, recent-chat pill under it, chips below */}
          <motion.div {...fadeUp(0.05)} className="flex flex-col gap-3">
            <div className="flex flex-col bg-white border border-[#d4d9ea] rounded-[20px] transition-all shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.12)] hover:border-primary-300 focus-within:border-primary-500 focus-within:shadow-[0_0_0_4px_#F5F8FF,0_12px_32px_-16px_rgba(16,24,40,0.12)]">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={PLACEHOLDER[output]}
                rows={3}
                autoFocus
                className="w-full resize-none border-none outline-none bg-transparent px-5 pt-4 pb-1 text-[15px] leading-[22px] text-[var(--text-primary)] placeholder:text-[#adb2ce]"
              />
              <div className="flex items-center justify-between gap-3 px-3 pb-3">
                <div className="composer-tools composer-tools--wrap">
                  <ComposerMenu label="Output" value={output} options={OUTPUTS} onChange={setOutput} />
                  {output === "creative" && (
                    <>
                      <ComposerMenu label="Type" value={kindId} options={KIND_OPTIONS} onChange={setKindId} />
                      <ComposerMenu label="Style" value={styleId} options={STYLE_OPTIONS} onChange={setStyleId} />
                      <ComposerMenu label="Format" value={formatId} options={FORMAT_OPTIONS} onChange={setFormatId} />
                    </>
                  )}
                  {output === "landing" && <ComposerMenu label="Template" value={templateId} options={templateOptions} onChange={setTemplateId} />}
                  {(output === "landing" || output === "creative") && (
                    <button
                      type="button"
                      className="composer-menu__button"
                      onClick={() => navigate("/library", { state: { tab: "design" } })}
                    >
                      <Palette size={14} />
                      <span className="composer-menu__label">Design system</span>
                      <span className="composer-menu__value">{brand || "Not set"}</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  aria-label="Send"
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full shrink-0 border-none transition-colors",
                    message.trim() ? "bg-primary-500 text-white cursor-pointer hover:bg-primary-600" : "bg-[var(--color-grey-100)] text-[#ADB2CE] cursor-not-allowed",
                  )}
                >
                  <ArrowUp size={16} weight="bold" />
                </button>
              </div>
            </div>

            <div className="flex flex-col px-1">
              {rows.map((row) => (
                <SuggestionRow key={row.text} row={row} showKind={output === "auto"} onPick={() => go(row)} />
              ))}
            </div>
          </motion.div>

          <div className="flex-1" aria-hidden="true" />
          </div>

          <div className="flex flex-col divide-y divide-[var(--color-grey-100)]">

          {/* Last 30 days — the one carded strip on the page. */}
          <motion.div {...fadeUp(0.1)} className="flex flex-col gap-3 pb-9">
            <SectionHeader
              label="Last 30 days"
              right={
                <Button
                  variant="blueGhost"
                  size="md"
                  label="All campaigns"
                  icon={CaretRight}
                  iconPosition="suffix"
                  onClick={() => navigate("/campaigns")}
                />
              }
            />
            <div className="grid grid-cols-4 gap-4">
              {kpis.map((k) => <KpiTile key={k.label} kpi={k} onOpen={() => navigate("/campaigns")} />)}
            </div>
          </motion.div>

          {/* Findings — quiet rows, the reference's meetings list. */}
          <motion.div {...fadeUp(0.14)} className="flex flex-col gap-1 py-9">
            <div className="pb-2">
              <SectionHeader label="What Petavue found" />
            </div>
            {opps.map((o) => (
              <FindingRow
                key={o.id}
                opp={o}
                onFix={() => openChatWith(o.prompt)}
                onOpen={() => navigate(`/campaigns/${o.campaignId}`)}
              />
            ))}
          </motion.div>

          {/* Campaigns — top spenders, the reference's tasks list. */}
          <motion.div {...fadeUp(0.18)} className="flex flex-col gap-1 pt-9">
            <div className="pb-2">
              <SectionHeader
                label={`Campaigns ${campaignData?.campaigns?.length || ""}`}
                right={
                  <Button
                    variant="secondaryGhost"
                    size="md"
                    label="View all"
                    onClick={() => navigate("/campaigns")}
                  />
                }
              />
            </div>
            {campaigns.map((c) => (
              <CampaignRow key={c.id} c={c} onOpen={() => navigate(`/campaigns/${c.id}`)} />
            ))}
          </motion.div>

          </div>

        </div>
      </div>
    </div>
  );
}
