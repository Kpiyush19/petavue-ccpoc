/**
 * The main-harness chat — analysis and actions in one thread.
 *
 * Chrome matches the real Sage chat (ChatArea/MessageBubble): blue user
 * bubble, Petavue-logo assistant rows with MarkdownRenderer, the Follow-ups
 * rows, a 720px column and the rounded composer. Only the content blocks
 * (findings, the action card, the automation card) are harness-specific.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp, CheckCircle, CircleNotch, Lightning, ShieldCheck, ArrowSquareOut,
  ArrowCounterClockwise, ArrowsClockwise, CaretRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/ui";
import { apiPost } from "../../api";
import { cn } from "../../utils/cn";
import SourceIcon from "../../components/SourceIcon";
import MarkdownRenderer from "../../utils/MarkdownRenderer";
import SuggestedQuestions from "../../components/sessions/components/SuggestedQuestions";
import petavueLogo from "@/assets/petavue-logo.svg";
// The Sage chat's bubble/composer classes (s-msg-*, s-composer…).
import "../../components/sessions/styles.css";

let keySeq = 0;
const nextKey = () => `m${++keySeq}`;

/* ── Working lines: each tool step spins, then checks off ─────────────── */
function WorkingLines({ lines, done }) {
  const [doneCount, setDoneCount] = useState(done ? lines.length : 0);
  useEffect(() => {
    if (done) return;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setDoneCount(i);
      if (i >= lines.length) clearInterval(t);
    }, 550);
    return () => clearInterval(t);
  }, [lines, done]);
  return (
    <div className="flex flex-col gap-1.5 py-0.5">
      {lines.map((ln, i) => (
        <div key={i} className={cn("flex items-center gap-2", i > doneCount && "opacity-0")}>
          {i < doneCount ? (
            <CheckCircle size={14} weight="fill" className="shrink-0 text-emerald-500" />
          ) : (
            <CircleNotch size={14} className="shrink-0 text-[var(--text-muted)] animate-spin" />
          )}
          <span className="text-[13px] text-[var(--text-secondary)]">{ln}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Streamed text, rendered through the app's MarkdownRenderer ───────── */
function StreamedText({ text, instant, onDone }) {
  const [shown, setShown] = useState(instant ? text : "");
  const doneRef = useRef(false);
  useEffect(() => {
    if (instant) { if (!doneRef.current) { doneRef.current = true; onDone?.(); } return; }
    const words = text.split(" ");
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      setShown(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(t);
        if (!doneRef.current) { doneRef.current = true; onDone?.(); }
      }
    }, 24);
    return () => clearInterval(t);
  }, [text, instant, onDone]);
  return <MarkdownRenderer content={shown} />;
}

/* ── Findings block inside a reply ────────────────────────────────────── */
function OpportunitiesBlock({ items, onOpenCampaign }) {
  return (
    <div className="flex flex-col bg-white border border-[var(--color-grey-100)] rounded-xl overflow-hidden">
      {items.map((it, i) => (
        <div key={i} className={cn("flex flex-col gap-1 px-4 py-3", i > 0 && "border-t border-[var(--color-grey-100)]")}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px] font-medium text-[var(--text-primary)]">{it.title}</span>
            {it.campaignId && (
              <button
                onClick={() => onOpenCampaign(it.campaignId)}
                className="shrink-0 inline-flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer text-[12px] text-primary-600 hover:underline"
              >
                View campaign <CaretRight size={11} />
              </button>
            )}
          </div>
          <span className="text-[13px] leading-[20px] text-[var(--text-secondary)]">{it.detail}</span>
        </div>
      ))}
    </div>
  );
}

/* ── The action card: the exact change, its checks, approve ───────────── */
function ActionCard({ action, onApproved, onRepeat }) {
  // idle → pushing → applied → undone
  const [stage, setStage] = useState("idle");
  const [receipt, setReceipt] = useState(null);

  const approve = async () => {
    setStage("pushing");
    try {
      const res = await apiPost(`/api/harness/actions/${action.id}/approve`, {});
      setReceipt(res.receipt);
      setStage("applied");
      onApproved?.(action.id, res.followUp);
    } catch {
      setStage("idle");
      toast.error("Push failed — nothing was changed.");
    }
  };

  const undo = async () => {
    await apiPost(`/api/harness/actions/${action.id}/undo`, {});
    setStage("undone");
    toast.success("Reverted. Every change is rolled back.");
  };

  const applied = stage === "applied";
  const undone = stage === "undone";

  return (
    <div className={cn(
      "flex flex-col gap-4 p-5 bg-white border rounded-2xl shadow-[0_2px_8px_rgba(16,24,40,0.06)] transition-colors",
      applied ? "border-emerald-200" : "border-[var(--color-grey-100)]",
    )}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {applied
          ? <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />
          : <Lightning size={16} weight="fill" className="text-primary-500 shrink-0" />}
        <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1 min-w-0">
          {applied ? `Applied · ${receipt?.appliedAt}` : undone ? "Undone — rolled back" : action.title}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#757A97]">
          <SourceIcon name={action.destination.split(" · ")[0]} size={13} />
          {action.destination}
        </span>
      </div>

      {/* Changes */}
      <div className="flex flex-col gap-3">
        {action.changes.map((ch, i) => (
          <div key={i} className="grid gap-x-4 gap-y-0.5 items-start"
            style={{ gridTemplateColumns: "150px minmax(0,1fr) 92px" }}>
            <span className="text-[12px] font-medium text-[var(--text-primary)] leading-snug pt-px min-w-0 [overflow-wrap:anywhere]">{ch.campaign}</span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[12px] text-[var(--text-primary)] leading-snug">{ch.change}</span>
              <span className="text-[11px] text-[#757A97] leading-snug">
                {ch.before !== "—" && <>{ch.before} <span className="text-[var(--color-grey-300)]">→</span> </>}{ch.after}
              </span>
            </span>
            <span className="text-[12px] text-right tabular-nums text-rose-600 font-medium">{ch.saves}</span>
          </div>
        ))}
      </div>

      {/* Checks */}
      <div className="flex flex-col gap-1.5 pt-3 border-t border-[var(--color-grey-100)]">
        {action.checks.map((c, i) => (
          <span key={i} className="flex items-start gap-2">
            <ShieldCheck size={13} weight="fill" className="shrink-0 mt-0.5 text-emerald-500" />
            <span className="text-[11px] leading-[17px] text-[#757A97]">{c}</span>
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-grey-100)]">
        <span className="text-[12px] text-[var(--text-primary)] min-w-0">{applied ? receipt?.undo : action.impact}</span>
        {stage === "idle" && (
          <span className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondaryGhost"
              size="md"
              label="Edit first"
              onClick={() => toast("Each change opens for inline editing before approval in the full build.")}
            />
            <Button variant="primary" size="md" label="Approve & push" onClick={approve} />
          </span>
        )}
        {stage === "pushing" && (
          <span className="inline-flex items-center gap-2 text-[12px] text-blue-700 shrink-0">
            <CircleNotch size={14} className="animate-spin" /> Pushing to {action.destination}…
          </span>
        )}
        {applied && (
          <span className="flex items-center gap-2 shrink-0">
            {/* The voice-note affordance: any approved action can become a
                workflow from right here, not only when the chat offers it. */}
            <Button variant="secondaryGhost" size="md" label="Make repeatable" icon={ArrowsClockwise} onClick={onRepeat} />
            <Button
              variant="secondaryGhost"
              size="md"
              label="View in platform"
              icon={ArrowSquareOut}
              iconPosition="suffix"
              onClick={() => toast(`This opens the change set in ${action.destination} in the full build.`)}
            />
            <Button variant="secondaryGhost" size="md" label="Undo" icon={ArrowCounterClockwise} onClick={undo} />
          </span>
        )}
        {undone && <span className="text-[12px] text-[#757A97] shrink-0">Rolled back · the finding is live again on Home</span>}
      </div>
    </div>
  );
}

/* ── The automation card: steps extracted from the chat itself ────────── */
function AutomationBlock({ automation, onOpenAutomations }) {
  if (!automation) return null;
  return (
    <div className="flex flex-col bg-white border border-[var(--color-grey-200)] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--color-grey-50)] border-b border-[var(--color-grey-100)]">
        <ArrowsClockwise size={16} className="text-primary-500 shrink-0" />
        <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1">{automation.name}</span>
        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5">Live</span>
        <span className="text-[11px] text-[#757A97]">{automation.schedule}</span>
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        {(automation.steps || []).map((s, i) => (
          <span key={i} className="flex items-start gap-2.5">
            <span className="shrink-0 grid place-items-center w-[18px] h-[18px] mt-px rounded-full bg-primary-50 text-[10px] font-medium text-primary-600 tabular-nums">{i + 1}</span>
            <span className="text-[12px] leading-[19px] text-[var(--text-primary)]">{s}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-grey-100)]">
        <span className="text-[11px] text-[#757A97]">Built from this chat — nothing was configured.</span>
        <button onClick={onOpenAutomations} className="inline-flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer text-[12px] text-primary-600 hover:underline">
          Open Workflows-v2 <CaretRight size={11} />
        </button>
      </div>
    </div>
  );
}

/* ── The thread ───────────────────────────────────────────────────────── */
export default function HarnessChat({ thread, setThread, convo, setConvo, registerSend, onMake }) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  // Wrapped: scrollDown returns a rAF id, which useEffect must not receive
  // as a "cleanup" value.
  const scrollDown = () => { requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })); };
  useEffect(() => { scrollDown(); }, [thread]);

  // Hand the parent our send() so seeded prompts ("Fix in chat") run through
  // the same pipeline as typed ones. Re-registered every render — send closes
  // over current state.
  useEffect(() => { registerSend?.(send); });

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");

    // Chips that navigate instead of speaking.
    if (/^open workflows$/i.test(trimmed)) { navigate("/workflows"); return; }
    if (/^open (automations|workflows-v2)$/i.test(trimmed)) { navigate("/workflows-v2"); return; }
    if (/^show me what changed on the campaign$/i.test(trimmed)) { navigate("/campaigns/li-broad-awareness"); return; }
    if (/^show me (one|a) deal'?s journey$/i.test(trimmed)) { navigate("/campaigns/li-abm-tier1"); return; }
    // A landing page or an ad creative is made with its canvas beside the
    // chat. Home opens that in place; elsewhere it opens the Library screen.
    if (/\blanding page\b/i.test(trimmed)) { onMake ? onMake("page", trimmed) : navigate("/library/pages/new", { state: { prompt: trimmed } }); return; }
    if (/\bad creatives?\b/i.test(trimmed)) { onMake ? onMake("creative", trimmed) : navigate("/library/creatives/new", { state: { prompt: trimmed } }); return; }

    setBusy(true);
    setThread((prev) => [...prev, { key: nextKey(), role: "user", text: trimmed }]);
    try {
      const reply = await apiPost("/api/harness/chat", { text: trimmed, branch: convo.branch, phase: convo.phase });
      setConvo({ branch: reply.branch, phase: reply.phase });
      setThread((prev) => [...prev, { key: nextKey(), role: "assistant", ...reply }]);
    } finally {
      setBusy(false);
    }
  };

  // After an approve, the assistant follows up (text + chips from the mock).
  const handleApproved = (actionId, followUp) => {
    if (!followUp) return;
    setConvo((c) => ({ ...c, phase: "applied" }));
    setTimeout(() => {
      setThread((prev) => [...prev, { key: nextKey(), role: "assistant", ...followUp }]);
    }, 900);
  };

  const openCampaign = (id) => navigate(`/campaigns/${id}`);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-4 w-full max-w-[720px] mx-auto px-4 pt-6 pb-4">
          {thread.map((m, idx) => {
            const isLast = idx === thread.length - 1;
            if (m.role === "user") {
              // The Sage chat's user bubble (s-msg-* from sessions/styles.css).
              return (
                <div key={m.key} className="s-msg-user-wrapper">
                  <div className="s-msg-user">
                    <div className="s-msg-user__text">{m.text}</div>
                  </div>
                </div>
              );
            }
            return <AssistantTurn key={m.key} turn={m} isLast={isLast} onSend={send} onApproved={handleApproved} onOpenCampaign={openCampaign} onOpenAutomations={() => navigate("/workflows-v2")} onDone={scrollDown} />;
          })}
          {busy && (
            <div className="s-msg-assistant mt-2">
              <div className="flex h-6 w-6">
                <img src={petavueLogo} alt="" className="h-5 w-5 my-auto" />
              </div>
              <div className="s-msg-assistant__content">
                <span className="text-[14px] text-[var(--text-muted)]">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer — the Sage chat composer's box treatment. */}
      <div className="shrink-0 w-full max-w-[720px] mx-auto px-4 pb-5">
        <div className="flex items-center gap-2 w-full bg-white border border-grey-200 rounded-[20px] pl-5 pr-2 py-2 focus-within:border-primary-500 hover:border-primary-300 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="Ask, or tell Petavue what to change…"
            autoFocus
            className="flex-1 min-w-0 border-none outline-none bg-transparent text-[14px] leading-[22px] text-[var(--text-primary)] placeholder:text-[#adb2ce]"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || busy}
            aria-label="Send"
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full shrink-0 border-none transition-colors",
              input.trim() && !busy ? "bg-primary-500 text-white cursor-pointer hover:bg-primary-600" : "bg-[#eef0f7] text-[#adb2ce] cursor-not-allowed",
            )}
          >
            <ArrowUp size={18} strokeWidth={2.75} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* One assistant turn: logo row → working lines → markdown → blocks → follow-ups. */
