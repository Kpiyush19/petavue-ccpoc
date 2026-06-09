import { Pencil, Trash2, ExternalLink, Eye, EyeOff, MonitorPlay } from "lucide-react";
import { DotsThree } from "@phosphor-icons/react";
import { Tooltip, Popper } from "@/common-components";
import { formatDate, formatDateTime } from "@/common-utils/formatDateTime";
import { timeAgo } from "@/common-utils/relativeTimeDiff";
import { getCurrentUser } from "../../../../api";
import { getDashboardId } from "../api";
import { useNavigate, useBasePath } from "../context";

const GRID_COLUMNS = "5% 67% 8% 15% 5%";

export const CCDashboardElement = ({
  artifact,
  index,
  openMenuId,
  onMenuChange,
  onRename,
  onDelete,
  onToggleShare,
  scrollContainerRef,
  tooltipActive,
  onTooltipReset,
}) => {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const dashboardId = getDashboardId(artifact);
  const currentUserId = getCurrentUser()?.userId || ""
  const isOwner = artifact.created_by && artifact.created_by === currentUserId;

  return (
    <div
      role="button"
      tabIndex={0}
      className="grid w-full px-3 h-[52px] shrink-0 items-center border border-[var(--pv-neutral-grey-150)] rounded-lg hover:bg-[var(--pv-primary-50)] hover:border-[var(--pv-primary-300)] active:border-[var(--pv-neutral-grey-200)] active:bg-white text-left group cursor-pointer bg-white"
      style={{ gridTemplateColumns: GRID_COLUMNS }}
      onClick={() => navigate(`${basePath}/${dashboardId}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`${basePath}/${dashboardId}`);
        }
      }}
    >
      <span className="flex items-center px-2 text-sm text-[var(--pv-neutral-grey-500)]">
        {index + 1}
      </span>

      <span className="flex items-center px-2 min-w-0 overflow-hidden">
        <Tooltip title={artifact.name} displayTooltipOnOverflow arrow placement="top" tooltipActive={tooltipActive}>
          <a
            href={`${basePath}/${dashboardId}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`${basePath}/${dashboardId}`);
            }}
            onMouseEnter={onTooltipReset}
            className="text-sm truncate group-hover:text-[var(--pv-primary-500)] group-hover:underline"
          >
            {artifact.name}
          </a>
        </Tooltip>
      </span>

      <span className="flex items-center px-2 text-sm text-[var(--pv-neutral-grey-600)]">
        {artifact.shared ? "Yes" : "No"}
      </span>

      <span className="flex items-center px-2 text-sm text-[var(--pv-neutral-grey-500)]">
        <Tooltip title={formatDateTime(artifact.latest_run?.refreshed_at || artifact.created_at, artifact.tenant_timezone) || formatDate(artifact.latest_run?.refreshed_at || artifact.created_at)} arrow placement="top" tooltipActive={tooltipActive}>
          <span onMouseEnter={onTooltipReset}>{timeAgo(artifact.latest_run?.refreshed_at || artifact.created_at)}</span>
        </Tooltip>
      </span>

      <span
        className="flex items-center justify-center px-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Popper
          buttonChildren={<DotsThree size={18} weight="bold" />}
          placement="bottom-end"
          btnSize="sm"
          btnColor="transparent"
          mainBtnClassName="!p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--pv-neutral-grey-400)] hover:text-[var(--pv-neutral-grey-700)] hover:bg-[var(--pv-neutral-grey-100)] rounded-lg"
          popperClassName="w-48"
          closeOnClickInside
          zIndex={50}
          scrollContainerRef={scrollContainerRef}
          open={openMenuId === dashboardId}
          onOpenChange={(isOpen) => onMenuChange?.(isOpen ? dashboardId : null)}
        >
          {artifact.workflow_id && (
            <button
              onClick={() => navigate(`/workflows/${artifact.workflow_id}`)}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--pv-neutral-grey-700)] hover:bg-[var(--pv-neutral-grey-50)] active:bg-white active:text-[var(--pv-neutral-grey-600)] transition-colors bg-transparent border-none cursor-pointer"
            >
              <ExternalLink size={14} />
              View Workflow
            </button>
          )}
          {isOwner && artifact.source_session_id && (
            <button
              onClick={() => navigate(`/session/${artifact.source_session_id}`)}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--pv-neutral-grey-700)] hover:bg-[var(--pv-neutral-grey-50)] active:bg-white active:text-[var(--pv-neutral-grey-600)] transition-colors bg-transparent border-none cursor-pointer"
            >
              <MonitorPlay size={14} />
              Source Session
            </button>
          )}
          <button
            onClick={() => onRename?.(artifact)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--pv-neutral-grey-700)] hover:bg-[var(--pv-neutral-grey-50)] active:bg-white active:text-[var(--pv-neutral-grey-600)] transition-colors bg-transparent border-none cursor-pointer"
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            onClick={() => onToggleShare?.(artifact)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--pv-neutral-grey-700)] hover:bg-[var(--pv-neutral-grey-50)] active:bg-white active:text-[var(--pv-neutral-grey-600)] transition-colors bg-transparent border-none cursor-pointer"
          >
            {artifact.shared ? <EyeOff size={14} /> : <Eye size={14} />}
            {artifact.shared ? "Unshare" : "Share with team"}
          </button>
          <div className="border-t border-[var(--pv-neutral-grey-150)]" />
          <button
            onClick={() => onDelete?.(artifact)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--pv-error-text)] hover:bg-[var(--pv-error-bg)] active:bg-white active:text-[var(--pv-error-text)]/60 transition-colors bg-transparent border-none cursor-pointer"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </Popper>
      </span>
    </div>
  );
};
