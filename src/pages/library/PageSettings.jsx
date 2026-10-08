/* Two dialogs for a landing page, kept apart on purpose.

   PublishDialog is the short one: where the page goes live. Confirming it is
   the approval, and a live page is taken offline from it.

   PageSettingsDialog is everything about the page itself, whether or not it
   is published: its name, who can open it, how it appears in search results
   and when shared, what it tracks, and where its forms send. Saving these on
   a live page holds them back until the page is published again, like any
   other change. */
import { useEffect, useRef, useState } from "react";
import { Globe, GlobeHemisphereWest, LockSimple, Trash, UploadSimple } from "@phosphor-icons/react";
import { Button, Checkbox, Dialog, Dropdown, RadioGroup, TextArea, TextInput, Toggle } from "@/ui";
import { cleanSlug, slugFor } from "../../mocks/pageBuilder";
import { ScaledPreview, Section } from "./parts";

export const PETAVUE_DOMAIN = "pages.petavue.com";

const FORM_TARGETS = [
  { value: "hubspot", label: "HubSpot · create or update the contact" },
  { value: "email", label: "Email the workspace owner" },
  { value: "both", label: "HubSpot and email" },
];

// A page's settings with their defaults filled in.
export const metaOf = (page) => ({
  title: page.name, description: "", sitemap: true, canonical: "",
  ogSameTitle: true, ogTitle: "", ogSameDescription: true, ogDescription: "", ogImage: null,
  access: "public", password: "", pixel: true, gtm: "", forms: "hubspot",
  ...page.meta,
});

const clip = (text, n) => (text.length > n ? `${text.slice(0, n).trimEnd()} …` : text);

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

function Group({ title, text, children }) {
  return (
    <section className="lib-publish__group">
      <div className="lib-publish__grouphead">
        <h3 className="lib-publish__heading">{title}</h3>
        {text && <p className="lib-dialog__hint lib-dialog__hint--flush">{text}</p>}
      </div>
      {children}
    </section>
  );
}