function AssistantTurn({ turn, isLast, onSend, onApproved, onOpenCampaign, onOpenAutomations, onDone }) {
  // Replay-safety: only the newest turn animates; older ones render settled.
  // Turns restored from chatStore carry `settled` so reopening never replays.
  const settled = !isLast || !!turn.settled;
  const [textDone, setTextDone] = useState(settled);
  const [workDone, setWorkDone] = useState(settled || !turn.working?.length);

  useEffect(() => {
    if (!isLast || workDone) return;
    const t = setTimeout(() => setWorkDone(true), (turn.working?.length || 0) * 550 + 250);
    return () => clearTimeout(t);
  }, [isLast, workDone, turn.working]);

  useEffect(() => { if (textDone) onDone?.(); }, [textDone, onDone]);

  return (
    <div className="s-msg-assistant mt-2">
      <div className="flex h-6 w-6">
        <img src={petavueLogo} alt="" className="h-5 w-5 my-auto" />
      </div>
      <div className="s-msg-assistant__content flex flex-col gap-3">
        {turn.working?.length > 0 && <WorkingLines lines={turn.working} done={settled} />}
        {workDone && turn.text && (
          <StreamedText text={turn.text} instant={settled} onDone={() => setTextDone(true)} />
        )}
        {textDone && (turn.blocks || []).map((b, i) => {
          if (b.type === "opportunities") return <OpportunitiesBlock key={i} items={b.items} onOpenCampaign={onOpenCampaign} />;
          if (b.type === "action") return <ActionCard key={i} action={b.action} onApproved={onApproved} onRepeat={() => onSend("Run this weekly")} />;
          if (b.type === "automation") return <AutomationBlock key={i} automation={b.automation} onOpenAutomations={onOpenAutomations} />;
          return null;
        })}
        {textDone && turn.chips?.length > 0 && (
          <SuggestedQuestions
            questions={turn.chips.map((c) => ({ question: c }))}
            onSelect={onSend}
          />
        )}
      </div>
    </div>
  );
}
