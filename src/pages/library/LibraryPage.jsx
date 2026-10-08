/**
 * Library: what the agent may build landing pages from.
 *
 * Components and Templates each have two views: "My workspace" (what this
 * workspace has taken, with a draft or published status, filed in folders
 * with tags) and "Library" (everything that can be added). Design system shows the brand
 * every section is drawn with. Each preview is the real section, rendered at
 * 1200px and scaled down, so what is on the card is what would be on the page.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Browser, DiamondsFour, GlobeSimple, ChatCircleDots, CheckCircle, Copy, FunnelSimple, ImageSquare, Layout, PencilSimple, Shapes, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, Dialog, Dropdown, Tag, TextInput, Tooltip } from "@/ui";
import { CATEGORIES, COLOR_ROLES, COMPONENTS, GOOGLE_FONTS, SIZE_LIMITS, TEMPLATES, componentById, fontStack } from "../../mocks/library";
import { DetailsDialog, Filing, ScaledPreview, Section, StatusTag } from "./parts";
import useDesignStore, { loadFont } from "./useDesignStore";
import useLibraryStore, { foldersOf, workspaceTemplates } from "./useLibraryStore";
import usePagesStore, { pageUrl } from "./usePagesStore";
import useCreativesStore, { flat } from "./useCreativesStore";
import { Artboard, Fit } from "./CreativeEditorPage";
import { formatById, kindById, styleById } from "../../mocks/creatives";
import ComposerMenu from "../harness/ComposerMenu";
import ImportBrandDialog from "./ImportBrandDialog";
import "./creative.css";
import "./library.css";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/* Nothing to show: an icon for what belongs here, one line on how it gets
   here, and the one action that starts it. */
function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="lib-empty">
      {Icon && (
        <span className="lib-empty__icon">
          <Icon size={22} />
        </span>
      )}
      <span className="lib-empty__title">{title}</span>
      <span className="lib-empty__text">{text}</span>
      {action && <div className="lib-empty__action">{action}</div>}
    </div>
  );
}

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

/* ── Cards ─────────────────────────────────────────────────────────────── */

/* A component the workspace has taken: its status and what can be done to it. */
function WorkspaceCard({ item, activeTag, onTag, onOpen, onPublish, onUnpublish, onChat, onEdit, onDuplicate, onRemove }) {
  const published = item.status === "published";
  return (
    <article className="lib-card">
      <button type="button" className="lib-card__preview" onClick={onOpen} aria-label={`Preview ${item.name}`}>
        <span className="lib-card__canvas"><ScaledPreview height={190}><Section item={item} /></ScaledPreview></span>
      </button>
      <div className="lib-card__body">
        <div className="lib-card__meta">
          <span className="lib-card__category lib-card__category--component"><DiamondsFour size={12} /> {componentById(item.sourceId)?.category}</span>
          <StatusTag status={item.status} />
        </div>
        <h3 className="lib-card__name">{item.name}</h3>
        <p className="lib-card__text">{item.description}</p>
        <Filing folder={item.folder} tags={item.tags} activeTag={activeTag} onTag={onTag} />
      </div>
      <div className="lib-card__actions">
        <div className="lib-card__main">
          {published ? (
            <Button variant="secondaryGhost" size="md" label="Move to draft" onClick={onUnpublish} />
          ) : (
            <Button variant="secondary" size="md" label="Publish" onClick={onPublish} />
          )}
          <Button variant="secondaryGhost" size="md" label="Edit in chat" icon={ChatCircleDots} onClick={onChat} />
        </div>
        <div className="lib-card__tools">
          <Tooltip title="Edit details, folder and tags">
            <Button variant="ghost" size="md" icon={PencilSimple} aria-label={`Edit ${item.name}`} onClick={onEdit} />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button variant="ghost" size="md" icon={Copy} aria-label={`Duplicate ${item.name}`} onClick={onDuplicate} />
          </Tooltip>
          <Tooltip title="Remove from workspace">
            <Button variant="ghost" size="md" icon={Trash} aria-label={`Remove ${item.name}`} onClick={onRemove} />
          </Tooltip>
        </div>
      </div>
    </article>
  );
}

