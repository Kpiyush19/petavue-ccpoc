import { Button } from "@/ui";

// Unified sticky "unsaved changes" banner used across every integration's
// schema-style tab (SF/HS Schema, HubSpot Associations, Fivetran Schema,
// Fivetran Custom Reports). One look-and-feel everywhere so users build
// muscle memory regardless of integration.
//
// Sticky so the CTA stays visible while the user scrolls a long table list.
// `stickyTop` is opt-in because the tab bar offset differs slightly between
// integration shells.
export const UnsavedChangesBanner = ({
  message = "You have unsaved changes.",
  onDiscard,
  onSave,
  saveLabel = "Save changes",
  savingLabel = "Saving…",
  isSaving = false,
  stickyTop = "top-[101px]"
}) => (
  <div
    className={`sticky ${stickyTop} z-20 -mx-6 px-6 py-3 bg-[var(--color-primary-50,#EEF2FF)] border-y border-[var(--color-primary-200,#C7D2FE)] flex items-center justify-between gap-3 flex-wrap`}
  >
    <span className="text-xs font-medium text-[var(--color-primary-700,#3730A3)]">
      {message}
    </span>
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="md" onClick={onDiscard} disabled={isSaving}>
        Discard
      </Button>
      <Button variant="primary" size="md" onClick={onSave} disabled={isSaving}>
        {isSaving ? savingLabel : saveLabel}
      </Button>
    </div>
  </div>
);

export default UnsavedChangesBanner;
