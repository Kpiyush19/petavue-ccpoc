import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  MagnifyingGlass,
  DotsThree,
  Pencil,
  Trash,
  Tray,
  Flask,
  ChatCircle,
} from "@phosphor-icons/react";
import { Input, Button, Popper, Tooltip } from "@/ui";
import { useScrollCleanup } from "@/hooks/useScrollCleanup";
import { formatDate, formatDateTime } from "@/utils/formatDateTime";
import { timeAgo } from "@/utils/relativeTimeDiff";
import { useSessionsListQuery, useInvalidateSessionsList } from "../hooks/useSessionsQuery";
import { apiPatch, apiDelete } from "../api";
import { DeleteSessionModal } from "./sessions/components/DeleteSessionModal";
import { RenameSessionModal } from "./sessions/components/RenameSessionModal";
import { getSessionRowMeta, badgeDotClassname } from "../components/sessions/sessionRowMeta";
import { cn } from "../utils/cn";

const GRID_COLUMNS = "5% 70% 20% 5%";

const Skeleton = ({ width, height }) => (
  <div className="bg-[var(--color-grey-200)] rounded animate-pulse" style={{ width, height }} />
);

const ListLoader = ({ length = 8 }) => (
  <div className="flex flex-col w-full gap-2">
    {Array.from({ length }).map((_, ind) => (
      <div
        className="grid w-full px-3 h-[52px] shrink-0 items-center border border-[var(--color-grey-100)] rounded-lg"
        style={{ gridTemplateColumns: GRID_COLUMNS }}
        key={ind}
      >
        <span className="px-2"><Skeleton width="18px" height="18px" /></span>
        <span className="px-2"><Skeleton width={ind % 2 === 0 ? "60%" : "40%"} height="18px" /></span>
        <span className="px-2"><Skeleton width="80px" height="18px" /></span>
        <span className="px-2 flex justify-center"><Skeleton width="18px" height="18px" /></span>
      </div>
    ))}
  </div>
);