/* A component in the library, not yet taken or already taken. */
function LibraryCard({ item, added, onOpen, onAdd }) {
  return (
    <article className="lib-card">
      <button type="button" className="lib-card__preview" onClick={onOpen} aria-label={`Preview ${item.name}`}>
        <span className="lib-card__canvas"><ScaledPreview height={190}><Section id={item.id} /></ScaledPreview></span>
      </button>
      <div className="lib-card__body">
        <span className="lib-card__category lib-card__category--component"><DiamondsFour size={12} /> {item.category}</span>
        <h3 className="lib-card__name">{item.name}</h3>
        <p className="lib-card__text">{item.description}</p>
      </div>
      <div className="lib-card__actions">
        {added ? (
          <span className="lib-card__added"><CheckCircle size={14} weight="fill" /> In workspace</span>
        ) : (
          <Button variant="secondary" size="md" label="Add to workspace" icon={Plus} onClick={onAdd} />
        )}
      </div>
    </article>
  );
}

function TemplateCard({ item, added, readiness, activeTag, onTag, onOpen, onAdd, onRemove, onEdit }) {
  return (
    <article className="lib-card">
      <button type="button" className="lib-card__preview" onClick={onOpen} aria-label={`Preview ${item.name}`}>
        <span className="lib-card__canvas">
          <ScaledPreview height={320}>
            {item.snapshots
              ? item.snapshots.map((s, i) => <Section key={i} item={s} />)
              : item.sections.map((id) => <Section key={id} id={id} />)}
          </ScaledPreview>
        </span>
      </button>
      <div className="lib-card__body">
        <div className="lib-card__meta">
          <span className="lib-card__category">{plural(item.sections.length, "section")}</span>
          {item.saved && <Tag color="column">Saved from a page</Tag>}
          {!item.saved && readiness && (readiness.ready
            ? <Tag color="success-green">Ready to use</Tag>
            : <Tag color="column">{readiness.published} of {item.sections.length} published</Tag>)}
        </div>
        <h3 className="lib-card__name">{item.name}</h3>
        <p className="lib-card__text">{item.description}</p>
        {readiness && <Filing folder={item.folder} tags={item.tags} activeTag={activeTag} onTag={onTag} />}
      </div>
      <div className="lib-card__actions">
        {added && !readiness && <span className="lib-card__added"><CheckCircle size={14} weight="fill" /> In workspace</span>}
        {added && readiness && (
          <>
            <Button variant="secondaryGhost" size="md" label="Remove" onClick={onRemove} />
            <div className="lib-card__tools">
              <Tooltip title={item.saved ? "Edit details, folder and tags" : "Edit folder and tags"}>
                <Button variant="ghost" size="md" icon={PencilSimple} aria-label={`Edit ${item.name}`} onClick={onEdit} />
              </Tooltip>
            </div>
          </>
        )}
        {!added && <Button variant="secondary" size="md" label="Add to workspace" icon={Plus} onClick={onAdd} />}
      </div>
    </article>
  );
}

/* ── Dialogs ───────────────────────────────────────────────────────────── */

/* A larger look at one component or template. */
function PreviewDialog({ title, description, sections, snapshots, item, confirmLabel, onConfirm, onClose }) {
  useEscape(onClose);
  return (
    <div className="lib-dialog__scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <Dialog
          size="lg"
          title={title}
          cancelLabel="Close"
          confirmLabel={confirmLabel}
          onClose={onClose}
          onCancel={onClose}
          onConfirm={() => { onConfirm(); onClose(); }}
          className="lib-dialog"
        >
          <p className="lib-dialog__text">{description}</p>
          <div className="lib-dialog__frame">
            <ScaledPreview>
              {item ? <Section item={item} />
                : snapshots ? snapshots.map((s, i) => <Section key={i} item={s} />)
                : sections.map((id, i) => <Section key={`${id}-${i}`} id={id} />)}
            </ScaledPreview>
          </div>
          {sections.length > 1 && (
            <ol className="lib-dialog__sections">
              {sections.map((id) => <li key={id}>{componentById(id)?.name}</li>)}
            </ol>
          )}
        </Dialog>
      </div>
    </div>
  );
}

/* One row above a grid: what is shown on the left, its filters as menus on
   the right. */
