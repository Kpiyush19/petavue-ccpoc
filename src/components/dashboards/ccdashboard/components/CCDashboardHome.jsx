import { useState, useEffect, useMemo, useRef } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Input } from "@/ui";
import { Button as PvButton } from "@/ui";
import { useScrollCleanup } from "@/hooks/useScrollCleanup";
import { CCDashboardElement } from "./CCDashboardElement";
import { DeleteDashboardModal } from "./DeleteDashboardModal";
import { RenameDashboardModal } from "./RenameDashboardModal";
import { useGetPublishedDashboards, getDashboardId } from "../api";
import { apiPut, apiDelete } from "@/api";

const GRID_COLUMNS = "5% 67% 8% 15% 5%";

const DefaultSkeleton = ({ width, height }) => (
  <div className="bg-[var(--color-grey-200)] rounded animate-pulse" style={{ width, height }} />
);

const DefaultInput = ({ value, onChange, placeholder, leftElem, disabled }) => (
  <Input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    leftElem={leftElem}
    disabled={disabled}
    showClearInput
    className={{
      input: {
        wrapper: "w-80 py-2 px-3",
        root: "text-xs"
      }
    }}
  />
);

const DefaultButton = ({ children, onClick, variant }) => (
  <PvButton
    onClick={onClick}
    size="sm"
    variant={variant === "primary" ? "primary" : "secondary"}
    label={children}
  />
);

const ListLoader = ({ length = 8, Skeleton }) => {
  const SkeletonComp = Skeleton || DefaultSkeleton;

  return (
    <div className="flex flex-col w-full gap-2">
      {Array.from({ length }).map((_, ind) => (
        <div
          className="grid w-full px-3 h-[52px] shrink-0 items-center border border-[var(--color-grey-100)] rounded-lg"
          style={{ gridTemplateColumns: GRID_COLUMNS }}
          key={ind}
        >
          <span className="px-2"><SkeletonComp width="18px" height="18px" /></span>
          <span className="px-2"><SkeletonComp width={ind % 2 === 0 ? "60%" : "40%"} height="18px" /></span>
          <span className="px-2"><SkeletonComp width="30px" height="18px" /></span>
          <span className="px-2"><SkeletonComp width="80px" height="18px" /></span>
          <span className="px-2 flex justify-center"><SkeletonComp width="18px" height="18px" /></span>
        </div>
      ))}
    </div>
  );
};

