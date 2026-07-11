import { useRef, useEffect } from "react";

const DEFAULT_MENU_ITEMS = {
  incremental: {
    label: "Sync latest changes",
    blurb: "Brings in records that have changed since the last sync.",
  },
  full: {
    label: "Re-sync everything",
    blurb: "Pulls every record again from scratch.",
  },
  initial: {
    label: "Start first sync",
    blurb: "Pulls all your existing data for this object.",
  },
};

export const SyncMenu = ({
  open,
  onClose,
  onPick,
  modes = ["incremental", "full"],
  items = DEFAULT_MENU_ITEMS
}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      onClose();
    };
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-20 bg-white border border-[var(--color-grey-200)] rounded-md shadow-lg min-w-[240px] py-1"
    >
      {modes.map((mode) => {
        const meta = items[mode];
        if (!meta) return null;
        return (
          <button
            key={mode}
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-[var(--color-grey-50)]"
            onClick={() => onPick(mode)}
          >
            <div className="text-xs font-medium text-[var(--color-text-primary)]">
              {meta.label}
            </div>
            <div className="text-[10px] text-[var(--color-grey-500)] mt-0.5 leading-snug">
              {meta.blurb}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SyncMenu;