function Toolbar({ lead, children }) {
  return (
    <div className="lib-sort">
      {lead}
      <div className="lib-sort__filters">{children}</div>
    </div>
  );
}

/* The folders in use, as a menu, with the tag picked on a card beside it. */
function FolderFilter({ folders, list, folder, onFolder, tag, onTag }) {
  if (!folders.length && !tag) return null;
  const options = [
    { id: "all", label: `All ${list.length}` },
    ...folders.map((f) => ({ id: f, label: `${f} ${list.filter((x) => x.folder === f).length}` })),
  ];
  return (
    <>
      {tag && <button type="button" className="lib-tag lib-tag--on" onClick={() => onTag(null)}>Tagged {tag} ×</button>}
      {folders.length > 0 && (
        <ComposerMenu label="Folder" value={folder || "all"} options={options} onChange={(id) => onFolder(id === "all" ? null : id)} />
      )}
    </>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────── */

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "published", label: "Published" },
];

function WorkspaceComponents({ lead, onPreview, onBrowse }) {
  const navigate = useNavigate();
  const { items, setStatus, duplicate, remove, updateDetails } = useLibraryStore();
  const [filter, setFilter] = useState("all");
  const [folder, setFolder] = useState(null);
  const [tag, setTag] = useState(null);
  const [editing, setEditing] = useState(null);
  const count = (id) => (id === "all" ? items.length : items.filter((i) => i.status === id).length);
  const folders = foldersOf(items);
  const shown = items.filter((i) => (filter === "all" || i.status === filter) && (!folder || i.folder === folder) && (!tag || i.tags.includes(tag)));

  const publish = (item) => { setStatus(item.uid, "published"); toast.success(`${item.name} published.`); };
  const unpublish = (item) => { setStatus(item.uid, "draft"); toast.success(`${item.name} moved to draft.`); };

  if (items.length === 0) {
    return (
      <>
        <Toolbar lead={lead} />
        <Empty
          icon={Shapes}
          title="Your workspace has no components yet"
          text="Add components from the library, then publish the ones you want used."
          action={<Button variant="secondary" size="md" label="Browse the library" onClick={onBrowse} />}
        />
      </>
    );
  }

  return (
    <>
      <Toolbar lead={lead}>
        <FolderFilter folders={folders} list={items} folder={folder} onFolder={setFolder} tag={tag} onTag={setTag} />
        <ComposerMenu
          label="Status"
          value={filter}
          options={STATUS_FILTERS.map((f) => ({ id: f.id, label: `${f.label} ${count(f.id)}` }))}
          onChange={setFilter}
        />
      </Toolbar>
      {shown.length === 0 ? (
        <Empty
          icon={FunnelSimple}
          title="No components match these filters"
          text="Nothing has this status, folder and tag together."
          action={<Button variant="secondary" size="md" label="Clear filters" onClick={() => { setFilter("all"); setFolder(null); setTag(null); }} />}
        />
      ) : (
        <div className="lib-grid">
          {shown.map((item) => (
            <WorkspaceCard
              key={item.uid}
              item={item}
              activeTag={tag}
              onTag={setTag}
              onOpen={() =>
                onPreview({
                  title: item.name,
                  description: item.description,
                  sections: [item.sourceId],
                  item,
                  confirmLabel: item.status === "published" ? "Move to draft" : "Publish",
                  onConfirm: () => (item.status === "published" ? unpublish(item) : publish(item)),
                })
              }
              onPublish={() => publish(item)}
              onUnpublish={() => unpublish(item)}
              onChat={() => navigate(`/library/components/${item.uid}`)}
              onEdit={() => setEditing(item)}
              onDuplicate={() => { duplicate(item.uid); toast.success(`Copy of ${item.name} added as a draft.`); }}
              onRemove={() => { remove(item.uid); toast.success(`${item.name} removed from your workspace.`); }}
            />
          ))}
        </div>
      )}
      {editing && (
        <DetailsDialog
          title="Component details"
          item={editing}
          folders={folders}
          onClose={() => setEditing(null)}
          onSave={(details) => { updateDetails(editing.uid, details); toast.success("Saved."); }}
        />
      )}
    </>
  );
}