export const CCDashboardHome = ({ Skeleton, Input, Button }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [listOverflow, setListOverflow] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const listWrapperRef = useRef(null);

  const SkeletonComp = Skeleton || DefaultSkeleton;
  const InputComp = Input || DefaultInput;
  const ButtonComp = Button || DefaultButton;

  const {
    data: artifacts = [],
    isLoading: loading,
    isError,
    error,
    refetch
  } = useGetPublishedDashboards({
    config: {
      staleTime: Infinity
    }
  });

  const { tooltipShow, setTooltipShow } = useScrollCleanup({ containerRef: listWrapperRef, enabled: !loading });

  const handleDelete = async (dashboard) => {
    const dashboardId = getDashboardId(dashboard);
    try {
      await apiDelete(`/api/workflows/dashboards/${dashboardId}`);
      toast.success("Dashboard deleted");
      setDeleteConfirm(null);
      refetch();
    } catch (e) {
      toast.error("Failed to delete: " + e.message);
      throw e;
    }
  };

  const handleRename = async (dashboard, newName) => {
    const dashboardId = getDashboardId(dashboard);
    try {
      await apiPut(`/api/workflows/dashboards/${dashboardId}`, { name: newName });
      toast.success("Dashboard renamed");
      setRenaming(null);
      refetch();
    } catch (e) {
      toast.error("Failed to rename: " + e.message);
      throw e;
    }
  };

  const handleToggleShare = async (dashboard) => {
    const dashboardId = getDashboardId(dashboard);
    try {
      await apiPut(`/api/workflows/dashboards/${dashboardId}`, { shared: !dashboard.shared });
      toast.success(dashboard.shared ? "Dashboard unshared" : "Dashboard shared with team");
      refetch();
    } catch (e) {
      toast.error("Failed: " + e.message);
    }
  };

  const filteredArtifacts = useMemo(() => {
    if (!searchQuery.trim()) return artifacts;
    const query = searchQuery.toLowerCase();
    return artifacts.filter((a) => a.name?.toLowerCase().includes(query));
  }, [artifacts, searchQuery]);

  useEffect(() => {
    if (listWrapperRef.current) {
      const hasOverflow = listWrapperRef.current.scrollHeight > listWrapperRef.current.clientHeight;
      setListOverflow(hasOverflow);
    } else {
      setListOverflow(false);
    }
  }, [loading, filteredArtifacts]);

  return (
    <div className="flex flex-col w-full h-full overflow-x-auto">
      <div className="flex flex-col w-full h-full min-w-[800px]">
        <div className="flex w-full px-6 items-center justify-between h-[60px] shrink-0 border-b border-[var(--color-grey-100)] bg-white">
          <span className="text-[16px] leading-[24px] font-medium">Dashboards</span>
        </div>

        <div
          className="w-full p-4 flex overflow-x-auto bg-[var(--color-grey-50)]"
          style={{ height: "calc(100% - 64px)" }}
        >
          <div className="flex flex-col bg-white rounded-xl h-full w-full overflow-hidden min-w-[800px]">
            <div className="flex items-center justify-between h-14 shrink-0 w-full border-b border-[var(--color-grey-100)]">
              <div className="px-8 flex gap-2.5 items-center">
                <span className="font-medium text-[14px]">All Dashboards</span>
                <span className="text-xs text-white bg-[var(--color-primary-500)] px-1.5 py-0.5 rounded-md">
                  {filteredArtifacts.length}
                </span>
              </div>
              <div className="flex gap-3 items-center pr-4">
                <InputComp
                  placeholder="Search Dashboard"
                  leftElem={<MagnifyingGlass size={16} />}
                  value={searchQuery}
                  disabled={loading || artifacts.length === 0}
                  onChange={(e) => setSearchQuery(e?.target?.value || "")}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col w-full px-4 py-2" style={{ height: "calc(100% - 56px)" }}>
                <div
                  className="grid w-full p-2 border-b border-[var(--color-grey-100)]"
                  style={{ gridTemplateColumns: GRID_COLUMNS }}
                >
                  <span className="px-2"><SkeletonComp width="12px" height="12px" /></span>
                  <span className="px-2"><SkeletonComp width="36px" height="12px" /></span>
                  <span className="px-2"><SkeletonComp width="42px" height="12px" /></span>
                  <span className="px-2"><SkeletonComp width="85px" height="12px" /></span>
                  <span className="px-2" />
                </div>
                <div className="py-2 overflow-hidden" style={{ height: "calc(100% - 32px)" }}>
                  <ListLoader Skeleton={Skeleton} />
                </div>
              </div>
            ) : isError ? (
              <div className="flex flex-col w-full h-full justify-center items-center gap-3">
                <span className="text-sm text-[var(--color-red)]">
                  {error?.response?.data?.error?.message || error?.message || "Failed to load dashboards"}
                </span>
                <ButtonComp variant="primary" onClick={() => refetch()}>
                  Retry
                </ButtonComp>
              </div>
            ) : filteredArtifacts.length === 0 && searchQuery ? (
              <div className="w-full h-full flex">
                <div className="m-auto text-[var(--color-grey-500)] flex flex-col gap-2 items-center">
                  <div className="mx-auto">
                    No results for <b className="text-[var(--color-grey-900)]">"{searchQuery}"</b>
                  </div>
                  <div className="flex">
                    <ButtonComp onClick={() => setSearchQuery("")}>Clear search</ButtonComp>
                  </div>
                </div>
              </div>
            ) : filteredArtifacts.length === 0 ? (
              <div className="flex flex-col w-full h-full justify-center items-center gap-3">
                <span className="text-[var(--color-grey-500)] font-normal text-sm">No dashboards to list</span>
              </div>
            ) : (
              <div className="flex flex-col w-full px-4 py-2" style={{ height: "calc(100% - 56px)" }}>
                <div
                  className={`grid p-2 ${listOverflow ? "w-[calc(100%-8px)]" : "w-full"}`}
                  style={{ gridTemplateColumns: GRID_COLUMNS }}
                >
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2">#</span>
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2">Name</span>
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2">Shared</span>
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2">Last Modified</span>
                  <span className="text-[var(--color-grey-500)] font-medium text-xs px-2"></span>
                </div>

                <div
                  ref={listWrapperRef}
                  className="flex flex-col w-full overflow-y-auto gap-2 py-2"
                  style={{ height: "calc(100% - 32px)" }}
                >
                  {filteredArtifacts.map((artifact, index) => (
                    <CCDashboardElement
                      key={getDashboardId(artifact)}
                      artifact={artifact}
                      index={index}
                      Skeleton={Skeleton}
                      openMenuId={openMenuId}
                      onMenuChange={setOpenMenuId}
                      onRename={setRenaming}
                      onDelete={setDeleteConfirm}
                      onToggleShare={handleToggleShare}
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

      <DeleteDashboardModal
        dashboard={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onDelete={handleDelete}
      />

      <RenameDashboardModal
        dashboard={renaming}
        onClose={() => setRenaming(null)}
        onRename={handleRename}
      />
    </div>
  );
};