const SessionElement = ({
  session: s,
  index,
  openMenuId,
  onMenuChange,
  onSelect,
  onRename,
  onDelete,
  scrollContainerRef,
  tooltipActive,
  onTooltipReset
}) => {
  const meta = getSessionRowMeta(s);
  const IconComp = meta.isSkillRun ? Flask : ChatCircle;
  const iconColor = meta.iconMuted
    ? "text-[var(--color-text-disabled)]"
    : "text-[var(--color-grey-500)]";
  const fallbackName = `Session from ${s.last_active_at ? formatDate(s.last_active_at) : "unknown"}`;
  const tooltipTitle = meta.badge?.ariaLabel
    ? `${s.name || fallbackName}, ${meta.badge.ariaLabel}`
    : (s.name || fallbackName);
  return (
    <button
      className="grid w-full px-3 h-[52px] shrink-0 items-center border border-[var(--color-grey-100)] rounded-lg hover:bg-[var(--color-primary-50)] hover:border-[var(--color-primary-300)] active:border-[var(--color-grey-200)] active:bg-white text-left group cursor-pointer bg-white"
      style={{ gridTemplateColumns: GRID_COLUMNS }}
      onClick={() => onSelect(meta.route)}
    >
      <span className="flex items-center px-2 text-sm text-[var(--color-grey-500)]">
        {index + 1}
      </span>

      <span className="flex items-center gap-2 px-2 min-w-0 overflow-hidden">
        <span className="relative shrink-0 flex items-center">
          <IconComp size={14} className={cn(iconColor, "shrink-0")} />
          {meta.badge && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white",
                badgeDotClassname(meta.badge.kind)
              )}
              aria-label={meta.badge.ariaLabel}
            />
          )}
        </span>
        <Tooltip title={tooltipTitle} displayTooltipOnOverflow arrow placement="top" tooltipActive={tooltipActive}>
          <a
            href={meta.route}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(meta.route);
            }}
            onMouseEnter={onTooltipReset}
            className="text-sm truncate group-hover:text-[var(--color-primary-500)] group-hover:underline"
          >
            {s.name || fallbackName}
          </a>
        </Tooltip>
      </span>

      <span className="flex items-center px-2 text-sm text-[var(--color-grey-500)]">
        <Tooltip title={formatDateTime(s.last_active_at || s.created_at, s.tenant_timezone) || formatDate(s.last_active_at || s.created_at)} arrow placement="top" tooltipActive={tooltipActive}>
          <span onMouseEnter={onTooltipReset}>{timeAgo(s.last_active_at || s.created_at)}</span>
        </Tooltip>
      </span>

      <span
        className="flex items-center justify-center px-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Popper
          buttonChildren={<DotsThree size={18} weight="bold" />}
          placement="bottom-end"
          size="sm"
          variant="ghost"
          className="!p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-grey-400)] hover:text-[var(--color-grey-700)] hover:bg-[var(--color-grey-100)] rounded-lg"
          popperClassName="w-40"
          closeOnClickInside
          zIndex={50}
          scrollContainerRef={scrollContainerRef}
          open={openMenuId === s.session_id}
          onOpenChange={(isOpen) => onMenuChange?.(isOpen ? s.session_id : null)}
        >
          <button
            onClick={() => onRename?.(s)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-grey-700)] hover:bg-[var(--color-grey-50)] active:bg-white active:text-[var(--color-grey-600)] transition-colors bg-transparent border-none cursor-pointer"
          >
            <Pencil size={14} />
            Rename
          </button>
          <div className="border-t border-[var(--color-grey-100)]" />
          <button
            onClick={() => onDelete?.(s)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-red)] hover:bg-[var(--color-red-bg)] active:bg-white active:text-[var(--color-red)]/60 transition-colors bg-transparent border-none cursor-pointer"
          >
            <Trash size={14} />
            Delete
          </button>
        </Popper>
      </span>
    </button>
  );
};