function LibraryComponents({ lead, onPreview }) {
  const { items, addComponent } = useLibraryStore();
  const [category, setCategory] = useState("All");
  const shown = COMPONENTS.filter((c) => category === "All" || c.category === category);
  const add = (c) => { addComponent(c.id); toast.success(`${c.name} added as a draft.`); };

  return (
    <>
      <Toolbar lead={lead}>
        <ComposerMenu
          label="Type"
          value={category}
          options={["All", ...CATEGORIES].map((c) => ({ id: c, label: c }))}
          onChange={setCategory}
        />
      </Toolbar>
      <div className="lib-grid">
        {shown.map((c) => {
          const added = items.some((i) => i.sourceId === c.id);
          return (
            <LibraryCard
              key={c.id}
              item={c}
              added={added}
              onAdd={() => add(c)}
              onOpen={() =>
                onPreview({
                  title: c.name,
                  description: c.description,
                  sections: [c.id],
                  confirmLabel: added ? "Add another copy" : "Add to workspace",
                  onConfirm: () => add(c),
                })
              }
            />
          );
        })}
      </div>
    </>
  );
}

function Templates({ lead, scope, onPreview, onBrowse }) {
  const library = useLibraryStore();
  const { items, addTemplate, removeTemplate, updateTemplate } = library;
  const [folder, setFolder] = useState(null);
  const [tag, setTag] = useState(null);
  const [editing, setEditing] = useState(null);
  const inWorkspace = scope === "workspace";
  const mine = workspaceTemplates(library);
  const shown = inWorkspace ? mine.filter((t) => (!folder || t.folder === folder) && (!tag || t.tags.includes(tag))) : TEMPLATES;
  const publishedSources = new Set(items.filter((i) => i.status === "published").map((i) => i.sourceId));
  const folders = foldersOf([...mine, ...items]);

  const add = (t) => {
    const added = addTemplate(t.id);
    toast.success(added ? `${t.name} added, with ${plural(added, "component")} as drafts.` : `${t.name} added to your workspace.`);
  };

  if (inWorkspace && mine.length === 0) {
    return (
      <>
        <Toolbar lead={lead} />
        <Empty
          icon={Layout}
          title="Your workspace has no templates yet"
          text="A template is a page layout made of components. Add one from the library, or save a page you built as one."
          action={<Button variant="secondary" size="md" label="Browse the library" onClick={onBrowse} />}
        />
      </>
    );
  }

  return (
    <>
      <Toolbar lead={lead}>
        {inWorkspace && (
          <FolderFilter folders={foldersOf(mine)} list={mine} folder={folder} onFolder={setFolder} tag={tag} onTag={setTag} />
        )}
      </Toolbar>
      {shown.length === 0 ? (
        <Empty
          icon={FunnelSimple}
          title="No templates match these filters"
          text="Nothing is in this folder with this tag."
          action={<Button variant="secondary" size="md" label="Clear filters" onClick={() => { setFolder(null); setTag(null); }} />}
        />
      ) : (
        <div className="lib-grid lib-grid--templates">
          {shown.map((t) => {
            const added = mine.some((m) => m.id === t.id);
            const published = t.sections.filter((id) => publishedSources.has(id)).length;
            const remove = () => { removeTemplate(t.id); toast.success(`${t.name} removed from your workspace.`); };
            return (
              <TemplateCard
                key={t.id}
                item={t}
                added={added}
                readiness={inWorkspace ? { published, ready: published === t.sections.length } : null}
                activeTag={tag}
                onTag={setTag}
                onAdd={() => add(t)}
                onRemove={remove}
                onEdit={() => setEditing(t)}
                onOpen={() =>
                  onPreview({
                    title: t.name,
                    description: t.description,
                    sections: t.sections,
                    snapshots: t.snapshots,
                    confirmLabel: added ? "Remove from workspace" : "Add to workspace",
                    onConfirm: () => (added ? remove() : add(t)),
                  })
                }
              />
            );
          })}
        </div>
      )}
      {editing && (
        <DetailsDialog
          title="Template details"
          noun="template"
          item={editing}
          folders={folders}
          fixed={!editing.saved}
          onClose={() => setEditing(null)}
          onSave={(details) => { updateTemplate(editing.id, details); toast.success("Saved."); }}
        />
      )}
    </>
  );
}

