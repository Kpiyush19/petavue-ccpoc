/* The chat column used to edit a component and to build a page.
   Bubbles use the Sage chat's classes (s-msg-*), so it reads as the same chat.
   An assistant message may carry `working` (the steps it took) and `used`
   (the template and components it built from). `target` is the part picked on
   the canvas: it shows above the text box and the next message applies to it.
   `footer` takes the place of the text box, for a question the agent is asking. */
import { useEffect, useRef, useState } from "react";
import { ArrowUp, CaretDown, CheckCircle, CursorClick, Stack, X } from "@phosphor-icons/react";
import MarkdownRenderer from "../../utils/MarkdownRenderer";
import petavueLogo from "@/assets/petavue-logo.svg";
import "../../components/sessions/styles.css";

/* What a page was built from. With `reasons`, each component can be opened to
   show the description the agent followed in choosing it. */
function Used({ used }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lib-chat__used">
      <span className="lib-chat__used-title"><Stack size={13} /> {used.title || "Built from your workspace"}</span>
      <ul className="lib-chat__used-list">
        {used.template && <li className="lib-chat__used-item lib-chat__used-item--template">Template: {used.template}</li>}
        {!open && used.components.map((name, i) => <li key={`${name}-${i}`} className="lib-chat__used-item">{name}</li>)}
      </ul>
      {open && (
        <ol className="lib-chat__why">
          {used.reasons.map((r, i) => (
            <li key={`${r.name}-${i}`}>
              <span className="lib-chat__why-name">{r.name}</span>
              <span className="lib-chat__why-text">{r.why}</span>
            </li>
          ))}
        </ol>
      )}
      {used.reasons?.length > 0 && (
        <button type="button" className="lib-chat__why-toggle" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide the descriptions" : "Show the description the agent followed for each"}
          <CaretDown size={11} className={open ? "lib-chat__why-caret lib-chat__why-caret--open" : "lib-chat__why-caret"} />
        </button>
      )}
    </div>
  );
}

function AssistantMessage({ message }) {
  const { text, working, used } = message;
  return (
    <div className="s-msg-assistant lib-chat__assistant">
      <img src={petavueLogo} alt="" className="lib-chat__avatar" />
      <div className="s-msg-assistant__content lib-chat__content">
        {working?.length > 0 && (
          <ul className="lib-chat__steps">
            {working.map((step) => (
              <li key={step}><CheckCircle size={14} weight="fill" /> {step}</li>
            ))}
          </ul>
        )}
        <MarkdownRenderer content={text} />
        {used && <Used used={used} />}
      </div>
    </div>
  );
}

export default function ChatPane({ greeting, thread, busy, placeholder, onSend, target, onClearTarget, footer }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, busy, !!footer]);

  const send = (text) => {
    if (!text.trim() || busy) return;
    setInput("");
    onSend(text.trim());
  };

  return (
    <section className="lib-chat" aria-label="Chat">
      <div className="lib-chat__thread">
        <AssistantMessage message={{ text: greeting }} />
        {thread.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="s-msg-user-wrapper">
              <div className="s-msg-user">
                {m.target && <span className="lib-chat__on"><CursorClick size={12} /> {m.target}</span>}
                <div className="s-msg-user__text">{m.text}</div>
              </div>
            </div>
          ) : (
            <AssistantMessage key={i} message={m} />
          ),
        )}
        {busy && (
          <div className="s-msg-assistant lib-chat__assistant">
            <img src={petavueLogo} alt="" className="lib-chat__avatar" />
            <div className="s-msg-assistant__content lib-chat__thinking">Thinking…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {footer && <div className="lib-chat__footer">{footer}</div>}
      {!footer && target && (
        <div className="lib-chat__target">
          <CursorClick size={13} />
          <span className="lib-chat__target-label">{target.label}</span>
          <button type="button" className="lib-chat__target-clear" onClick={onClearTarget} aria-label="Clear selection">
            <X size={12} />
          </button>
        </div>
      )}
      {!footer && <div className="lib-chat__composer">
        <input
          className="lib-chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder={placeholder}
          aria-label="Message"
          autoFocus
        />
        <button
          type="button"
          className="lib-chat__send"
          onClick={() => send(input)}
          disabled={!input.trim() || busy}
          aria-label="Send"
        >
          <ArrowUp size={18} weight="bold" />
        </button>
      </div>}
    </section>
  );
}
