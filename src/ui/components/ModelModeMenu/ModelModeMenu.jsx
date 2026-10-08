import { useCallback } from "react";
import { Sparkles, CircleDot, Zap, ChevronDown, Check, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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
  const selected = SAGE_MODES.find((m) => m.id === value) || SAGE_MODES[1];

  const pick = useCallback(
    (id) => {
      if (id !== value) {
        writeSageMode(id);
        onChange && onChange(id);
      }
    },
    [onChange, value]
  );

  return (
    <div className={`mm ${className}`}>
      {/* The list is the product dropdown (components/shadcn/dropdown-menu). */}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          render={<button type="button" className="mm__pill" aria-label={`Model mode: ${selected.label}`} />}
        >
          <Sparkles size={14} className="mm__pill-spark" />
          <span className="mm__pill-label">{selected.label}</span>
          <ChevronDown size={14} className="mm__pill-caret" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={placement === "top" ? "top" : "bottom"}
          align="end"
          sideOffset={8}
          className="w-[328px] !overflow-visible"
        >
          <div className="mm__menu-title">Choose your mode</div>
          {SAGE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSel = mode.id === value;
            return (
              <DropdownMenuItem key={mode.id} className="items-start" onClick={() => pick(mode.id)}>
                <span className="mm__item-icon">
                  <Icon size={16} />
                </span>
                <span className="mm__item-body">
                  <span className="mm__item-head">
                    <span>{mode.label}</span>
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
                {isSel && <Check size={16} strokeWidth={2.5} color="var(--color-primary-500)" aria-hidden="true" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ModelModeMenu;