/* A slider with its value beside it. */
function Range({ label, value, unit = "px", limits, onChange }) {
  return (
    <label className="lib-range">
      <span className="lib-range__head">
        <span>{label}</span>
        <span className="lib-range__value">{value}{unit}</span>
      </span>
      <input
        type="range"
        className="lib-range__input"
        min={limits[0]}
        max={limits[1]}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/* One colour: a picker and a hex field that stay in step. */
function ColorRow({ role, value, onChange }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const typed = (next) => {
    setText(next);
    if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toUpperCase());
  };
  return (
    <li className="lib-color">
      <input
        type="color"
        className="lib-color__picker"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        aria-label={`${role.name} colour`}
      />
      <span className="lib-color__name">{role.name}</span>
      <input
        className="lib-color__hex"
        value={text}
        onChange={(e) => typed(e.target.value.trim())}
        onBlur={() => setText(value)}
        maxLength={7}
        spellCheck={false}
        aria-label={`${role.name} hex value`}
      />
      {role.use && <span className="lib-color__use">{role.use}</span>}
    </li>
  );
}

const FONT_OPTIONS = GOOGLE_FONTS.map((f) => ({ value: f.name, label: `${f.name} · ${f.kind}` }));
const SAMPLE_PAGE = ["header-simple", "hero-split", "feature-grid", "pricing-three", "cta-banner"];

// Brand colours a workspace can start from; Custom takes any hex.
const PRIMARY_PRESETS = ["#0F766E", "#3661ED", "#0EA5E9", "#16A34A", "#D97706", "#DC2626", "#0F172A"];

/* One setting: what it is on the left, the control on the right. */
function Row({ title, desc, children }) {
  return (
    <div className="lib-design__row">
      <div className="lib-design__rowlabel">
        <h4 className="lib-design__rowtitle">{title}</h4>
        {desc && <p className="lib-design__rowdesc">{desc}</p>}
      </div>
      <div className="lib-design__rowbody">{children}</div>
    </div>
  );
}

function DesignSystemTab({ onImport }) {
  const { design, setDesign, setColor, reset } = useDesignStore();
  const fileRef = useRef(null);

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file: PNG, JPG, SVG or WebP.");
    const reader = new FileReader();
    reader.onload = () => setDesign({ logo: reader.result });
    reader.readAsDataURL(file);
  };
  const pickFont = (key) => (name) => { loadFont(name); setDesign({ [key]: name }); };

  return (
    <div className="lib-design">
      <div className="lib-design__tokens">
        <Row title="Import from your website" desc="Reads your colours, fonts, corners and logo from your homepage.">
          <div><Button variant="secondary" size="md" icon={GlobeSimple} iconPosition="prefix" label="Import from website" onClick={onImport} /></div>
        </Row>

        <Row title="Brand name" desc="Used wherever there is no logo.">
          <TextInput label="" placeholder="Your company" value={design.brand} onChange={(e) => setDesign({ brand: e.target.value })} aria-label="Brand name" />
        </Row>

        <Row title="Company logo" desc="Shown in headers and footers.">
          <div className="lib-logo">
            <div className="lib-logo__box">
              {design.logo
                ? <img className="lib-logo__img" src={design.logo} alt={`${design.brand} logo`} />
                : <span className="lib-logo__empty">No logo yet</span>}
            </div>
            <Button
              variant="secondary"
              size="md"
              icon={UploadSimple}
              label={design.logo ? "Replace logo" : "Upload logo"}
              onClick={() => fileRef.current?.click()}
            />
            {design.logo && <Button variant="ghost" size="md" label="Remove" onClick={() => setDesign({ logo: null })} />}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="lib-logo__file"
              onChange={onLogo}
              aria-label="Logo file"
            />
          </div>
        </Row>

        <Row title="Brand colour" desc="Buttons, links and highlights.">
          <div className="lib-swatches" role="group" aria-label="Brand colour">
            {PRIMARY_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={design.colors.primary === c}
                className={`lib-swatch${design.colors.primary === c ? " lib-swatch--on" : ""}`}
                style={{ background: c }}
                onClick={() => setColor("primary", c)}
              />
            ))}
          </div>
          <ul className="lib-colors">
            <ColorRow role={{ key: "primary", name: "Custom", use: "" }} value={design.colors.primary} onChange={(v) => setColor("primary", v)} />
          </ul>
        </Row>

        <Row title="Palette" desc="The rest of the page follows these.">
          <ul className="lib-colors">
            {COLOR_ROLES.filter((r) => r.key !== "primary").map((role) => (
              <ColorRow key={role.key} role={role} value={design.colors[role.key]} onChange={(v) => setColor(role.key, v)} />
            ))}
          </ul>
        </Row>

        <Row title="Headings" desc="Any free Google Font.">
          <div className="lib-design__pair">
            <Dropdown label="Font" options={FONT_OPTIONS} value={design.headFont} onChange={pickFont("headFont")} />
            <Range label="Size" value={design.headSize} limits={SIZE_LIMITS.headSize} onChange={(v) => setDesign({ headSize: v })} />
          </div>
          <p className="lib-design__sample lib-design__sample--head" style={{ fontFamily: fontStack(design.headFont) }}>
            Forecast revenue you can defend
          </p>
        </Row>

        <Row title="Body text" desc="Paragraphs, labels and buttons.">
          <div className="lib-design__pair">
            <Dropdown label="Font" options={FONT_OPTIONS} value={design.bodyFont} onChange={pickFont("bodyFont")} />
            <Range label="Size" value={design.bodySize} limits={SIZE_LIMITS.bodySize} onChange={(v) => setDesign({ bodySize: v })} />
          </div>
          <p className="lib-design__sample" style={{ fontFamily: fontStack(design.bodyFont) }}>
            {design.brand || "Your product"} turns pipeline data into a forecast your board can trust.
          </p>
        </Row>

        <Row title="Corners" desc="Buttons, fields and cards.">
          <Range label="Radius" value={design.radius} limits={SIZE_LIMITS.radius} onChange={(v) => setDesign({ radius: v })} />
        </Row>

        <div className="lib-design__reset">
          <Button variant="ghost" size="md" label="Reset to defaults" onClick={() => { reset(); toast.success("Design system reset."); }} />
        </div>
      </div>

      <div className="lib-design__live">
        <div className="lib-design__live-head">
          <h3 className="lib-label">Live preview</h3>
          <span className="lib-design__hint">Changes show here as you make them.</span>
        </div>
        <div className="lib-design__frame">
          <ScaledPreview>{SAMPLE_PAGE.map((id) => <Section key={id} id={id} />)}</ScaledPreview>
        </div>
      </div>
    </div>
  );
}