/* ── Publishing ────────────────────────────────────────────────────────── */
export function PublishDialog({ page, ownDomain, onPublish, onUnpublish, onSettings, onClose }) {
  const was = page.settings || {};
  const meta = metaOf(page);
  const live = page.status === "published";
  const [domain, setDomain] = useState(was.domain || PETAVUE_DOMAIN);
  const [slug, setSlug] = useState(was.slug || slugFor(page.name));
  const missing = !slug.replace(/-/g, "");
  const label = !live ? "Publish page" : page.unpublished ? "Publish changes" : "Update address";
  useEscape(onClose);

  return (
    <div className="lib-dialog__scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={live ? "Publishing" : "Publish page"} onClick={(e) => e.stopPropagation()}>
        <Dialog
          size="md"
          title={live ? "Publishing" : "Publish page"}
          cancelLabel="Cancel"
          confirmLabel={label}
          onClose={onClose}
          onCancel={onClose}
          onConfirm={() => { if (!missing) onPublish({ domain, slug: slug.replace(/-+$/, "") }); }}
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

          {/* What the page settings say, so nothing is published blind. */}
          <Group title="Goes live with">
            <ul className="lib-publish__summary">
              <li><span>Search title</span><b>{meta.title || page.name}</b></li>
              <li><span>Access</span><b>{meta.access === "public" ? "Anyone on the internet" : "Anyone with the password"}</b></li>
              <li><span>Search engines</span><b>{meta.sitemap ? "Can list this page" : "Hidden from search"}</b></li>
              <li><span>Tracking pixel</span><b>{meta.pixel ? "On" : "Off"}</b></li>
            </ul>
            <div><Button variant="blueGhost" size="md" label="Change in page settings" onClick={onSettings} /></div>
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

/* ── Page settings ─────────────────────────────────────────────────────── */
export function PageSettingsDialog({ page, address, onSave, onClose }) {
  const [name, setName] = useState(page.name);
  const [m, setM] = useState(() => metaOf(page));
  const set = (patch) => setM((v) => ({ ...v, ...patch }));
  const fileRef = useRef(null);
  useEscape(onClose);

  const title = m.title.trim() || name;
  const ogTitle = m.ogSameTitle ? title : m.ogTitle;
  const ogDescription = m.ogSameDescription ? m.description : m.ogDescription;
  const host = address.split("/")[0];

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ ogImage: { src: reader.result, name: file.name, kb: Math.max(1, Math.round(file.size / 1024)) } });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const save = () => onSave(name.trim() || page.name, {
    ...m, title: m.title.trim(), description: m.description.trim(), canonical: m.canonical.trim().replace(/\/+$/, ""), gtm: m.gtm.trim().toUpperCase(),
  });

  return (
    <div className="lib-dialog__scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Page settings" onClick={(e) => e.stopPropagation()}>
        <Dialog
          size="lg"
          title={`${page.name} settings`}
          cancelLabel="Close"
          confirmLabel="Save"
          onClose={onClose}
          onCancel={onClose}
          onConfirm={save}
          className="lib-dialog lib-dialog--form lib-dialog--publish lib-dialog--settings"
        >
          <Group title="General">
            <TextInput label="Page name" value={name} onChange={(e) => setName(e.target.value)} />
          </Group>

          <Group title="Access control" text="Who can open this page when it is published.">
            <div className="lib-scope lib-scope--fill" role="group" aria-label="Restrict access">
              {[["public", "Public"], ["password", "Anyone with the password"]].map(([id, label]) => (
                <button key={id} type="button" aria-pressed={m.access === id} className={`lib-scope__option${m.access === id ? " lib-scope__option--active" : ""}`} onClick={() => set({ access: id })}>
                  {label}
                </button>
              ))}
            </div>
            {m.access === "public" ? (
              <p className="lib-publish__note lib-publish__note--icon"><GlobeHemisphereWest size={15} /> Anyone on the internet can open this page.</p>
            ) : (
              <>
                <TextInput label="Password" placeholder="Shared with the people who should see it" value={m.password} onChange={(e) => set({ password: e.target.value })} />
                <p className="lib-publish__note lib-publish__note--icon"><LockSimple size={15} /> Visitors are asked for the password before the page loads.</p>
              </>
            )}
          </Group>

          <Group title="SEO settings" text="The page's title and description, as search engines show them.">
            <div className="lib-serp" aria-label="Search result preview">
              <span className="lib-serp__title">{clip(title, 60)}</span>
              <span className="lib-serp__url">{address}</span>
              <span className="lib-serp__text">{m.description ? clip(m.description, 155) : "Add a meta description. Without one, search engines pick text from the page."}</span>
            </div>
            <TextInput label="Title tag" placeholder={name} value={m.title} onChange={(e) => set({ title: e.target.value })} />
            <TextArea label="Meta description" placeholder="One or two sentences on what the page offers" rows={3} value={m.description} onChange={(e) => set({ description: e.target.value })} />
            <div className="lib-publish__switch">
              <Toggle label="Sitemap indexing" checked={m.sitemap} onChange={() => set({ sitemap: !m.sitemap })} />
              <p className="lib-dialog__hint lib-dialog__hint--flush">
                {m.sitemap ? "Search engines can list this page." : "Hidden from search engines. Use for pages that only paid campaigns should reach."}
              </p>
            </div>
            <TextInput label="Page canonical URL" placeholder="https://" value={m.canonical} onChange={(e) => set({ canonical: e.target.value })} />
            <p className="lib-dialog__hint">Points search engines at your preferred address when the same page is reachable at more than one.</p>
          </Group>

          <Group title="Open Graph settings" text="What shows when the page is shared on LinkedIn, X, Facebook and in chat apps.">
            <div className="lib-og" aria-label="Open Graph preview">
              <div className="lib-og__image">
                {m.ogImage
                  ? <img src={m.ogImage.src} alt="" />
                  : <ScaledPreview height={236}>{page.sections.slice(0, 2).map((s) => <Section key={s.key} item={s} />)}</ScaledPreview>}
              </div>
              <span className="lib-og__title">{ogTitle || title}</span>
              {ogDescription && <span className="lib-og__text">{clip(ogDescription, 200)}</span>}
              <span className="lib-og__host">{host}</span>
            </div>

            <TextInput label="Open Graph title" placeholder={title} value={m.ogSameTitle ? title : m.ogTitle} disabled={m.ogSameTitle} onChange={(e) => set({ ogTitle: e.target.value })} />
            <Checkbox label="Same as SEO title tag" checked={m.ogSameTitle} onChange={() => set({ ogSameTitle: !m.ogSameTitle })} />
            <TextArea label="Open Graph description" placeholder="Shown under the title when shared" rows={3} value={m.ogSameDescription ? m.description : m.ogDescription} disabled={m.ogSameDescription} onChange={(e) => set({ ogDescription: e.target.value })} />
            <Checkbox label="Same as SEO meta description" checked={m.ogSameDescription} onChange={() => set({ ogSameDescription: !m.ogSameDescription })} />

            <div className="lib-og__upload">
              <span className="lib-og__label">Open Graph image</span>
              <p className="lib-dialog__hint lib-dialog__hint--flush">
                At least 1200 by 630 pixels. {m.ogImage ? "" : "Until you add one, a snapshot of the page is used."}
              </p>
              {m.ogImage && (
                <span className="lib-og__file">
                  <img src={m.ogImage.src} alt="" />
                  <span><b>{m.ogImage.name}</b>{m.ogImage.kb} kB</span>
                </span>
              )}
              <div className="lib-og__actions">
                <Button variant="secondary" size="md" icon={UploadSimple} iconPosition="prefix" label={m.ogImage ? "Replace" : "Upload image"} onClick={() => fileRef.current?.click()} />
                {m.ogImage && <Button variant="ghost" size="md" icon={Trash} iconPosition="prefix" label="Delete" onClick={() => set({ ogImage: null })} />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} aria-label="Open Graph image file" />
            </div>
          </Group>

          <Group title="Tracking">
            <div className="lib-publish__switch">
              <Toggle label="Include the Petavue tracking pixel" checked={m.pixel} onChange={() => set({ pixel: !m.pixel })} />
              <p className="lib-dialog__hint lib-dialog__hint--flush">Lets Petavue measure visits and form completions on this page.</p>
            </div>
            <TextInput label="Google Tag Manager ID (optional)" placeholder="GTM-XXXXXXX" value={m.gtm} onChange={(e) => set({ gtm: e.target.value })} />
          </Group>

          <Group title="Forms">
            <Dropdown label="Send form submissions to" options={FORM_TARGETS} value={m.forms} onChange={(forms) => set({ forms })} />
          </Group>
        </Dialog>
      </div>
    </div>
  );
}
