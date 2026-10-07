/* What the agent asks in chat before it builds, and the directions it offers.
   Both sit where the text box is, so the conversation is the only place a
   request is shaped: there is no setup screen.
   - AskCard: one question at a time, a few options with one recommended,
     room for another answer, and Skip.
   - DirectionCard: a few versions to choose from, drawn small. */
import { useEffect, useState } from "react";
import { Button } from "@/ui";

export function AskCard({ step, total, question, options, onAnswer, onSkip, onBack }) {
  const [picked, setPicked] = useState(null);
  const [other, setOther] = useState("");
  useEffect(() => { setPicked(null); setOther(""); }, [step]);

  const answer = other.trim() ? { label: other.trim() } : options.find((o) => o.id === picked);
  const next = () => answer && onAnswer(answer);

  // 1, 2, 3 pick an option; Enter moves on.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) setPicked(options[n - 1].id);
      if (e.key === "Enter" && answer) onAnswer(answer);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, answer, onAnswer]);

  return (
    <div className="intake" role="group" aria-label={question}>
      <span className="intake__step">Question {step + 1} of {total}</span>
      <span className="intake__question">{question}</span>
      <div className="intake__options">
        {options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={picked === o.id && !other.trim()}
            className={`intake__option${picked === o.id && !other.trim() ? " intake__option--on" : ""}`}
            onClick={() => { setPicked(o.id); setOther(""); }}
          >
            <span className="intake__label">{o.label}</span>
            {o.recommended && <span className="intake__badge">Recommended</span>}
            <span className="intake__key">{i + 1}</span>
          </button>
        ))}
        <input
          className="intake__other"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") next(); }}
          placeholder="Something else…"
          aria-label="Something else"
        />
      </div>
      <div className="intake__actions">
        <Button variant="secondaryGhost" size="md" label="Skip" onClick={onSkip} />
        <span className="intake__spacer" />
        {step > 0 && <Button variant="ghost" size="md" label="Back" onClick={onBack} />}
        <Button variant="primary" size="md" label={step === total - 1 ? "Done" : "Next"} disabled={!answer} onClick={next} />
      </div>
    </div>
  );
}

/* items: [{ id, label, note, recommended, preview }]. `value` is the one being
   looked at, which is also shown large beside the chat. */
export function DirectionCard({ question, items, value, onPick, onChoose }) {
  return (
    <div className="intake" role="group" aria-label={question}>
      <span className="intake__question">{question}</span>
      <div className="intake__directions">
        {items.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={value === d.id}
            className={`intake__direction${value === d.id ? " intake__direction--on" : ""}`}
            onClick={() => onPick(d.id)}
          >
            <span className="intake__thumb">{d.preview}</span>
            <span className="intake__label">{d.label}</span>
            <span className="intake__note">{d.note}</span>
            {d.recommended && <span className="intake__badge">Recommended</span>}
          </button>
        ))}
      </div>
      <div className="intake__actions">
        <span className="intake__spacer" />
        <Button variant="primary" size="md" label={`Choose ${items.find((d) => d.id === value)?.label || ""}`} onClick={onChoose} />
      </div>
    </div>
  );
}

// The answers as one line, for the message that records them in the thread.
export function summarise(questions, answers) {
  const parts = questions.filter((q) => answers[q.id]).map((q) => `${q.short}: ${answers[q.id].label}`);
  return parts.length ? parts.join(" · ") : "Skipped the questions";
}
