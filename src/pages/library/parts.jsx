/* Pieces shared by the Library page and the component editor. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FolderSimple } from "@phosphor-icons/react";
import { Dialog, Tag, TextArea, TextInput } from "@/ui";
import { componentById, parseTags } from "../../mocks/library";
import { SECTIONS } from "./sections";
import { useDesignVars } from "./useDesignStore";

const BASE_WIDTH = 1200;

/* Draws its children at 1200px and scales them to the width available.
   With `height`, the box is fixed: shorter content is centred, taller content
   shows from the top. Without it, the box takes the content's scaled height.
   `interactive` lets the drawing be clicked, for picking a part of a page. */
export function ScaledPreview({ height, interactive = false, children }) {
  const boxRef = useRef(null);
  const stageRef = useRef(null);
  const vars = useDesignVars();
  const [size, setSize] = useState({ scale: 0, stageHeight: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const width = boxRef.current?.clientWidth || 0;
      if (width) setSize({ scale: width / BASE_WIDTH, stageHeight: stageRef.current?.offsetHeight || 0 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(boxRef.current);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const scaled = size.stageHeight * size.scale;
  const offset = height && scaled < height ? (height - scaled) / 2 : 0;

  return (
    <div
      ref={boxRef}
      className={`lib-preview${interactive ? " lib-preview--interactive" : ""}`}
      style={{ height: height ?? scaled }}
      aria-hidden={interactive ? undefined : "true"}
    >
      <div
        ref={stageRef}
        className="lib-preview__stage lp"
        style={{ ...vars, transform: `translateY(${offset}px) scale(${size.scale})`, visibility: size.scale ? "visible" : "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}

/* One section. Pass a library `id`, or a workspace `item` to draw it with the
   changes made to that copy in chat. */
export function Section({ id, item }) {
  const Render = SECTIONS[componentById(item?.sourceId ?? id)?.render];
  if (!Render) return null;
  return (
    <div style={item?.overrides.vars}>
      <Render copy={item?.overrides.copy} />
    </div>
  );
}

export function StatusTag({ status }) {
  return status === "published" ? <Tag color="success-green">Published</Tag> : <Tag color="column">Draft</Tag>;
}

/* Where something is filed: its folder and its tags. A tag can be clicked to
   show everything else that carries it. */
export function Filing({ folder, tags = [], activeTag, onTag }) {
  if (!folder && !tags.length) return null;
  return (
    <div className="lib-card__filing">
      {folder && <span className="lib-folder"><FolderSimple size={13} /> {folder}</span>}
      {tags.map((t) => (onTag ? (
        <button key={t} type="button" className={`lib-tag${activeTag === t ? " lib-tag--on" : ""}`} onClick={() => onTag(activeTag === t ? null : t)}>{t}</button>
      ) : (
        <span key={t} className="lib-tag lib-tag--static">{t}</span>
      )))}
    </div>
  );
}

/* Name, description, folder and tags: everything the agent reads about a
   component or a template. `fixed` hides the name and description, for a
   library template whose wording is not the workspace's to change. */
export function DetailsDialog({ title, noun = "component", item, folders = [], fixed = false, confirmLabel = "Save", hint, onSave, onClose }) {
  const [name, setName] = useState(item.name || "");
  const [description, setDescription] = useState(item.description || "");
  const [folder, setFolder] = useState(item.folder || "");
  const [tags, setTags] = useState((item.tags || []).join(", "));
  const missing = !fixed && !name.trim();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    if (missing) return;
    const filing = { folder: folder.trim(), tags: parseTags(tags) };
    onSave(fixed ? filing : { name: name.trim(), description: description.trim(), ...filing });
    onClose();
  };

  return (
    <div className="lib-dialog__scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <Dialog size="md" title={title} cancelLabel="Cancel" confirmLabel={confirmLabel} onClose={onClose} onCancel={onClose} onConfirm={save} className="lib-dialog lib-dialog--form">
          {!fixed && (
            <>
              <TextInput
                label="Name"
                placeholder={`${noun[0].toUpperCase()}${noun.slice(1)} name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={missing}
                errorMessage={`Give the ${noun} a name.`}
                autoFocus
              />
              <TextArea
                label="Description"
                placeholder={`When should this ${noun} be used?`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </>
          )}
          <div className="lib-dialog__row">
            <TextInput label="Folder" placeholder="No folder" value={folder} onChange={(e) => setFolder(e.target.value)} />
            <TextInput label="Tags" placeholder="demo, webinar" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          {folders.length > 0 && (
            <div className="lib-card__filing">
              <span className="lib-folder">Your folders:</span>
              {folders.map((f) => (
                <button key={f} type="button" className={`lib-tag${folder.trim() === f ? " lib-tag--on" : ""}`} onClick={() => setFolder(f)}>{f}</button>
              ))}
            </div>
          )}
          <p className="lib-dialog__hint lib-dialog__hint--flush">
            {hint || `The agent reads the name, description, folder and tags to decide when to use this ${noun}. Separate tags with commas.`}
          </p>
        </Dialog>
      </div>
    </div>
  );
}