export default function SessionsPage() {
  const { data: sessionList = [], isLoading } = useSessionsListQuery();
  const invalidateSessions = useInvalidateSessionsList();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [listOverflow, setListOverflow] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const listWrapperRef = useRef(null);
  const { tooltipShow, setTooltipShow } = useScrollCleanup({ containerRef: listWrapperRef, enabled: !isLoading });

  // `route` is computed per-row via getSessionRowMeta — in-flight skill_run
  // sessions go to /skills-v2/run/:id, everything else to /session/:id.
  const handleSelect = (route) => {
    navigate(route);
  };

  const handleRename = async (sess, newName) => {
    await apiPatch(`/api/sessions/${sess.session_id}`, { name: newName });
    toast.success("Session renamed");
    setRenaming(null);
    invalidateSessions();
  };

  const handleDelete = async (sess) => {
    await apiDelete(`/api/sessions/${sess.session_id}?archive=true`);
    toast.success("Session deleted");
    setDeleteConfirm(null);
    invalidateSessions();
  };

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessionList;
    const query = searchQuery.toLowerCase();
    return sessionList.filter(
      (s) =>
        s.session_id.toLowerCase().includes(query) ||
        (s.name || "").toLowerCase().includes(query)
    );
  }, [sessionList, searchQuery]);

  useEffect(() => {
    if (listWrapperRef.current) {
      const hasOverflow = listWrapperRef.current.scrollHeight > listWrapperRef.current.clientHeight;
      setListOverflow(hasOverflow);
    } else {
      setListOverflow(false);
    }
  }, [isLoading, filteredSessions]);

  return (
    <div className="flex flex-col w-full h-full overflow-x-auto">
      <div className="flex flex-col w-full h-full min-w-[800px]">
        <div className="flex w-full px-6 items-center justify-between h-[64px] shrink-0 border-b border-[var(--color-grey-100)] bg-white">
          <span className="text-[16px] leading-[24px] font-medium">Sessions</span>
        </div>

        <div
          className="w-full p-4 flex overflow-x-auto bg-[var(--color-grey-50)]"
          style={{ height: "calc(100% - 64px)" }}
        >
          <div className="flex flex-col bg-white rounded-xl h-full w-full overflow-hidden min-w-[800px]">
            <div className="flex items-center justify-between h-14 shrink-0 w-full border-b border-[var(--color-grey-100)]">
              <div className="px-8 flex gap-2.5 items-center">
                <span className="font-medium text-[14px]">All Sessions</span>
                <span className="text-xs text-white bg-[var(--color-primary-500)] px-1.5 py-0.5 rounded-md">
                  {filteredSessions.length}
                </span>
              </div>
              <div className="flex gap-3 items-center pr-4">
                <Input
                  placeholder="Search Sessions"
                  leftElem={<MagnifyingGlass size={16} />}
                  value={searchQuery}
                  disabled={isLoading || sessionList.length === 0}
                  onChange={(e) => setSearchQuery(e?.target?.value || "")}
                  showClearInput
                  className={{
                    input: {
                      wrapper: "w-80 py-2 px-3",
                      root: "text-xs"
                    }
                  }}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col w-full px-4 py-2" style={{ height: "calc(100% - 56px)" }}>
                <div
                  className="grid w-full p-2 border-b border-[var(--color-grey-100)]"
                  style={{ gridTemplateColumns: GRID_COLUMNS }}
                >
                  <span className="px-2"><Skeleton width="12px" height="12px" /></span>
                  <span className="px-2"><Skeleton width="36px" height="12px" /></span>
                  <span className="px-2"><Skeleton width="70px" height="12px" /></span>
                  <span className="px-2" />
                </div>
                <div className="py-2 overflow-hidden" style={{ height: "calc(100% - 32px)" }}>
                  <ListLoader />
                </div>
              </div>
            ) : filteredSessions.length === 0 && searchQuery ? (
              <div className="w-full h-full flex">
                <div className="m-auto text-[var(--color-grey-500)] flex flex-col gap-2 items-center">
                  <div className="mx-auto">
                    No results for <b className="text-[var(--color-grey-900)]">"{searchQuery}"</b>
                  </div>
                  <div className="flex">
                    <Button size="sm" variant="secondary" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  </div>
                </div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col w-full h-full justify-center items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-grey-100)] flex items-center justify-center">
                  <Tray size={24} className="text-[var(--color-grey-400)]" />
                </div>
                <span className="text-[var(--color-grey-500)] font-normal text-sm">No sessions yet</span>
              </div>
            ) : (
              <div className="flex flex-col w-full px-4 py-2" style={{ height: "calc(100% - 56px)" }}>
                <div
                  className={`grid p-2 ${listOverflow ? "w-[calc(100%-8px)]" : "w-full"}`}
                  style={{ gridTemplateColumns: GRID_COLUMNS }}
                >
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2">#</span>
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2">Name</span>
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2">Last Active</span>
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2"></span>
                </div>

                <div
                  ref={listWrapperRef}
                  className="flex flex-col w-full overflow-y-auto gap-2 py-2"
                  style={{ height: "calc(100% - 32px)" }}
                >
                  {filteredSessions.map((s, index) => (
                    <SessionElement
                      key={s.session_id}
                      session={s}
                      index={index}
                      openMenuId={openMenuId}
                      onMenuChange={setOpenMenuId}
                      onSelect={handleSelect}
                      onRename={setRenaming}
                      onDelete={setDeleteConfirm}
                      scrollContainerRef={listWrapperRef}
                      tooltipActive={tooltipShow}
                      onTooltipReset={() => setTooltipShow(true)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RenameSessionModal
        session={renaming}
        onClose={() => setRenaming(null)}
        onRename={handleRename}
      />

      <DeleteSessionModal
        session={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