/* The landing pages built in chat. */
function PagesTab({ onBuild }) {
  const navigate = useNavigate();
  const pages = usePagesStore((s) => s.pages).filter((p) => p.sections.length > 0);

  if (pages.length === 0) {
    return (
      <Empty
        icon={Browser}
        title="No landing pages yet"
        text="Ask for one in chat. It is built from the components you have published."
        action={<Button variant="secondary" size="md" label="Ask in chat" onClick={onBuild} />}
      />
    );
  }
  return (
    <div className="lib-grid lib-grid--templates">
      {pages.map((p) => {
        const open = () => navigate(`/library/pages/${p.id}`);
        const live = p.status === "published";
        return (
          <article key={p.id} className="lib-card">
            <button type="button" className="lib-card__preview" onClick={open} aria-label={`Open ${p.name}`}>
              <span className="lib-card__canvas"><ScaledPreview height={320}>{p.sections.map((s) => <Section key={s.key} item={s} />)}</ScaledPreview></span>
            </button>
            <div className="lib-card__body">
              <div className="lib-card__meta">
                <span className="lib-card__category">{plural(p.sections.length, "section")}</span>
                {!live && <Tag color="column">Draft</Tag>}
                {live && (p.unpublished ? <Tag color="warning-yellow">Unpublished changes</Tag> : <Tag color="success-green">Published</Tag>)}
              </div>
              <h3 className="lib-card__name">{p.name}</h3>
              <p className="lib-card__text">{live ? pageUrl(p) : "Not published yet"}</p>
            </div>
            <div className="lib-card__actions">
              <Button variant="secondary" size="md" label="Open" onClick={open} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* The ad creatives made in chat. */
function CreativesTab({ onMake }) {
  const navigate = useNavigate();
  const creatives = useCreativesStore((s) => s.creatives).filter((c) => c.slides.length > 0);

  if (creatives.length === 0) {
    return (
      <Empty
        icon={ImageSquare}
        title="No ad creatives yet"
        text="Ask for one in chat: an image, a carousel or a video storyboard, for LinkedIn or Meta, in your design system."
        action={<Button variant="secondary" size="md" label="Make an ad creative" onClick={onMake} />}
      />
    );
  }
  return (
    <div className="lib-grid lib-grid--templates">
      {creatives.map((c) => {
        const open = () => navigate(`/library/creatives/${c.id}`);
        const format = formatById(c.format);
        return (
          <article key={c.id} className="lib-card">
            <button type="button" className="lib-card__preview" onClick={open} aria-label={`Open ${c.name}`}>
              <span className="cr-thumb"><Fit w={format.w} h={format.h}><Artboard creative={flat(c, 0)} /></Fit></span>
            </button>
            <div className="lib-card__body">
              <div className="lib-card__meta">
                <span className="lib-card__category">{format.platform}</span>
                {c.status === "approved" ? <Tag color="success-green">Approved</Tag> : <Tag color="column">Draft</Tag>}
              </div>
              <h3 className="lib-card__name">{c.name}</h3>
              <p className="lib-card__text">
                {styleById(c.style).label} {kindById(c.kind).label.toLowerCase()}{c.slides.length > 1 ? `, ${c.slides.length} ${kindById(c.kind).unit}s` : ""} · {format.label} · {format.size}
              </p>
            </div>
            <div className="lib-card__actions">
              <Button variant="secondary" size="md" label="Open" onClick={open} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "components", label: "Components" },
  { id: "templates", label: "Templates" },
  { id: "design", label: "Design system" },
  { id: "pages", label: "Pages" },
  { id: "creatives", label: "Creatives" },
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const library = useLibraryStore();
  const { items } = library;
  const templates = workspaceTemplates(library);
  const [tab, setTab] = useState(location.state?.tab || "components");
  const build = () => navigate("/home");
  const [scope, setScope] = useState("workspace");
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const scopes = tab === "templates"
    ? [{ id: "workspace", label: "My workspace", count: templates.length }, { id: "library", label: "Library", count: TEMPLATES.length }]
    : [{ id: "workspace", label: "My workspace", count: items.length }, { id: "library", label: "Library", count: COMPONENTS.length }];

  const lead = (
    <div className="lib-scope" role="group" aria-label="Show">
      {scopes.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-pressed={scope === s.id}
          className={`lib-scope__option${scope === s.id ? " lib-scope__option--active" : ""}`}
          onClick={() => setScope(s.id)}
        >
          {s.label}
          <span className="lib-scope__count">{s.count}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="lib">
      <header className="lib__header">
        <h1 className="lib__title">Library</h1>
        <Button variant="secondary" size="md" icon={GlobeSimple} iconPosition="prefix" label="Import from website" onClick={() => setImporting(true)} />
      </header>

      {/* The same tabs bar as Data Hub. */}
      <div className="lib-tabs" role="tablist" aria-label="Library">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`lib-tabs__tab${tab === t.id ? " lib-tabs__tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="lib__canvas">
        <div className="lib__card">
          {tab === "components" && scope === "workspace" && (
            <WorkspaceComponents lead={lead} onPreview={setPreview} onBrowse={() => setScope("library")} />
          )}
          {tab === "components" && scope === "library" && <LibraryComponents lead={lead} onPreview={setPreview} />}
          {tab === "templates" && <Templates lead={lead} scope={scope} onPreview={setPreview} onBrowse={() => setScope("library")} />}
          {tab === "design" && <DesignSystemTab onImport={() => setImporting(true)} />}
          {tab === "pages" && <PagesTab onBuild={build} />}
          {tab === "creatives" && <CreativesTab onMake={() => navigate("/library/creatives/new")} />}
        </div>
      </div>

      {preview && <PreviewDialog {...preview} onClose={() => setPreview(null)} />}
      {importing && (
        <ImportBrandDialog
          onClose={() => setImporting(false)}
          onApplied={(brand, host) => {
            setImporting(false);
            setTab("design");
            toast.success(`${brand}'s design system imported from ${host}.`);
          }}
        />
      )}
    </div>
  );
}
