/**
 * Building a landing page in chat.
 *
 * Chat on the left, the page on the right. The first message builds the page
 * from the workspace's published components and a template it has added; later
 * messages change it. Nothing goes live until Publish is confirmed, where the
 * address and the tracking pixel are chosen. There is no verification step: a
 * page is static, so approving it is the whole review.
 *
 * It is a screen of its own under the Library, and it also opens in place on
 * Home when a page is asked for in the main chat: `embedded` then carries the
 * page id, the request, and what to do on back.
 *
 * Before the first build the agent asks a few questions in the chat, one at a
 * time, then offers three ways to lay the page out. Each can be skipped.
 *
 * Clicking a section, or a piece of its text, picks it: it shows above the
 * text box and the next message applies to that part.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CaretLeft, Code, Copy, Eye, Globe, LockSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, Dialog, Dropdown, RadioGroup, Tag, TextInput, Toggle, Tooltip } from "@/ui";
import {
  BUILD_GREETING, cleanSlug, pageDirections, pageQuestions, pageReply, slugFor, targetLabel, targetReply,
} from "../../mocks/pageBuilder";
import { designVars } from "../../mocks/library";
import { apiPost } from "../../api";
import ChatPane from "./ChatPane";
import { AskCard, DirectionCard, summarise } from "./Intake";
import PageCode, { documentFor } from "./PageCode";
import { DetailsDialog, ScaledPreview, Section } from "./parts";
import useDesignStore from "./useDesignStore";
import useLibraryStore, { foldersOf, workspaceTemplates } from "./useLibraryStore";
import usePagesStore, { pageUrl } from "./usePagesStore";
import useRunReviewStore from "../workflows/agents-run/useRunReviewStore";
import { REVIEW_PATH } from "../workflows/agents-run/data";
import "./library.css";

const PETAVUE_DOMAIN = "pages.petavue.com";
const LIVE_NOTE = " The live page is unchanged until you publish again.";

function PageStatus({ page }) {
  if (page.status !== "published") return <Tag color="column">Draft</Tag>;
  return page.unpublished ? <Tag color="warning-yellow">Unpublished changes</Tag> : <Tag color="success-green">Published</Tag>;
}

const FORM_TARGETS = [
  { value: "hubspot", label: "HubSpot · create or update the contact" },
  { value: "email", label: "Email the workspace owner" },
  { value: "both", label: "HubSpot and email" },
];

function Group({ title, children }) {
  return (
    <section className="lib-publish__group">
      <h3 className="lib-publish__heading">{title}</h3>
      {children}
    </section>
  );
}

/* Where the page goes live and how it behaves there. Confirming this is the
   approval. A live page can be taken offline from here. */
