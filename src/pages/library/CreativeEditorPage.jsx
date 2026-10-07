/**
 * Making an ad creative in chat.
 *
 * Chat on the left, the artboard on the right. The first message makes the
 * creative; after that every part of it is a layer that can be picked. A
 * picked layer shows above the text box, so the next message applies to it,
 * and the tools above the artboard change it by hand: size, colour, hide.
 * Layers can be dragged, and text can be typed over with a double-click.
 * While the first version is being made, the artboard shows a loader.
 *
 * A carousel or a video has more than one slide: the strip under the artboard
 * moves between its cards or scenes, and a video can be played through as a
 * storyboard, each scene held for its length.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toBlob } from "html-to-image";
import { zipSync } from "fflate";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowCounterClockwise, CaretDown, CaretLeft, DownloadSimple, Eye, EyeSlash, FileZip, ImageSquare, Minus, Play, Plus, Stop,
  TextAlignCenter, TextAlignLeft, TextT, Trash, UploadSimple, UserCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, Tag, Tooltip } from "@/ui";
import { fontStack, readableOn } from "../../mocks/library";
import {
  COLOR_CHOICES, CREATIVE_GREETING, FORMATS, KINDS, MAX_SLIDES, STYLES, askWith, buildCreative, creativeDirections,
  creativeQuestions, creativeReply, formatById, formatFor, kindById, layerName, recolor, resolveColor, styleFrom,
} from "../../mocks/creatives";
import { apiPost } from "../../api";
import ComposerMenu from "../harness/ComposerMenu";
import ChatPane from "./ChatPane";
import DiffusionLoader from "./DiffusionLoader";
import { AskCard, DirectionCard, summarise } from "./Intake";
import { ProductShot } from "./sections";
import useCreativesStore, { flat } from "./useCreativesStore";
import useDesignStore, { useDesignVars } from "./useDesignStore";
import "./library.css";
import "./creative.css";

const FORMAT_OPTIONS = FORMATS.map((f) => ({ id: f.id, label: f.label, description: f.size }));
const KIND_OPTIONS = KINDS.map(({ id, label, description }) => ({ id, label, description }));
const STYLE_OPTIONS = STYLES.map(({ id, label, description }) => ({ id, label, description }));
// What to ask for, in words, when a type or style is picked from the menus.
const KIND_ASK = { image: "make it a single image", carousel: "make it a carousel", video: "make it a video" };
const STYLE_ASK = { professional: "make it professional", meme: "make it a meme", ugc: "make it ugc" };
// A meme or a customer's post needs a real picture, which only the user has.
const PLACEHOLDER = {
  meme: { icon: ImageSquare, text: "Your picture goes here" },
  ugc: { icon: UserCircle, text: "Customer photo or clip" },
};
const SCALE_LIMITS = [0.5, 2];
const BUILD_MS = 3200;
const typing = (el) => el?.isContentEditable || ["INPUT", "TEXTAREA"].includes(el?.tagName);

/* Text that can be typed over once its layer is being edited. */
function EditableText({ text, editing, onCommit }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!editing || !ref.current) return;
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }, [editing]);
  return (
    <span
      ref={ref}
      className="cr-text"
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={(e) => editing && onCommit(e.currentTarget.textContent.trim())}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); e.currentTarget.blur(); } }}
    >
      {text}
    </span>
  );
}

/* One slide of a creative, drawn at its real size. `creative` is the creative
   with that slide's bg, align and layers alongside (see `flat`). With `onPick`
   its layers can be picked, dragged and typed over; without, it is a still
   picture. */
