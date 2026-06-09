import { Info } from "@phosphor-icons/react";
import Tooltip from "../../../../../common-components/Tooltip";

export const TabButton = ({ active, onClick, children, tooltip }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      // cursor-pointer → hand cursor on the whole tab (name + icon) so it reads
      // as clickable; inactive tabs get a subtle background + text highlight on
      // hover (no underline — that mimics the active-tab style and looks dated).
      "px-4 py-2 text-sm font-medium border-b-2 rounded-t-md transition-colors inline-flex items-center gap-1.5 cursor-pointer",
      active
        ? "border-[var(--pv-primary-500)] text-[var(--pv-primary-500)]"
        : "border-transparent text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-text-primary-text)] hover:bg-[var(--pv-neutral-grey-100)]"
    ].join(" ")}
  >
    <span>{children}</span>
    {tooltip && (
      <Tooltip title={tooltip} arrow placement="top" maxWidth="280px">
        <span
          aria-label={tooltip}
          className="text-[var(--pv-neutral-grey-400)] hover:text-[var(--pv-neutral-grey-500)] inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          <Info size={13} />
        </span>
      </Tooltip>
    )}
  </button>
);

export default TabButton;