function PublishDialog({ page, ownDomain, onPublish, onUnpublish, onClose }) {
  const was = page.settings || {};
  const live = page.status === "published";
  const [domain, setDomain] = useState(was.domain || PETAVUE_DOMAIN);
  const [slug, setSlug] = useState(was.slug || slugFor(page.name));
  const [pixel, setPixel] = useState(was.pixel ?? true);
  const [title, setTitle] = useState(was.title ?? page.name);
  const [description, setDescription] = useState(was.description ?? "");
  const [noindex, setNoindex] = useState(was.noindex ?? false);
  const [gtm, setGtm] = useState(was.gtm ?? "");
  const [forms, setForms] = useState(was.forms ?? "hubspot");
  const missing = !slug.replace(/-/g, "");
  const label = !live ? "Publish page" : page.unpublished ? "Publish changes" : "Save settings";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const confirm = () => {
    if (missing) return;
    onPublish({
      domain, slug: slug.replace(/-+$/, ""), pixel, noindex, forms,
      title: title.trim() || page.name, description: description.trim(), gtm: gtm.trim().toUpperCase(),
    });
  };

  return (
    <div className="lib-dialog__scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Publish settings" onClick={(e) => e.stopPropagation()}>
        <Dialog
          size="md"
          title={live ? "Publish settings" : "Publish page"}
          cancelLabel="Cancel"
          confirmLabel={label}
          onClose={onClose}
          onCancel={onClose}
          onConfirm={confirm}
          className="lib-dialog lib-dialog--form lib-dialog--publish"
        >
          <Group title="Address">
            <RadioGroup
              label="Domain"
              name="page-domain"
              value={domain}
              onChange={setDomain}
              options={[
                { value: PETAVUE_DOMAIN, label: `${PETAVUE_DOMAIN} · Petavue's domain` },
                { value: ownDomain, label: `${ownDomain} · your connected domain` },
              ]}
            />
            <TextInput
              label="Page address"
              placeholder="demo-request"
              value={slug}
              onChange={(e) => setSlug(cleanSlug(e.target.value))}
              error={missing}
              errorMessage="Give the page an address."
            />
            <p className="lib-publish__url"><Globe size={14} /> https://{domain}/{slug || "…"}</p>
          </Group>

          <Group title="Search and sharing">
            <TextInput label="Meta title" placeholder={page.name} value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextInput
              label="Meta description"
              placeholder="One or two sentences shown in search results and link previews"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="lib-publish__switch">
              <Toggle label="Hide from search engines" checked={noindex} onChange={() => setNoindex((v) => !v)} />
              <p className="lib-dialog__hint lib-dialog__hint--flush">Use for pages that only paid campaigns should reach.</p>
            </div>
          </Group>

          <Group title="Tracking">
            <div className="lib-publish__switch">
              <Toggle label="Include the Petavue tracking pixel" checked={pixel} onChange={() => setPixel((v) => !v)} />
              <p className="lib-dialog__hint lib-dialog__hint--flush">Lets Petavue measure visits and form completions on this page.</p>
            </div>
            <TextInput label="Google Tag Manager ID (optional)" placeholder="GTM-XXXXXXX" value={gtm} onChange={(e) => setGtm(e.target.value)} />
          </Group>

          <Group title="Forms">
            <Dropdown label="Send form submissions to" options={FORM_TARGETS} value={forms} onChange={setForms} />
          </Group>

          {live ? (
            <Group title="Take offline">
              <div className="lib-publish__offline">
                <p className="lib-dialog__hint lib-dialog__hint--flush">
                  The address stops serving the page. The page stays here as a draft and can be published again.
                </p>
                <Button variant="secondary" size="md" label="Unpublish" onClick={onUnpublish} />
              </div>
            </Group>
          ) : (
            <p className="lib-publish__note">The page goes live at this address as soon as you publish.</p>
          )}
        </Dialog>
      </div>
    </div>
  );
}