export function Artboard({ creative, picked, editing, onPick, onDragStart, onEdit, onCommit }) {
  const design = useDesignStore((s) => s.design);
  const vars = useDesignVars();
  const format = formatById(creative.format);
  const live = !!onPick;
  const image = creative.layers.find((l) => l.kind === "image");
  const color = (c) => resolveColor(c, design);

  const frame = (layer, style, children) => (
    <div
      key={layer.id}
      data-layer={layer.id}
      className={`cr-layer cr-layer--${layer.id}${picked === layer.id ? " cr-layer--on" : ""}${editing === layer.id ? " cr-layer--editing" : ""}`}
      style={style}
      onPointerDown={live ? (e) => onDragStart(e, layer) : undefined}
      onDoubleClick={live && layer.text !== undefined ? () => onEdit(layer.id) : undefined}
    >
      {children}
    </div>
  );

  const draw = (layer) => {
    if (!layer || layer.hidden) return null;
    const size = (format.base[layer.id] || 24) * layer.scale;
    const move = `translate(${layer.dx}px, ${layer.dy}px)`;
    const words = live
      ? <EditableText key={`${layer.text}-${editing === layer.id}`} text={layer.text} editing={editing === layer.id} onCommit={(text) => onCommit(layer.id, text)} />
      : layer.text;

    if (layer.kind === "logo") {
      return frame(layer, { transform: move, fontSize: size, color: color(layer.color), fontFamily: fontStack(design.headFont) },
        design.logo
          ? <img className="cr-logo__img" src={design.logo} alt={design.brand} draggable={false} />
          : <><span className="cr-logo__mark" />{design.brand}</>);
    }
    if (layer.kind === "button") {
      const fill = color(layer.color);
      return frame(layer, { transform: move, fontSize: size, background: fill, color: readableOn(fill), borderRadius: design.radius * (size / 14) }, words);
    }
    if (layer.kind === "image") {
      const empty = PLACEHOLDER[creative.style];
      return frame(layer, { transform: `${move} scale(${layer.scale})` },
        layer.src
          ? <img className="cr-image__upload" src={layer.src} alt="" draggable={false} style={{ borderRadius: design.radius * 2 }} />
          : empty
            ? <div className="cr-image__empty" style={{ borderRadius: design.radius * 2 }}><empty.icon size={format.base.headline} weight="light" />{empty.text}</div>
            : <div className="lp cr-image__shot" style={vars}><ProductShot /></div>);
    }
    return frame(layer, { transform: move, fontSize: size, color: color(layer.color), fontFamily: fontStack(layer.font === "head" ? design.headFont : design.bodyFont) }, words);
  };

  const byId = (id) => creative.layers.find((l) => l.id === id);
  return (
    <div
      data-layer="background"
      className={`cr-art cr-art--${format.shape} cr-art--${creative.align} cr-art--${creative.style}${!image || image.hidden ? " cr-art--no-image" : ""}${picked === "background" ? " cr-art--on" : ""}${live ? " cr-art--live" : ""}`}
      style={{ width: format.w, height: format.h, background: color(creative.bg), fontFamily: fontStack(design.bodyFont) }}
      onPointerDown={live ? (e) => { if (e.target === e.currentTarget || e.target.classList.contains("cr-art__copy")) onPick("background"); } : undefined}
    >
      {draw(byId("logo"))}
      <div className="cr-art__copy">{["eyebrow", "headline", "body", "cta"].map((id) => draw(byId(id)))}</div>
      {draw(image)}
    </div>
  );
}

/* Fits its child, drawn at w × h, inside the space it is given. */
export function Fit({ w, h, children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const box = ref.current;
      if (box?.clientWidth) setScale(Math.min(box.clientWidth / w, box.clientHeight / h));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [w, h]);
  return (
    <div ref={ref} className="cr-fit">
      <div className="cr-fit__box" data-scale={scale} style={{ width: w * scale, height: h * scale, visibility: scale ? "visible" : "hidden", "--cr-scale": scale || 1 }}>
        <div className="cr-fit__stage" style={{ transform: `scale(${scale})` }}>{children}</div>
      </div>
    </div>
  );
}

