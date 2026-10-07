/**
 * Editing one workspace component in chat.
 *
 * Chat on the left, the component on the right. There are no controls on the
 * component itself: every change is asked for in words, and the preview is the
 * real section, so the result of each message is visible at once. A change
 * puts the component back in draft; publishing makes it available again.
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CaretLeft, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, Tooltip } from "@/ui";
import { editGreeting, editReply } from "../../mocks/libraryChat";
import ChatPane from "./ChatPane";
import { ScaledPreview, Section, StatusTag } from "./parts";
import useDesignStore from "./useDesignStore";
import useLibraryStore from "./useLibraryStore";
import "./library.css";

const REPUBLISH_NOTE = " It was published, so it is now a draft again. Publish it to make this change available.";

export default function ComponentEditorPage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const item = useLibraryStore((s) => s.items.find((i) => i.uid === uid));
  const { applyEdit, undoEdit, resetEdits, say, setStatus } = useLibraryStore();
  const design = useDesignStore((s) => s.design);
  const [busy, setBusy] = useState(false);

  if (!item) {
    return (
      <div className="lib lib-editor">
        <header className="lib__header">
          <div className="lib-editor__heading">
            <Button variant="secondaryGhost" size="md" icon={CaretLeft} aria-label="Back to the library" onClick={() => navigate("/library")} />
            <h1 className="lib__title">Component not found</h1>
          </div>
        </header>
        <div className="lib__canvas">
          <div className="lib-empty">
            <span className="lib-empty__title">This component is not in your workspace</span>
            <span className="lib-empty__text">It may have been removed, or the page was reloaded.</span>
            <div className="lib-empty__action">
              <Button variant="secondary" size="md" label="Back to the library" onClick={() => navigate("/library")} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const published = item.status === "published";

  const send = (text) => {
    say(uid, { role: "user", text });
    setBusy(true);
    setTimeout(() => {
      // Read the component as it is now, not as it was when the message was sent.
      const current = useLibraryStore.getState().items.find((i) => i.uid === uid);
      if (!current) return;
      const reply = editReply(text, current, design);
      const changed = reply.patch || reply.action;
      if (reply.patch) applyEdit(uid, reply.patch);
      if (reply.action === "undo") undoEdit(uid);
      if (reply.action === "reset") resetEdits(uid);
      say(uid, { role: "assistant", text: reply.text + (changed && current.status === "published" ? REPUBLISH_NOTE : "") });
      setBusy(false);
    }, 550);
  };

  return (
    <div className="lib lib-editor">
      <header className="lib__header">
        <div className="lib-editor__heading">
          <Button variant="secondaryGhost" size="md" icon={CaretLeft} aria-label="Back to the library" onClick={() => navigate("/library")} />
          <h1 className="lib__title">{item.name}</h1>
          <StatusTag status={item.status} />
        </div>
        {/* Publish is always here. A published component has nothing to
            publish until it is changed, which moves it back to draft. */}
        <div className="lib-editor__actions">
          {published && <span className="lib-card__added"><CheckCircle size={14} weight="fill" /> Available to the agent</span>}
          {published && (
            <Button variant="secondaryGhost" size="md" label="Move to draft" onClick={() => { setStatus(uid, "draft"); toast.success(`${item.name} moved to draft.`); }} />
          )}
          <Tooltip title={published ? "Nothing to publish. Change the component in chat first." : ""}>
            <span>
              <Button
                variant="primary"
                size="md"
                label="Publish"
                disabled={published}
                onClick={() => { setStatus(uid, "published"); toast.success(`${item.name} published.`); }}
              />
            </span>
          </Tooltip>
        </div>
      </header>

      <div className="lib-editor__body">
        <ChatPane
          greeting={editGreeting(item)}
          thread={item.thread}
          busy={busy}
          placeholder="Describe the change you want…"
          onSend={send}
        />
        <section className="lib-stage" aria-label="Preview">
          <div className="lib-stage__bar">
            <span className="lib-label">Preview</span>
            <span className="lib-stage__note">Follows your design system</span>
          </div>
          <div className="lib-stage__frame">
            <ScaledPreview><Section item={item} /></ScaledPreview>
          </div>
        </section>
      </div>
    </div>
  );
}