export default function PageBuilderPage({ embedded = null }) {
  const params = useParams();
  const id = embedded ? embedded.id : params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const page = usePagesStore((s) => s.pages.find((p) => p.id === id));
  const { create, setSections, undo, say, publish, unpublish } = usePagesStore();
  // A page drafted in a workflow run is held until that run is published:
  // only then does its recommendation exist for the page to accept.
  const runOutcome = useRunReviewStore((s) => s.outcome);
  const inReview = !!page?.runReview && runOutcome !== "approved";
  const design = useDesignStore((s) => s.design);
  const { brand } = design;
  // The canvas shows the page or its code; the code is read off the page.
  const [view, setView] = useState("preview");
  const [source, setSource] = useState("");
  const pageRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const library = useLibraryStore();
  const isNew = id === "new";
  // The part picked on the canvas: { key, piece?, current? }.
  const [picked, setPicked] = useState(null);
  const target = picked && page?.sections.some((s) => s.key === picked.key) ? picked : null;

  const pick = (e) => {
    const section = e.target.closest("[data-key]");
    if (!section) return setPicked(null);
    const piece = e.target.closest("[data-piece]");
    setPicked({ key: section.dataset.key, piece: piece?.dataset.piece || null, current: piece?.textContent || null });
  };
  // The template picked under the composer, kept for the first build.
  const preferredTemplate = useRef((embedded ? embedded.templateId : location.state?.templateId) || null);

  // The questions being asked before the first build, then the directions
  // on offer: { pageId, prompt, questions, step, answers, directions?, at? }.
  const [asking, setAsking] = useState(null);
  const intake = asking && asking.pageId === page?.id ? asking : null;

  // An answer, or nothing when the question is skipped.
  const answer = (value) => {
    const q = intake.questions[intake.step];
    const { [q.id]: _dropped, ...kept } = intake.answers;
    const answers = value ? { ...kept, [q.id]: value } : kept;
    if (intake.step < intake.questions.length - 1) return setAsking({ ...intake, answers, step: intake.step + 1 });
    say(intake.pageId, { role: "user", text: summarise(intake.questions, answers) });
    setAsking({ ...intake, answers, step: null });
    setBusy(true);
    setTimeout(() => {
      const directions = pageDirections(intake.prompt, useLibraryStore.getState(), preferredTemplate.current, answers, useDesignStore.getState().design.brand);
      say(intake.pageId, { role: "assistant", text: directions.length > 1 ? `Here are ${["two", "three", "four"][directions.length - 2]} ways to lay it out. Click one to see it full size, then choose.` : "Here is the layout. Click it to see it full size, then choose." });
      setAsking((a) => (a ? { ...a, directions, at: (directions.find((d) => d.recommended) || directions[0]).id } : a));
      setBusy(false);
    }, 1300);
  };
  const direction = intake?.directions?.find((d) => d.id === intake.at);
  const choose = () => {
    const { built: made } = direction;
    setSections(intake.pageId, made.sections, { name: made.name, templateId: made.templateId });
    say(intake.pageId, { role: "assistant", text: made.text, working: made.working, used: made.used });
    setAsking(null);
  };

  const send = (text) => {
    // The page is created by its first message, not by opening this screen.
    let current = usePagesStore.getState().get(id);
    if (!current) {
      if (!isNew) return;
      current = create();
      if (embedded) embedded.onId(current.id);
      else navigate(`/library/pages/${current.id}`, { replace: true });
    }
    const pageId = current.id;
    const building = current.sections.length === 0;
    const on = !building && target ? target : null;
    say(pageId, { role: "user", text, target: on ? targetLabel(current, on) : undefined });
    if (building) {
      // Ask first: the questions take the place of the text box.
      say(pageId, { role: "assistant", text: "Three quick questions first, so the first version is closer. Skip any you like." });
      setAsking({ pageId, prompt: text, questions: pageQuestions(text), step: 0, answers: {} });
      return;
    }
    setBusy(true);

    setTimeout(() => {
      const workspace = useLibraryStore.getState();
      const now = usePagesStore.getState().get(pageId);
      if (!now) return;
      {
        const reply = (on && targetReply(text, now, on, useDesignStore.getState().design)) || pageReply(text, now, workspace);
        if (reply.gone) setPicked(null);
        const changed = reply.sections || reply.action;
        if (reply.action === "undo") undo(pageId);
        if (reply.sections) setSections(pageId, reply.sections, reply.rebuild || {});
        say(pageId, { role: "assistant", text: reply.text + (changed && now.status === "published" ? LIVE_NOTE : ""), used: reply.used });
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

  // The code follows the page: it is read again whenever the page changes.
  useEffect(() => {
    if (view !== "code" || !pageRef.current || !page) return;
    setSource(documentFor(pageRef.current, {
      title: page.settings?.title || page.name,
      description: page.settings?.description,
      vars: designVars(design),
      pixel: page.status === "published" && page.settings?.pixel,
      slug: page.settings?.slug,
      noindex: page.settings?.noindex,
      gtm: page.settings?.gtm,
    }));
  }, [view, page, design]);

  if (!page && !isNew) {
    return (
      <div className="lib lib-editor">
        <header className="lib__header">
          <div className="lib-editor__heading">
            <Button variant="secondaryGhost" size="md" icon={CaretLeft} aria-label="Back to the library" onClick={() => navigate("/library")} />
            <h1 className="lib__title">Page not found</h1>
          </div>
        </header>
        <div className="lib__canvas">
          <div className="lib-empty">
            <span className="lib-empty__title">This page no longer exists</span>
            <span className="lib-empty__text">It may have been removed, or the browser was reloaded.</span>
            <div className="lib-empty__action">
              <Button variant="secondary" size="md" label="Back to the library" onClick={() => navigate("/library")} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sections = page?.sections || [];
  const built = sections.length > 0;
  const live = page?.status === "published";
  const url = page ? pageUrl(page) : null;
  // A page drafted for a recommendation goes back to it.
  const back = () => (embedded ? embedded.onBack() : inReview ? navigate(REVIEW_PATH) : page?.recId ? navigate(`/recommendations?rec=${page.recId}`) : navigate("/library", { state: { tab: "pages" } }));
  const ownDomain = `go.${(brand || "yourcompany").toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourcompany"}.com`;

  return (
    <div className="lib lib-editor">
      <header className="lib__header">
        <div className="lib-editor__heading">
          <Button variant="secondaryGhost" size="md" icon={CaretLeft} aria-label={embedded ? "Back to Home" : inReview ? "Back to the run" : page?.recId ? "Back to the recommendation" : "Back to the library"} onClick={back} />
          <h1 className="lib__title">{built ? page.name : "New landing page"}</h1>
          {built && <PageStatus page={page} />}
          {page?.recId && <span className="lib-editor__from">{inReview ? "Drafted in a workflow run you are reviewing" : "Drafted for a recommendation"}</span>}
        </div>
        <div className="lib-editor__actions">
          <Button variant="secondaryGhost" size="md" label="Save as template" disabled={!built} onClick={() => setSaving(true)} />
          {live && !page.unpublished ? (
            <Button variant="secondaryGhost" size="md" label="Publish settings" onClick={() => setPublishing(true)} />
          ) : (
            <Tooltip title={inReview ? "Publish the run first. The page can be published from its recommendation after that." : ""}>
              <span>
                <Button
                  variant="primary"
                  size="md"
                  label={live ? "Publish changes" : "Publish"}
                  disabled={!built || inReview}
                  onClick={() => setPublishing(true)}
                />
              </span>
            </Tooltip>
          )}
        </div>
      </header>

      <div className="lib-editor__body">
        <ChatPane
          greeting={BUILD_GREETING}
          thread={page?.thread || []}
          busy={busy}
          placeholder={target ? "What should change here?" : built ? "Describe the change you want…" : "Describe the page you want…"}
          onSend={send}
          target={target ? { label: targetLabel(page, target) } : null}
          onClearTarget={() => setPicked(null)}
          footer={intake && !busy && (intake.directions ? (
            <DirectionCard
              question="Which layout should the page use?"
              value={intake.at}
              onPick={(at) => setAsking({ ...intake, at })}
              onChoose={choose}
              items={intake.directions.map((d) => ({
                id: d.id, label: d.label, note: d.note, recommended: d.recommended,
                preview: <ScaledPreview height={132}>{d.built.sections.map((s) => <Section key={s.key} item={s} />)}</ScaledPreview>,
              }))}
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

        <section className="lib-stage" aria-label="Page">
          <div className="lib-browser">
            <div className="lib-browser__bar">
              <span className={`lib-browser__address${live ? " lib-browser__address--live" : ""}`}>
                {live ? <LockSimple size={12} weight="fill" /> : <Globe size={12} />}
                {live ? `https://${url}` : built ? `localhost:3000/${page.settings?.slug || slugFor(page.name)}` : "localhost:3000"}
              </span>
              {live && page.settings.pixel && <span className="lib-browser__chip">Tracking pixel on</span>}
              {built && !live && <span className="lib-browser__chip lib-browser__chip--draft">Not published</span>}
              {built && view === "preview" && <span className="lib-browser__count">{sections.length} sections · click a part to change it</span>}
              {built && view === "code" && (
                <Button
                  variant="secondaryGhost"
                  size="md"
                  label="Copy"
                  icon={Copy}
                  onClick={() => navigator.clipboard?.writeText(source).then(() => toast.success("HTML copied."), () => toast.error("Could not copy."))}
                />
              )}
              {built && (
                <div className="lib-scope lib-scope--view" role="tablist" aria-label="Show the page as">
                  {[{ id: "preview", label: "Preview", icon: Eye }, { id: "code", label: "Code", icon: Code }].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      aria-selected={view === v.id}
                      className={`lib-scope__option${view === v.id ? " lib-scope__option--active" : ""}`}
                      onClick={() => { setView(v.id); if (v.id === "code") setPicked(null); }}
                    >
                      <v.icon size={13} />
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              {direction && <span className="lib-browser__count">Preview · {direction.label} · not chosen yet</span>}
            </div>
            {built && view === "code" && <PageCode source={source} />}
            {built ? (
              <div ref={pageRef} className="lib-browser__page" hidden={view === "code"} onClick={pick}>
                <ScaledPreview interactive>
                  {sections.map((s) => {
                    const on = target?.key === s.key;
                    return (
                      <div
                        key={s.key}
                        data-key={s.key}
                        data-picked={on ? target.piece || undefined : undefined}
                        className={`lp-pick${on && !target.piece ? " lp-pick--on" : ""}`}
                      >
                        <Section item={s} />
                      </div>
                    );
                  })}
                </ScaledPreview>
              </div>
            ) : direction ? (
              <div className="lib-browser__page">
                <ScaledPreview>{direction.built.sections.map((s) => <Section key={s.key} item={s} />)}</ScaledPreview>
              </div>
            ) : (
              <div className="lib-browser__empty">
                <span className="lib-empty__title">Your page will appear here</span>
                <span className="lib-empty__text">It is built from the components you have published in the Library.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {saving && page && (
        <DetailsDialog
          title="Save as template"
          noun="template"
          confirmLabel="Save template"
          item={{ name: `${page.name.replace(/ page$/i, "")} template`, description: "", folder: "", tags: [] }}
          folders={foldersOf([...workspaceTemplates(library), ...library.items])}
          hint="The page is saved as it is now. Describe when to use it: the agent reads the name, description, folder and tags to pick a template."
          onClose={() => setSaving(false)}
          onSave={(details) => {
            library.saveTemplate(details, page.sections);
            toast.success(`${details.name} saved to your templates.`);
          }}
        />
      )}

      {publishing && page && (
        <PublishDialog
          page={page}
          ownDomain={ownDomain}
          onClose={() => setPublishing(false)}
          onUnpublish={() => {
            unpublish(page.id);
            setPublishing(false);
            toast.success(`${page.name} is offline. It is a draft again.`);
          }}
          onPublish={(settings) => {
            const saved = page.status === "published" && !page.unpublished;
            publish(page.id, settings);
            setPublishing(false);
            if (saved) { toast.success("Publish settings saved."); return; }
            if (page.recId) {
              apiPost(`/api/recommendations/${page.recId}/published`, { url: `${settings.domain}/${settings.slug}`, pixel: settings.pixel }).catch(() => {});
              toast.success(`Published at ${settings.domain}/${settings.slug}. The recommendation is accepted.`);
            } else {
              toast.success(`Published at ${settings.domain}/${settings.slug}.`);
            }
          }}
        />
      )}
    </div>
  );
}