const save = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// The page's Google fonts as one stylesheet with the font files inside it, so
// an exported image carries its type. Read once per set of fonts: the
// stylesheets are fetched (the browser will not let a script read them in
// place) and only the Latin faces are kept.
const fontCache = { key: null, css: "" };
async function embeddedFonts() {
  const hrefs = [...document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]')].map((l) => l.href);
  const key = hrefs.join(" ");
  if (fontCache.key === key) return fontCache.css;
  const sheets = await Promise.all(hrefs.map((h) => fetch(h).then((r) => r.text()).catch(() => "")));
  let css = sheets.join("\n").split(/(?=\/\*)/).filter((block) => block.startsWith("/* latin */")).join("\n");
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  const files = await Promise.all(urls.map(async (url) => {
    const blob = await fetch(url).then((r) => r.blob());
    const data = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); });
    return [url, data];
  }));
  for (const [url, data] of files) css = css.split(url).join(data);
  Object.assign(fontCache, { key, css });
  return css;
}

/* Export: the creative as files at the ad's real size. The cards are drawn
   again off screen at full size, without the editing marks, and turned into
   PNGs there. A video has no rendered file here, so its scenes export as
   storyboard frames. */
function ExportMenu({ creative, disabled }) {
  const [open, setOpen] = useState(false);
  const [job, setJob] = useState(null);
  const ref = useRef(null);
  const stage = useRef(null);
  const format = formatById(creative?.format);
  const many = (creative?.slides.length || 0) > 1;
  const unit = kindById(creative?.kind).unit;
  const base = (creative?.name || "creative").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creative";

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  // Once the off-screen cards are on the page, turn them into files.
  useEffect(() => {
    if (!job) return;
    let cancelled = false;
    (async () => {
      try {
        await document.fonts?.ready;
        const fontEmbedCSS = await embeddedFonts().catch(() => "");
        const blobs = [];
        for (const node of stage.current.children) {
          blobs.push(await toBlob(node, { width: format.w, height: format.h, pixelRatio: 1, fontEmbedCSS }));
        }
        if (cancelled) return;
        const size = `${format.w}x${format.h}`;
        if (blobs.length === 1) {
          save(blobs[0], `${base}${many ? `-${String(job.from + 1).padStart(2, "0")}` : ""}-${size}.png`);
          toast.success(`Exported as a PNG, ${format.size}.`);
        } else {
          const files = {};
          for (const [i, blob] of blobs.entries()) files[`${base}-${String(i + 1).padStart(2, "0")}-${size}.png`] = new Uint8Array(await blob.arrayBuffer());
          save(new Blob([zipSync(files)], { type: "application/zip" }), `${base}-${size}.zip`);
          toast.success(`Exported ${blobs.length} ${unit}s as PNGs in a zip.`);
        }
      } catch {
        if (!cancelled) toast.error("Could not export. Try again.");
      } finally {
        if (!cancelled) setJob(null);
      }
    })();
    return () => { cancelled = true; };
  }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyText = () => {
    const text = creative.slides.map((_, i) => {
      const card = flat(creative, i);
      const lines = ["eyebrow", "headline", "body", "cta"]
        .map((id) => card.layers.find((l) => l.id === id))
        .filter((l) => l && !l.hidden && l.text)
        .map((l) => `${layerName(l.id)}: ${l.text}`);
      return [many ? `${unit[0].toUpperCase()}${unit.slice(1)} ${i + 1}` : null, ...lines].filter(Boolean).join("\n");
    }).join("\n\n");
    navigator.clipboard?.writeText(text).then(() => toast.success("Ad text copied."), () => toast.error("Could not copy."));
  };

  const options = [
    { id: "one", icon: ImageSquare, label: many ? `This ${unit} as a PNG` : "PNG", description: `${format.size} pixels, ready to upload to ${format.platform}`, run: () => setJob({ from: creative.at || 0, count: 1 }) },
    many && { id: "all", icon: FileZip, label: `All ${creative.slides.length} ${unit}s as PNGs`, description: creative.kind === "video" ? "Storyboard frames in a zip. There is no video file yet." : "One file per card, in order, in a zip", run: () => setJob({ from: 0, count: creative.slides.length }) },
    { id: "text", icon: TextT, label: "Copy the ad text", description: "Headline, body and button wording, to paste into the ad platform", run: copyText },
  ].filter(Boolean);

  return (
    <div className="composer-menu cr-export" ref={ref}>
      <Button
        variant="secondary"
        size="md"
        label={job ? "Exporting…" : "Export"}
        icon={job ? DownloadSimple : CaretDown}
        iconPosition={job ? "prefix" : "suffix"}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled || !!job}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <ul className="composer-menu__list cr-export__list" role="menu" aria-label="Export">
          {options.map((o) => (
            <li key={o.id}>
              <button type="button" role="menuitem" className="composer-menu__option" onClick={() => { setOpen(false); o.run(); }}>
                <o.icon size={13} className="composer-menu__icon" />
                <span className="composer-menu__text">
                  <span className="text-body-2-medium composer-menu__name">{o.label}</span>
                  <span className="text-metadata-regular composer-menu__description">{o.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {job && createPortal(
        <div className="cr-export__stage" ref={stage} aria-hidden="true">
          {Array.from({ length: job.count }, (_, k) => <Artboard key={k} creative={flat(creative, job.from + k)} />)}
        </div>,
        document.body,
      )}
    </div>
  );
}

function Swatches({ label, value, onPick }) {
  const design = useDesignStore((s) => s.design);
  return (
    <div className="cr-swatches" role="group" aria-label={label}>
      {COLOR_CHOICES.map((c) => (
        <Tooltip key={c.id} title={c.label}>
          <button
            type="button"
            aria-label={c.label}
            aria-pressed={value === c.id}
            className={`cr-swatch${value === c.id ? " cr-swatch--on" : ""}`}
            style={{ background: resolveColor(c.id, design) }}
            onClick={() => onPick(c.id)}
          />
        </Tooltip>
      ))}
    </div>
  );
}

export default function CreativeEditorPage({ embedded = null }) {
  const params = useParams();
  const id = embedded ? embedded.id : params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const creative = useCreativesStore((s) => s.creatives.find((c) => c.id === id));
  const { create, apply, patchLayer, checkpoint, goto, undo, say, approve } = useCreativesStore();
  const design = useDesignStore((s) => s.design);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(null);
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);
  // The format of the creative being made, while it is being made.
  const [making, setMaking] = useState(null);
  const isNew = id === "new";
  // What was picked under the composer, kept for the first build.
  const preferred = useRef({ format: null, kind: null, style: null, ...(embedded || location.state || {}) });
  const [playing, setPlaying] = useState(false);

  const built = (creative?.slides.length || 0) > 0;
  // The creative with the slide on screen alongside.
  const view = built ? flat(creative) : null;
  const format = formatById(creative?.format);
  const unit = kindById(creative?.kind).unit;
  const layer = built ? view.layers.find((l) => l.id === picked) : null;
  const target = built && (layer || picked === "background") ? picked : null;

  // The questions asked before the first version, then the concepts on offer:
  // { cid, prompt, questions, step, answers, directions?, at? }.
  const [asking, setAsking] = useState(null);
  const intake = asking && asking.cid === creative?.id ? asking : null;
  const place = (cid, { working, text: reply, ...made }) => {
    apply(cid, made);
    say(cid, { role: "assistant", text: reply, working });
  };

  // An answer, or nothing when the question is skipped. After the last one the
  // concepts are made; a style that was asked for by name is made directly.
  const answer = (value) => {
    const q = intake.questions[intake.step];
    const { [q.id]: _dropped, ...kept } = intake.answers;
    const answers = value ? { ...kept, [q.id]: value } : kept;
    if (intake.step < intake.questions.length - 1) return setAsking({ ...intake, answers, step: intake.step + 1 });
    const { cid, prompt } = intake;
    say(cid, { role: "user", text: summarise(intake.questions, answers) });
    setAsking({ ...intake, answers, step: null });
    setBusy(true);
    setMaking(formatFor(prompt, preferred.current.format, preferred.current.kind));
    setTimeout(() => {
      setMaking(null);
      setBusy(false);
      const brand = useDesignStore.getState().design;
      const named = (preferred.current.style && preferred.current.style !== "professional" ? preferred.current.style : null) || styleFrom(prompt.toLowerCase());
      if (named && named !== "professional") {
        place(cid, buildCreative(askWith(prompt, answers), brand, { ...preferred.current, style: named }));
        return setAsking(null);
      }
      const directions = creativeDirections(prompt, brand, preferred.current, answers);
      say(cid, { role: "assistant", text: "Here are three concepts, each from a different angle. Click one to see it full size, then choose." });
      setAsking((a) => (a ? { ...a, directions, at: (directions.find((d) => d.recommended) || directions[0]).id } : a));
    }, BUILD_MS);
  };
  const direction = intake?.directions?.find((d) => d.id === intake.at);
  const choose = () => {
    place(intake.cid, direction.made);
    setAsking(null);
  };

  const send = (text) => {
    // The creative is made by its first message, not by opening this screen.
    let current = useCreativesStore.getState().get(id);
    if (!current) {
      if (!isNew) return;
      current = create();
      if (embedded) embedded.onId(current.id);
      else navigate(`/library/creatives/${current.id}`, { replace: true });
    }
    const cid = current.id;
    const building = current.slides.length === 0;
    const on = building ? null : target;
    say(cid, { role: "user", text, target: on ? layerName(on) : undefined });
    if (building) {
      // Ask first: the questions take the place of the text box.
      say(cid, { role: "assistant", text: "Two quick questions first, so the first version is closer. Skip either." });
      setAsking({ cid, prompt: text, questions: creativeQuestions(text), step: 0, answers: {} });
      return;
    }
    setBusy(true);

    setTimeout(() => {
      const now = useCreativesStore.getState().get(cid);
      if (!now) return;
      const brand = useDesignStore.getState().design;
      {
        const reply = creativeReply(text, flat(now), on, brand);
        if (reply.action === "undo") undo(cid);
        if (reply.change) apply(cid, reply.change);
        if (reply.gone) setPicked(null);
        say(cid, { role: "assistant", text: reply.text });
      }
      setBusy(false);
    }, 600);
  };

  // A request typed in the main chat arrives here and starts the build.
  const seeded = useRef(false);
  useEffect(() => {
    const prompt = embedded ? embedded.prompt : location.state?.prompt;
    if (isNew && prompt && !seeded.current) {
      seeded.current = true;
      send(prompt);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Playing a video holds each scene for its length, then stops on the first.
  useEffect(() => {
    if (!playing || !creative) return undefined;
    const scene = creative.slides[creative.at];
    const timer = setTimeout(() => {
      if (creative.at >= creative.slides.length - 1) { setPlaying(false); goto(creative.id, 0); }
      else goto(creative.id, creative.at + 1);
    }, scene.seconds * 1000);
    return () => clearTimeout(timer);
  }, [playing, creative?.at, creative?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape lets go of the picked layer; Delete hides it.
  useEffect(() => {
    const onKey = (e) => {
      if (typing(e.target)) return;
      if (e.key === "Escape") setPicked(null);
      if ((e.key === "Delete" || e.key === "Backspace") && layer) {
        patchLayer(creative.id, layer.id, { hidden: true });
        setPicked(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layer, creative?.id, patchLayer]);

  if (!creative && !isNew) {
    return (
      <div className="lib lib-editor">
        <header className="lib__header">
          <div className="lib-editor__heading">
            <Button variant="secondaryGhost" size="md" icon={CaretLeft} aria-label="Back to the library" onClick={() => navigate("/library")} />
            <h1 className="lib__title">Creative not found</h1>
          </div>
        </header>
        <div className="lib__canvas">
          <div className="lib-empty">
            <span className="lib-empty__title">This creative no longer exists</span>
            <span className="lib-empty__text">It may have been removed, or the browser was reloaded.</span>
            <Button variant="secondary" size="md" label="Back to the library" onClick={() => navigate("/library")} />
          </div>
        </div>
      </div>
    );
  }

  // Picks the layer, and moves it if the pointer travels.
  const startDrag = (e, l) => {
    if (editing === l.id) return;
    if (editing) setEditing(null);
    setPicked(l.id);
    if (e.button !== 0) return;
    const scale = Number(e.currentTarget.closest("[data-scale]")?.dataset.scale) || 1;
    const from = { x: e.clientX, y: e.clientY, dx: l.dx, dy: l.dy };
    let moved = false;
    const move = (ev) => {
      const dx = (ev.clientX - from.x) / scale;
      const dy = (ev.clientY - from.y) / scale;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) { moved = true; checkpoint(creative.id); }
      patchLayer(creative.id, l.id, { dx: Math.round(from.dx + dx), dy: Math.round(from.dy + dy) }, { record: false });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const commitText = (layerId, text) => {
    setEditing(null);
    const now = view.layers.find((l) => l.id === layerId);
    if (text && now && text !== now.text) patchLayer(creative.id, layerId, { text });
  };

  const resize = (by) => {
    const next = Math.min(SCALE_LIMITS[1], Math.max(SCALE_LIMITS[0], +(layer.scale + by).toFixed(2)));
    if (next !== layer.scale) patchLayer(creative.id, layer.id, { scale: next });
  };
  const sizeLabel = layer && (layer.kind === "image" ? `${Math.round(layer.scale * 100)}%` : `${Math.round((format.base[layer.id] || 24) * layer.scale)} px`);

  const upload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchLayer(creative.id, "image", { src: reader.result, hidden: false });
    reader.readAsDataURL(file);
  };

  const allLayers = built ? [{ id: "background", name: layerName("background") }, ...view.layers] : [];

  // A type or style picked from the menus is the same change as asking for it.
  const ask = (words) => {
    const reply = creativeReply(words, view, null, design);
    if (reply.change) apply(creative.id, reply.change);
    setPicked(null);
  };
  const seconds = built ? creative.slides.reduce((sum, s) => sum + s.seconds, 0) : 0;

  return (
    <div className="lib lib-editor">
      <header className="lib__header">
        <div className="lib-editor__heading">
          <Button variant="secondaryGhost" size="md" icon={CaretLeft} aria-label={embedded ? "Back to Home" : creative?.recId ? "Back to the recommendation" : "Back to the library"} onClick={() => (embedded ? embedded.onBack() : creative?.recId ? navigate(`/recommendations?rec=${creative.recId}`) : navigate("/library", { state: { tab: "creatives" } }))} />
          <h1 className="lib__title">{built ? creative.name : "New ad creative"}</h1>
          {built && (creative.status === "approved" ? <Tag color="success-green">Approved</Tag> : <Tag color="column">Draft</Tag>)}
          {creative?.recId && <span className="lib-editor__from">Drafted for a recommendation</span>}
        </div>
        <div className="lib-editor__actions">
          <ExportMenu creative={creative} disabled={!built} />
          <Button
            variant="primary"
            size="md"
            label={creative?.status === "approved" ? "Approved" : "Approve"}
            disabled={!built || creative.status === "approved"}
            onClick={() => {
              approve(creative.id);
              if (creative.recId) {
                apiPost(`/api/recommendations/${creative.recId}/published`, { line: `Creative approved and added to the campaign as a new ad (${format.label}, ${format.size}). The old ad is paused.` }).catch(() => {});
                toast.success("Approved. The recommendation is accepted.");
              } else {
                toast.success(`Approved for ${format.platform}.`);
              }
            }}
          />
        </div>
      </header>

      <div className="lib-editor__body">
        <ChatPane
          greeting={CREATIVE_GREETING}
          thread={creative?.thread || []}
          busy={busy}
          placeholder={target ? "What should change here?" : built ? "Describe the change you want…" : "Describe the ad you want…"}
          onSend={send}
          target={target ? { label: layerName(target) } : null}
          onClearTarget={() => setPicked(null)}
          footer={intake && !busy && (intake.directions ? (
            <DirectionCard
              question="Which concept should I take forward?"
              value={intake.at}
              onPick={(at) => setAsking({ ...intake, at })}
              onChoose={choose}
              items={intake.directions.map((d) => {
                const f = formatById(d.made.format);
                return {
                  id: d.id, label: d.label, note: d.note, recommended: d.recommended,
                  preview: <span className="intake__art"><Fit w={f.w} h={f.h}><Artboard creative={flat(d.made, 0)} /></Fit></span>,
                };
              })}
            />
          ) : intake.step !== null ? (
            <AskCard
              step={intake.step}
              total={intake.questions.length}
              question={intake.questions[intake.step].question}
              options={intake.questions[intake.step].options}
              onAnswer={answer}
              onSkip={() => answer(null)}
              onBack={() => setAsking({ ...intake, step: intake.step - 1 })}
            />
          ) : null)}
        />

        <section className="lib-stage cr-stage" aria-label="Creative">
          {built ? (
            <>
              <div className="cr-tools" role="toolbar" aria-label="Creative tools">
                <ComposerMenu
                  label="Format"
                  value={creative.format}
                  options={FORMAT_OPTIONS}
                  onChange={(next) => next !== creative.format && apply(creative.id, { format: next, slides: creative.slides.map((s) => ({ ...s, layers: s.layers.map((l) => ({ ...l, dx: 0, dy: 0 })) })) })}
                />
                <ComposerMenu label="Type" value={creative.kind} options={KIND_OPTIONS} onChange={(next) => next !== creative.kind && ask(KIND_ASK[next])} />
                <ComposerMenu label="Style" value={creative.style} options={STYLE_OPTIONS} onChange={(next) => next !== creative.style && ask(STYLE_ASK[next])} />
                <span className="cr-tools__rule" />
                <Tooltip title="Align left">
                  <span><Button variant={view.align === "left" ? "secondary" : "secondaryGhost"} size="sm" icon={TextAlignLeft} aria-label="Align left" onClick={() => view.align !== "left" && apply(creative.id, { align: "left" })} /></span>
                </Tooltip>
                <Tooltip title="Centre">
                  <span><Button variant={view.align === "center" ? "secondary" : "secondaryGhost"} size="sm" icon={TextAlignCenter} aria-label="Centre" onClick={() => view.align !== "center" && apply(creative.id, { align: "center" })} /></span>
                </Tooltip>
                <span className="cr-tools__rule" />


                {target && <span className="cr-tools__name">{layerName(target)}</span>}
                {target === "background" && (
                  <Swatches label="Background colour" value={view.bg} onPick={(c) => c !== view.bg && apply(creative.id, { bg: c, layers: recolor(view.layers, c, design) })} />
                )}
                {layer && (
                  <>
                    <div className="cr-size">
                      <Tooltip title="Smaller"><span><Button variant="secondaryGhost" size="sm" icon={Minus} aria-label="Smaller" onClick={() => resize(-0.1)} /></span></Tooltip>
                      <span className="cr-size__value">{sizeLabel}</span>
                      <Tooltip title="Bigger"><span><Button variant="secondaryGhost" size="sm" icon={Plus} aria-label="Bigger" onClick={() => resize(0.1)} /></span></Tooltip>
                    </div>
                    {layer.kind !== "image" && (
                      <Swatches label="Colour" value={layer.color} onPick={(c) => c !== layer.color && patchLayer(creative.id, layer.id, { color: c })} />
                    )}
                    {layer.kind === "image" && (
                      <Button variant="secondaryGhost" size="sm" label="Replace" icon={UploadSimple} iconPosition="prefix" onClick={() => fileRef.current?.click()} />
                    )}
                    <Tooltip title="Hide layer">
                      <span><Button variant="secondaryGhost" size="sm" icon={EyeSlash} aria-label="Hide layer" onClick={() => { patchLayer(creative.id, layer.id, { hidden: true }); setPicked(null); }} /></span>
                    </Tooltip>
                  </>
                )}

                <span className="cr-tools__end">
                  <Tooltip title="Undo">
                    <span><Button variant="secondaryGhost" size="sm" icon={ArrowCounterClockwise} aria-label="Undo" disabled={!creative.history.length} onClick={() => undo(creative.id)} /></span>
                  </Tooltip>
                </span>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
              </div>

              <Fit w={format.w} h={format.h}>
                <Artboard
                  creative={view}
                  picked={target}
                  editing={editing}
                  onPick={setPicked}
                  onDragStart={startDrag}
                  onEdit={(layerId) => { setPicked(layerId); setEditing(layerId); }}
                  onCommit={commitText}
                />
              </Fit>

              {creative.kind !== "image" && (
                <div className="cr-strip" aria-label={`${unit[0].toUpperCase()}${unit.slice(1)}s`}>
                  {creative.kind === "video" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      label={playing ? "Stop" : `Play ${seconds}s`}
                      icon={playing ? Stop : Play}
                      iconPosition="prefix"
                      onClick={() => { setPicked(null); if (!playing) goto(creative.id, 0); setPlaying((v) => !v); }}
                    />
                  )}
                  <div className="cr-strip__list">
                    {creative.slides.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={creative.at === i}
                        aria-label={`${unit} ${i + 1}`}
                        className={`cr-strip__item${creative.at === i ? " cr-strip__item--on" : ""}`}
                        style={{ aspectRatio: `${format.w} / ${format.h}` }}
                        onClick={() => { setPlaying(false); setPicked(null); goto(creative.id, i); }}
                      >
                        <Fit w={format.w} h={format.h}><Artboard creative={flat(creative, i)} /></Fit>
                        <span className="cr-strip__no">{creative.kind === "video" ? `${s.seconds}s` : i + 1}</span>
                      </button>
                    ))}
                  </div>
                  <Tooltip title={`Add a ${unit}`}>
                    <span><Button variant="secondaryGhost" size="sm" icon={Plus} aria-label={`Add a ${unit}`} disabled={creative.slides.length >= MAX_SLIDES} onClick={() => ask(`add a ${unit}`)} /></span>
                  </Tooltip>
                  <Tooltip title={`Remove this ${unit}`}>
                    <span><Button variant="secondaryGhost" size="sm" icon={Trash} aria-label={`Remove this ${unit}`} disabled={creative.slides.length <= 2} onClick={() => ask(`remove this ${unit}`)} /></span>
                  </Tooltip>
                </div>
              )}

              <div className="cr-layers" aria-label="Layers">
                <span className="cr-layers__label">
                  {format.label} · {format.size}{creative.kind !== "image" ? ` · ${unit} ${creative.at + 1} of ${creative.slides.length}` : ""}
                </span>
                <div className="cr-layers__list">
                  {allLayers.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      aria-pressed={target === l.id}
                      className={`cr-layers__item${target === l.id ? " cr-layers__item--on" : ""}${l.hidden ? " cr-layers__item--hidden" : ""}`}
                      onClick={() => {
                        if (l.hidden) patchLayer(creative.id, l.id, { hidden: false });
                        setPicked(l.id);
                      }}
                    >
                      {l.hidden ? <EyeSlash size={12} /> : l.id !== "background" && <Eye size={12} />}
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : direction ? (
            <>
              <Fit w={formatById(direction.made.format).w} h={formatById(direction.made.format).h}>
                <Artboard creative={flat(direction.made, 0)} />
              </Fit>
              <div className="cr-layers">
                <span className="cr-layers__label">Preview · {direction.label} · not chosen yet</span>
              </div>
            </>
          ) : making ? (
            <>
              <Fit w={making.w} h={making.h}>
                <div className="cr-making" style={{ width: making.w, height: making.h }}>
                  <DiffusionLoader label="Generating your creative" />
                </div>
              </Fit>
              <div className="cr-layers">
                <span className="cr-layers__label">Generating · {making.label} · {making.size}</span>
              </div>
            </>
          ) : (
            <div className="lib-browser">
              <div className="lib-browser__empty">
                <span className="lib-empty__title">Your creative will appear here</span>
                <span className="lib-empty__text">It is made for LinkedIn or Meta, in your design system, as layers you can change one at a time.</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
