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
import { CaretLeft, Code, Eye, GearSix, Globe, LockSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button, Tag, Tooltip } from "@/ui";
import {
  BUILD_GREETING, pageDirections, pageQuestions, pageReply, slugFor, targetLabel, targetReply,
} from "../../mocks/pageBuilder";
import { designVars } from "../../mocks/library";
import { apiPost } from "../../api";
import ChatPane from "./ChatPane";
import { AskCard, DirectionCard, summarise } from "./Intake";
import PageCode, { projectFor } from "./PageCode";
import { PETAVUE_DOMAIN, PageSettingsDialog, PublishDialog, metaOf } from "./PageSettings";
import { DetailsDialog, ScaledPreview, Section } from "./parts";
import useDesignStore from "./useDesignStore";
import useLibraryStore, { foldersOf, workspaceTemplates } from "./useLibraryStore";
import usePagesStore, { pageUrl } from "./usePagesStore";
import useRunReviewStore from "../workflows/agents-run/useRunReviewStore";
import { REVIEW_PATH } from "../workflows/agents-run/data";
import "./library.css";

const LIVE_NOTE = " The live page is unchanged until you publish again.";

function PageStatus({ page }) {
  if (page.status !== "published") return <Tag color="column">Draft</Tag>;
  return page.unpublished ? <Tag color="warning-yellow">Unpublished changes</Tag> : <Tag color="success-green">Published</Tag>;
}

export default function PageBuilderPage({ embedded = null }) {
  const params = useParams();
  const id = embedded ? embedded.id : params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const page = usePagesStore((s) => s.pages.find((p) => p.id === id));
  const { create, setSections, undo, say, publish, unpublish, setMeta } = usePagesStore();
  // A page drafted in a workflow run is held until that run is published:
  // only then does its recommendation exist for the page to accept.
  const runOutcome = useRunReviewStore((s) => s.outcome);
  const inReview = !!page?.runReview && runOutcome !== "approved";
  const design = useDesignStore((s) => s.design);
  const { brand } = design;
  // The canvas shows the page or its code; the code is read off the page.
  const [view, setView] = useState("preview");
  const [files, setFiles] = useState([]);
  const pageRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    const meta = metaOf(page);
    const title = meta.title || page.name;
    const slug = page.settings?.slug || slugFor(page.name);
    setFiles(projectFor(pageRef.current, {
      title,
      description: meta.description,
      vars: designVars(design),
      pixel: page.status === "published" && meta.pixel,
      slug,
      sections: page.sections,
      // The page settings as a file. The image and the password are left out.
      settings: {
        name: page.name,
        address: { domain: page.settings?.domain || PETAVUE_DOMAIN, slug, published: page.status === "published" },
        access: meta.access,
        seo: { title, description: meta.description, sitemap: meta.sitemap, canonical: meta.canonical || null },
        openGraph: { title: meta.ogSameTitle ? title : meta.ogTitle || title, description: meta.ogSameDescription ? meta.description : meta.ogDescription, image: meta.ogImage?.name || null },
        tracking: { petavuePixel: meta.pixel, googleTagManager: meta.gtm || null },
        forms: { sendTo: meta.forms },
      },
      noindex: !meta.sitemap,
      canonical: meta.canonical,
      gtm: meta.gtm,
      og: { title: meta.ogSameTitle ? title : meta.ogTitle || title, description: meta.ogSameDescription ? meta.description : meta.ogDescription, image: !!meta.ogImage },
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
      {/* One header for the whole editor: what the page is, how it is being
          looked at and where it lives, then what can be done with it. */}
      <header className="lib__header lib__header--editor">
        <div className="lib-editor__heading">
          <Button variant="secondaryGhost" size="md" icon={CaretLeft} aria-label={embedded ? "Back to Home" : inReview ? "Back to the run" : page?.recId ? "Back to the recommendation" : "Back to the library"} onClick={back} />
          <h1 className="lib__title">{built ? page.name : "New landing page"}</h1>
          {built && <PageStatus page={page} />}
          {page?.recId && (
            <Tooltip title={inReview ? "Drafted in a workflow run you are reviewing" : "Drafted for a recommendation"}>
              <span className="lib-editor__from">{inReview ? "From a run in review" : "For a recommendation"}</span>
            </Tooltip>
          )}
        </div>

        <div className="lib-editor__view">
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
          {direction ? (
            <span className="lib-browser__address">Preview of “{direction.label}” · not chosen yet</span>
          ) : (
            <Tooltip title={live ? (metaOf(page).pixel ? "Live, with the Petavue tracking pixel" : "Live, without the tracking pixel") : built ? "A local preview. The page is not published." : ""}>
              <span className={`lib-browser__address${live ? " lib-browser__address--live" : ""}`}>
                {live ? <LockSimple size={12} weight="fill" /> : <Globe size={12} />}
                <span>{live ? `https://${url}` : built ? `localhost:3000/${page.settings?.slug || slugFor(page.name)}` : "localhost:3000"}</span>
              </span>
            </Tooltip>
          )}
        </div>

        <div className="lib-editor__actions">
          <Button variant="secondaryGhost" size="md" label="Save as template" disabled={!built} onClick={() => setSaving(true)} />
          <Button variant="secondaryGhost" size="md" icon={GearSix} iconPosition="prefix" label="Page settings" disabled={!built} onClick={() => setSettingsOpen(true)} />
          {live && !page.unpublished ? (
            <Button variant="secondaryGhost" size="md" label="Publishing" onClick={() => setPublishing(true)} />
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
            {built && view === "code" && <PageCode files={files} name={page.settings?.slug || slugFor(page.name)} />}
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
          onSettings={() => { setPublishing(false); setSettingsOpen(true); }}
          onUnpublish={() => {
            unpublish(page.id);
            setPublishing(false);
            toast.success(`${page.name} is offline. It is a draft again.`);
          }}
          onPublish={(settings) => {
            const moved = page.status === "published" && !page.unpublished;
            publish(page.id, settings);
            setPublishing(false);
            if (moved) { toast.success(`Now at ${settings.domain}/${settings.slug}.`); return; }
            if (page.recId) {
              apiPost(`/api/recommendations/${page.recId}/published`, { url: `${settings.domain}/${settings.slug}`, pixel: metaOf(page).pixel }).catch(() => {});
              toast.success(`Published at ${settings.domain}/${settings.slug}. The recommendation is accepted.`);
            } else {
              toast.success(`Published at ${settings.domain}/${settings.slug}.`);
            }
          }}
        />
      )}

      {settingsOpen && page && (
        <PageSettingsDialog
          page={page}
          address={live ? url : `${PETAVUE_DOMAIN}/${page.settings?.slug || slugFor(page.name)}`}
          onClose={() => setSettingsOpen(false)}
          onSave={(name, meta) => {
            setMeta(page.id, name, meta);
            setSettingsOpen(false);
            toast.success(live ? "Settings saved. Publish the page again to put them live." : "Settings saved.");
          }}
        />
      )}
    </div>
  );
}
