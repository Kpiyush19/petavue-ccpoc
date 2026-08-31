import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, CircleDot, Zap, ChevronDown, Check, Info } from "lucide-react";
import "./ModelModeMenu.css";

/**
 * Sage model-tier selector — Pro / Standard / Mini.
 *
 * Matches the "Choose your mode" dropdown used on the Sage home and the
 * session input bar. Controlled: pass `value` + `onChange`. Defaults to
 * "standard" if `value` is not one of the known ids.
 *
 * Placement: "top" opens the menu above the pill (use in bottom-anchored
 * input bars like the session composer); "bottom" opens below (home).
 */

export const SAGE_MODES = [
  {
    id: "pro",
    label: "Pro",
    beta: true,
    icon: Sparkles,
    description: "Deepest reasoning for complex work",
    tooltip: "Built for heavier workloads and single-shot prompts. Uses roughly 2x the credits of Standard.",
  },
  {
    id: "standard",
    label: "Standard",
    icon: CircleDot,
    description: "The familiar default for everyday analysis",
    tooltip: "Built for everyday analysis, dashboards, and multi-step follow-ups. The baseline credit cost other modes are measured against.",
  },
  {
    id: "mini",
    label: "Mini",
    beta: true,
    icon: Zap,
    description: "Ideal for lightweight tasks",
    tooltip: "Built for quick lookups, simple questions, and data auditing. Uses noticeably fewer credits than Standard.",
  },
];

const MODE_STORAGE_KEY = "petavue:sage-mode";

/** Read/write the shared mode so home + session stay in sync (best-effort). */
export function readSageMode() {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY);
    return SAGE_MODES.some((m) => m.id === v) ? v : "standard";
  } catch {
    return "standard";
  }
}
export function writeSageMode(id) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, id);
  } catch {
    /* private mode / quota — no-op */
  }
}

export function ModelModeMenu({
  value = "standard",
  onChange,
  disabled = false,
  placement = "bottom",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = SAGE_MODES.find((m) => m.id === value) || SAGE_MODES[1];

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = useCallback(
    (id) => {
      setOpen(false);
      if (id !== value) {
        writeSageMode(id);
        onChange && onChange(id);
      }
    },
    [onChange, value]
  );

  return (
    <div className={`mm ${className}`} ref={wrapRef}>
      <button
        type="button"
        className="mm__pill"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Model mode: ${selected.label}`}
      >
        <Sparkles size={14} className="mm__pill-spark" />
        <span className="mm__pill-label">{selected.label}</span>
        <ChevronDown size={14} className="mm__pill-caret" />
      </button>

      {open && (
        <div className={`mm__menu mm__menu--${placement}`} role="listbox">
          <div className="mm__menu-title">Choose your mode</div>
          {SAGE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSel = mode.id === value;
            const accent = isSel || mode.id === "pro";
            return (
              <button
                key={mode.id}
                type="button"
                role="option"
                aria-selected={isSel}
                className={`mm__item ${isSel ? "mm__item--selected" : ""}`}
                onClick={() => pick(mode.id)}
              >
                <span className="mm__item-icon">
                  <Icon size={16} className={accent ? "mm__ic-accent" : "mm__ic-muted"} />
                </span>
                <span className="mm__item-body">
                  <span className="mm__item-head">
                    <span className="mm__item-label">{mode.label}</span>
                    {mode.beta && <span className="mm__beta">Beta</span>}
                    {mode.tooltip && (
                      <span
                        className="mm__info-wrap"
                        tabIndex={0}
                        aria-label={mode.tooltip}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info size={13} className="mm__info" aria-hidden="true" />
                        <span className="mm__tip" role="tooltip">{mode.tooltip}</span>
                      </span>
                    )}
                  </span>
                  <span className="mm__item-desc">{mode.description}</span>
                </span>
                {isSel && (
                  <span className="mm__check" aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ModelModeMenu;
