import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkle, X, PaperPlaneRight, CircleNotch } from "@phosphor-icons/react";
import { Button as PvButton } from "../../petavue";
import { apiPost } from "../../api";
import { cn } from "../../utils/cn";
import { ChatOverlay } from "../../components/dashboards/dashboard-viewer-widget";
import "../../components/dashboards/dashboard-viewer-widget/styles.css";

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />;

/* ── Floating Sage launcher: round, gradient, bottom-right ── */
const SAGE_GRADIENT = "linear-gradient(135deg, #3661ed 0%, #6d5ef0 48%, #a855f7 100%)";
function SageFab({ open, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? "Close Sage" : "Open Sage"}
      className="fixed bottom-4 right-4 z-[1100] flex items-center justify-center w-12 h-12 rounded-full text-white border-none cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
      style={{ background: SAGE_GRADIENT, boxShadow: "0 10px 28px -6px rgba(72,86,237,0.55), 0 2px 6px rgba(16,24,40,0.18)" }}
    >
      <span className="relative flex items-center justify-center w-6 h-6">
        <Sparkle
          weight="fill"
          size={24}
          className={cn("absolute transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", open ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100")}
        />
        <X
          weight="bold"
          size={22}
          className={cn("absolute transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", open ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50")}
        />
      </span>
    </button>
  );
}

/* ── Sage chat body rendered inside the ChatOverlay panel ── */
function SageChat() {
  const [chat, setChat] = useState([
    { role: "assistant", text: "Hi, I'm Sage. Ask me what's wasting spend, where you're leaving demos on the table, or which goal to open first." },
  ]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const ask = useMutation({
    mutationFn: (text) => apiPost("/api/goals/sage", { text }),
    onSuccess: (res) => setChat((c) => [...c, { role: "assistant", text: res.reply }]),
  });
  const send = () => {
    const text = draft.trim();
    if (!text || ask.isPending) return;
    setChat((c) => [...c, { role: "user", text }]);
    ask.mutate(text);
    setDraft("");
  };
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, ask.isPending]);

  const suggestions = ["What's wasting spend?", "Where am I losing demos?", "What should I open first?"];

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {chat.map((m, i) => (
          <div
            key={i}
            className={cn(
              "text-[13px] leading-relaxed px-3 py-2 rounded-2xl max-w-[85%]",
              m.role === "user"
                ? "self-end bg-pv-primary-primary-500 text-white rounded-br-md"
                : "self-start bg-pv-neutral-grey-100 text-[var(--text-primary)] rounded-bl-md"
            )}
          >
            {m.text}
          </div>
        ))}
        {ask.isPending && (
          <div className="self-start bg-pv-neutral-grey-100 text-[var(--text-muted)] rounded-2xl rounded-bl-md px-3 py-2">
            <Spinner size={14} />
          </div>
        )}
        {chat.length <= 1 && !ask.isPending && (
          <div className="flex flex-wrap gap-2 mt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setChat((c) => [...c, { role: "user", text: s }]); ask.mutate(s); }}
                className="text-[12px] px-3 py-1.5 rounded-full border border-[var(--border-primary)] text-[var(--text-secondary)] bg-white hover:border-pv-primary-primary-400 hover:text-pv-primary-primary-600 cursor-pointer transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 p-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          placeholder="Ask about spend, demos, or what to fix first…"
          className="flex-1 text-[13px] px-3 py-1.5 h-8 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
        />
        <PvButton
          variant="primary"
          size="md"
          icon={PaperPlaneRight}
          disabled={!draft.trim() || ask.isPending}
          onClick={send}
          aria-label="Send"
          className="shrink-0"
        />
      </div>
    </div>
  );
}

/* Floating Sage assistant — launcher button + resizable chat overlay. Drop it on
   any page (Goals list, goal detail) to make Sage available there. */
export default function SageWidget({ title = "Sage", hidden = false }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {!hidden && <SageFab open={open} onClick={() => setOpen((o) => !o)} />}
      <ChatOverlay isOpen={open && !hidden} onClose={() => setOpen(false)} title={title} floating>
        <SageChat />
      </ChatOverlay>
    </>
  );
}
