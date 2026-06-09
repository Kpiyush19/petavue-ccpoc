import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ArrowLineLeft, CaretRight, PencilSimple } from "@phosphor-icons/react";
import { isEmpty, isEqual } from "lodash";
import { useGetDictionariesList, useGetTagsList, useUpdateGuidedAnalysisStatus } from "../api";
import { useNavigate, useUser, useQueryClient, useBasePath } from "../context";
import { Toggle } from "@/common-components/Toggle";
import DictionaryDropdown from "./DictionaryDropdown";
import { SelectedIntegrationTables } from "./SelectedIntegrationTables";
import { SelectedTableColumns } from "./SelectedTableColumns";
import { ColumnSampleDataModal } from "./ColumnSampleDataModal";
import { EditDictColumnDetailModal } from "./EditDictColumnDetailModal";
import { BulkActionModal } from "./BulkActionModal";
import { EditDescModal } from "./EditDescModal";
import { TagBulkActionModal } from "./TagBulkActionModal";

// Custom smooth scroll function with easing
function customScrollToElement(element, parent, duration = 1000, block = "start") {
  if (!element || !parent) return;

  const startPosition = parent.scrollTop;
  const elementRect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  const elementTopRelativeToParent = elementRect.top - parentRect.top;

  let targetPosition;
  if (block === "center") {
    targetPosition = elementTopRelativeToParent + parent.scrollTop - (parent.clientHeight / 2 - elementRect.height / 2);
  } else if (block === "end") {
    targetPosition = elementTopRelativeToParent + parent.scrollTop - (parent.clientHeight - elementRect.height);
  } else {
    targetPosition = elementTopRelativeToParent + parent.scrollTop;
  }

  const distance = targetPosition - startPosition;
  let startTime = null;

  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const scrollY = ease(timeElapsed, startPosition, distance, duration);
    parent.scrollTop = scrollY;

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

export const DictionaryDetailBox = ({ dataCatalogId, Skeleton, Tooltip, Markdown }) => {
  const [selectedTab, setSelectedTab] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currIntegSelected, setCurrIntegSelected] = useState({});
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesPageNumber, setTablesPageNumber] = useState(1);
  const [currentColPageNumber, setCurrentColPageNumber] = useState(1);
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [immediateSearchQuery, setImmediateSearchQuery] = useState("");
  const [colDataModalOpen, setColDataModalOpen] = useState(false);
  const [columnDetails, setColumnDetails] = useState({});
  const [colEditModalOpen, setColEditModalOpen] = useState(false);
  const [selectedColDetails, setSelectedColDetails] = useState({});
  const [defCols, setDefCols] = useState(0);
  const [enabledCols, setEnabledCols] = useState(0);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [bulkActModalOpen, setBulkActModalOpen] = useState(false);
  const [selectedBulkDetails, setSelectedBulkDetails] = useState({});
  const [colRefetch, setColRefetch] = useState(false);
  const [colTooltipShow, setColTooltipShow] = useState(false);
  const [bulkCols, setBulkCols] = useState([]);
  const [bulkActActive, setBulkActActive] = useState(false);
  const [bulkExcludeCols, setBulkExcludeCols] = useState([]);
  const [editDescModal, setEditDescModal] = useState(false);
  const [editDescDetails, setEditDescDetails] = useState({});
  const [shouldScrollFetch, setShouldScrollFetch] = useState(true);
  const [toggleDisabled, setToggleDisabled] = useState(false);
  const [applyTags, setApplyTags] = useState([]);
  const [clearTags, setClearTags] = useState([]);
  const [tagBulkActModalOpen, setTagBulkActModalOpen] = useState({ open: false, type: "", text: "" });
  const [noCols, setNoCols] = useState(false);

  // Table/Column switch states
  const [canSwitchTable, setCanSwitchTable] = useState({});
  const [canSwitchColumn, setCanSwitchColumn] = useState({});
  const [canScrollCol, setCanScrollCol] = useState({ bool: false, ind: -1 });
  const [tableScrollingDone, setTableScrollingDone] = useState(false);

  const scrollFilterCleaner = useRef(null);
  const bulkActionPostCleaner = useRef(null);
  const tableColSearchCleaner = useRef(null);
  const tableRef = useRef(null);
  const columnRef = useRef(null);
  const integNameElement = useRef(null);

  const navigate = useNavigate();
  const basePath = useBasePath();
  const user = useUser();
  const queryClient = useQueryClient();

  const updateGuidedAnalysisStatus = useUpdateGuidedAnalysisStatus();
  const dictionariesListData = useGetDictionariesList({ config: { staleTime: Infinity } });
  const tagList = useGetTagsList({ payload: { keyword: "" }, config: { staleTime: Infinity } });

  const currDataSource = dictionariesListData.data?.data?.find((d) => d.id === dataCatalogId) || {};

  useEffect(() => {
    setCurrIntegSelected(currDataSource);
  }, [dataCatalogId, currDataSource?.id]);

  // Deep-link support: /data-hub/dictionary/{integrationId}?table={tableId}
  // auto-selects that table once the source's tables load (e.g. the "View table"
  // link from the integration Schema tab). Reuses the existing canSwitchTable flow.
  useEffect(() => {
    const tableId = new URLSearchParams(window.location.search).get("table");
    if (tableId && dataCatalogId) {
      setCanSwitchTable({ id: tableId, integrationId: dataCatalogId });
    }
  }, [dataCatalogId]);

  useEffect(() => {
    if (integNameElement.current) {
      integNameElement.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      setColRefetch(false);
      setShouldScrollFetch(true);
    }, 1000);
  }, [selectedTab?.id]);

  // Handle table click from search - switch to that integration and table
  const handleTableClick = (tab) => {
    if (Array.isArray(dictionariesListData.data?.data) && dictionariesListData.data.data.length > 0) {
      const allSources = dictionariesListData.data.data;
      const ind = allSources.findIndex((src) => src.id === tab.integrationId);
      if (ind > -1) {
        const source = allSources[ind];
        navigate(`${basePath}/${source.id}`);
        setCurrIntegSelected(source);
        setCanSwitchTable(tab); // Trigger table switch
        setSearchQuery("");
      }
    }
  };

  // Handle column click from search - switch to table first, then column
  const handleColumnClick = (col) => {
    const tab = {
      description: col.tableDescription,
      disabledForGuidedAnalysis: col.disabledForGuidedAnalysis,
      id: col.tableId,
      integrationId: col.integrationId,
      integrationName: col.integrationName,
      integration_logo: col.integrationLogo,
      name: col.tableName,
      label: col?.tableLabel || "",
      platform: col.platform
    };
    handleTableClick(tab);
    setCanSwitchColumn(col); // Trigger column switch after table switch
  };

  // Effect: When tables load and canSwitchTable is set, find and select that table
  useEffect(() => {
    if (!tablesLoading && Array.isArray(tables) && tables.length > 0 && !isEmpty(canSwitchTable)) {
      const integId = tables[0]?.integrationId;
      if (integId === canSwitchTable.integrationId) {
        let ind = tables.findIndex((tab) => tab.id === canSwitchTable.id);

        // If table not found in list, add it at the beginning
        if (ind === -1) {
          setTables((prev) => [canSwitchTable, ...prev]);
          ind = 0;
        }

        setSelectedTab(tables[ind] || canSwitchTable);

        // Scroll to the table in the sidebar
        if (tableRef.current) {
          setTimeout(() => {
            const tabHL = tableRef.current.children[ind * 2];
            if (tabHL) {
              customScrollToElement(tabHL, tableRef.current, 500, "center");
            }
            setTimeout(() => {
              setTableScrollingDone(true);
            }, 500);
          }, 10);
        }
      }
    }
  }, [tablesLoading, tables, canSwitchTable]);

  // Clear canSwitchTable once table is selected
  useEffect(() => {
    if (canSwitchTable?.id === selectedTab?.id && !isEmpty(canSwitchTable)) {
      setCanSwitchTable({});
    }
  }, [selectedTab, canSwitchTable]);

  // Effect: When column switch is triggered and correct table is selected
  useEffect(() => {
    if (
      !isEmpty(canSwitchColumn) &&
      selectedTab.id === canSwitchColumn.tableId &&
      columns.length > 0 &&
      columns[0]?.tableId === selectedTab.id
    ) {
      let ind = columns.findIndex((column) => column.name === canSwitchColumn.name);

      // If column not found in loaded list, insert it
      if (ind === -1) {
        const tempCol = {
          description: canSwitchColumn.columnDescription,
          disabledForGuidedAnalysis: canSwitchColumn.disabledForGuidedAnalysis,
          integrationId: canSwitchColumn.integrationId,
          label: canSwitchColumn.label,
          mappings: canSwitchColumn.mappings,
          name: canSwitchColumn.name,
          nonNullValuePercentage: canSwitchColumn.nonNullValuePercentage,
          platform: canSwitchColumn.platform,
          primary: canSwitchColumn.primary,
          format: canSwitchColumn.format,
          tableId: canSwitchColumn.tableId,
          tableName: canSwitchColumn.tableName,
          tags: canSwitchColumn.tags,
          type: canSwitchColumn.type
        };

        // Insert near the end but not at the very end
        if (columns.length > 10) {
          ind = columns.length - 7;
        } else {
          ind = columns.length;
        }

        setColumns((prev) => {
          const temp = structuredClone(prev || []);
          if (temp.length > 10) {
            return [...temp.slice(0, temp.length - 7), tempCol, ...temp.slice(temp.length - 7)];
          } else {
            return [...temp, tempCol];
          }
        });
      }

      setCanScrollCol({ bool: true, ind });
      setCanSwitchColumn({});
    }
  }, [selectedTab.id, canSwitchColumn, columns]);

  // Effect: Scroll to column and highlight it
  useEffect(() => {
    if (tableScrollingDone && columns.length > 0 && canScrollCol.bool) {
      if (columnRef.current) {
        setTimeout(() => {
          const colmList = columnRef.current.querySelector(".col-list");
          if (colmList) {
            const colHL = colmList.children[canScrollCol.ind];
            if (colHL) {
              // Scroll to column
              customScrollToElement(colHL, columnRef.current, 600, "center");

              // Add highlight classes
              colHL.classList.add("bg-[var(--pv-primary-50)]");
              colHL.classList.add("border-[var(--pv-primary-500)]");
              colHL.classList.add("ring-2");
              colHL.classList.add("ring-[var(--pv-neutral-grey-300)]");

              // Remove highlight after 4 seconds
              setTimeout(() => {
                colHL.classList.remove("bg-[var(--pv-primary-50)]");
                colHL.classList.remove("border-[var(--pv-primary-500)]");
                colHL.classList.remove("ring-2");
                colHL.classList.remove("ring-[var(--pv-neutral-grey-300)]");
              }, 4000);
            }
            setSearchQuery("");
            setTableScrollingDone(false);
          }
        }, 10);
        setCanScrollCol({ bool: false, ind: -1 });
      }
    }
  }, [columns, canScrollCol, tableScrollingDone]);

  const handleColToggle = async (e) => {
    e.stopPropagation();
    if (toggleDisabled || user?.role?.toLowerCase() !== "admin") return;

    setToggleDisabled(true);
    const tabPageNumber = Math.ceil(selectedTab?.index / 100) || 1;
    const metadata = {
      integrationId: currIntegSelected?.id,
      tableId: selectedTab?.id,
      keyword: searchQuery,
      currIntegSelected,
      tablesPageNumber: tabPageNumber,
      selectedTab,
      setSelectedTab
    };

    queryClient.setQueryData(["allTables", "", "", "", currIntegSelected?.id, tabPageNumber], (prevData) => {
      const prev = structuredClone(prevData || {});
      const dictionaries = prev?.data || [];
      if (Array.isArray(dictionaries)) {
        const tabInd = dictionaries.findIndex((tab) => tab.id === selectedTab.id);
        if (tabInd > -1) {
          dictionaries[tabInd].disabledForGuidedAnalysis = !dictionaries[tabInd].disabledForGuidedAnalysis;
          setSelectedTab((p) => ({ ...p, disabledForGuidedAnalysis: !p.disabledForGuidedAnalysis }));
        }
      }
      prev.data = dictionaries;
      return prev;
    });

    try {
      await updateGuidedAnalysisStatus.mutateAsync({
        data: { enable: selectedTab.disabledForGuidedAnalysis },
        metadata
      });
    } catch {
      toast.error('Failed to update table status');
    } finally {
      setToggleDisabled(false);
    }
  };

  const SkeletonComp =
    Skeleton ||
    (({ width, height }) => <div className="bg-[var(--pv-neutral-grey-200)] rounded animate-pulse" style={{ width, height }} />);
  const TooltipWrapper = Tooltip || (({ children, title }) => <span title={title}>{children}</span>);
  const MarkdownComp = Markdown || (({ children }) => <span>{children}</span>);

  return (
    <div className="flex flex-col w-full h-full" style={{ zIndex: 0 }}>
      <div
        className="flex items-center px-4 gap-2 w-full bg-white border-b border-[var(--pv-neutral-grey-100)]"
        style={{ height: "64px", zIndex: 1 }}
      >
        <span
          className="text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-neutral-grey-900)] cursor-pointer"
          onClick={() => navigate(basePath.replace(/\/[^/]+$/, "") || "/")}
        >
          Dictionary
        </span>
        <CaretRight className="text-[var(--pv-neutral-grey-500)]" />
        <DictionaryDropdown
          loading={dictionariesListData.isLoading}
          integData={dictionariesListData.data?.data}
          currIntegSelected={currIntegSelected}
          setCurrIntegSelected={setCurrIntegSelected}
        />
      </div>

      <div className="flex w-full overflow-x-auto shrink-0" style={{ height: "calc(100% - 64px)", zIndex: 0 }}>
        <div
          className="relative flex flex-col bg-white h-full"
          style={{
            width: isSidebarOpen ? "20%" : "52px",
            minWidth: isSidebarOpen ? "280px" : "52px",
            transition: "all 0.3s ease",
            zIndex: 1
          }}
        >
          <div className="absolute right-3 top-3 w-7 h-7 hover:bg-[var(--pv-primary-50)] rounded">
            <TooltipWrapper title={isSidebarOpen ? "Hide Tables" : "Show Tables"} placement="right">
              <button className="p-1 rounded" onClick={() => setIsSidebarOpen((p) => !p)}>
                <ArrowLineLeft
                  size={20}
                  className="text-[var(--pv-neutral-grey-600)]"
                  style={{ transform: isSidebarOpen ? "" : "rotate(180deg)", transition: "all 0.3s ease" }}
                />
              </button>
            </TooltipWrapper>
          </div>
          <div
            className="p-4"
            style={{
              opacity: isSidebarOpen ? 1 : 0,
              transition: "opacity 0.3s ease",
              pointerEvents: isSidebarOpen ? "all" : "none"
            }}
          >
            Tables
          </div>
          {currIntegSelected.id ? (
            <SelectedIntegrationTables
              currIntegSelected={currIntegSelected}
              isSidebarOpen={isSidebarOpen}
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              setTablesLoading={setTablesLoading}
              tablesPageNumber={tablesPageNumber}
              setTablesPageNumber={setTablesPageNumber}
              tables={tables}
              setTables={setTables}
              columns={columns}
              handleTableClick={handleTableClick}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              tableRef={tableRef}
              handleColumnClick={handleColumnClick}
              immediateSearchQuery={immediateSearchQuery}
              setImmediateSearchQuery={setImmediateSearchQuery}
              tableColSearchCleaner={tableColSearchCleaner}
              showLabel={true}
              noCols={noCols}
              setNoCols={setNoCols}
              Skeleton={Skeleton}
              Tooltip={Tooltip}
            />
          ) : !dictionariesListData.isLoading && isEqual(currIntegSelected, {}) ? (
            <div className="w-full h-full flex items-center justify-center" style={{ opacity: isSidebarOpen ? 1 : 0 }}>
              <span className="text-[var(--pv-neutral-grey-500)]">No tables found.</span>
            </div>
          ) : (
            <div className="w-full flex flex-col px-3 gap-1" style={{ opacity: isSidebarOpen ? 1 : 0 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-[var(--pv-neutral-grey-100)]">
                  <SkeletonComp width={i % 2 === 1 ? '55%' : '70%'} height={16} />
                  <SkeletonComp width={28} height={20} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          ref={columnRef}
          className="bg-white flex overflow-y-auto rounded-lg space-y-4 m-4"
          style={{
            height: "calc(100% - 32px)",
            width: isSidebarOpen ? "calc(80%)" : "calc(100% - 52px)",
            transition: "all 0.3s ease",
            minWidth: "980px",
            zIndex: 0
          }}
          onWheel={(e) => {
            if (scrollFilterCleaner.current) scrollFilterCleaner.current();
            if (
              !columnsLoading &&
              e.currentTarget.scrollTop >= e.currentTarget.scrollHeight - e.currentTarget.clientHeight - 1000
            ) {
              setColRefetch(true);
            }
          }}
        >
          {noCols ? (
            <div className="flex w-full h-full justify-center items-center text-[var(--pv-neutral-grey-500)] text-xs">
              No columns found.
            </div>
          ) : isEqual(selectedTab, {}) || (tablesLoading && tablesPageNumber === 1) ? (
            <div className="flex flex-col justify-start h-full w-full gap-4">
              {/* Integration name */}
              <div className="flex gap-2 items-center p-4">
                <SkeletonComp width={20} height={20} />
                <SkeletonComp width={120} height={18} />
              </div>
              {/* Description section */}
              <div className="flex flex-col gap-2 px-4 border-b border-[var(--pv-neutral-grey-100)] pb-4">
                <SkeletonComp width={80} height={16} />
                <SkeletonComp width="90%" height={14} />
                <SkeletonComp width="60%" height={14} />
              </div>
              {/* Stats row */}
              <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--pv-neutral-grey-100)]">
                <div className="flex items-center gap-2">
                  <SkeletonComp width={80} height={14} />
                  <SkeletonComp width={24} height={20} />
                </div>
                <div className="bg-[var(--pv-neutral-grey-200)]" style={{ height: "20px", width: "1px" }} />
                <div className="flex items-center gap-2">
                  <SkeletonComp width={100} height={14} />
                  <SkeletonComp width={45} height={20} />
                </div>
                <div className="bg-[var(--pv-neutral-grey-200)]" style={{ height: "20px", width: "1px" }} />
                <div className="flex items-center gap-2">
                  <SkeletonComp width={130} height={14} />
                  <SkeletonComp width={36} height={20} />
                </div>
              </div>
              {/* Table description */}
              <div className="flex flex-col gap-2 px-4 pb-4">
                <SkeletonComp width={80} height={16} />
                <SkeletonComp width="70%" height={14} />
                <SkeletonComp width="40%" height={14} />
              </div>
              {/* Column header */}
              <div className="grid pb-2 px-6" style={{ gridTemplateColumns: '3% 12% 12% 12% 43% 10% 4% 4%' }}>
                <span className="px-2"><SkeletonComp width={10} height={14} /></span>
                <span className="px-2"><SkeletonComp width={70} height={14} /></span>
                <span className="px-2"><SkeletonComp width={80} height={14} /></span>
                <span className="px-2"><SkeletonComp width={55} height={14} /></span>
                <span className="px-2"><SkeletonComp width={70} height={14} /></span>
                <span className="px-2"><SkeletonComp width={70} height={14} /></span>
                <span className="px-2"><SkeletonComp width={35} height={14} /></span>
              </div>
              <div className="h-px bg-[var(--pv-neutral-grey-100)] mx-3" />
              {/* Column rows */}
              <div className="flex flex-col gap-2 px-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid items-center py-3 px-2 border border-[var(--pv-neutral-grey-100)] rounded-lg" style={{ gridTemplateColumns: '3% 12% 12% 12% 43% 10% 4% 4%' }}>
                    <span className="px-2"><SkeletonComp width={16} height={16} /></span>
                    <span className="px-2"><SkeletonComp width={i % 2 === 0 ? '80%' : '60%'} height={16} /></span>
                    <span className="px-2"><SkeletonComp width={i % 2 === 1 ? '90%' : '70%'} height={16} /></span>
                    <span className="px-2"><SkeletonComp width={60} height={16} /></span>
                    <span className="px-2"><SkeletonComp width={i % 2 === 0 ? '60%' : '40%'} height={16} /></span>
                    <span className="px-2"><SkeletonComp width={40} height={24} /></span>
                    <span className="px-2"><SkeletonComp width={36} height={20} /></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start w-full h-fit" style={{ zIndex: 0, minHeight: "100%" }}>
              <div className="flex gap-1.5 items-center p-4" ref={integNameElement}>
                <img src={currIntegSelected?.logo} alt="" style={{ width: "16px", aspectRatio: 1 }} />
                <span>{currIntegSelected?.datasource}</span>
              </div>
              <div className="group/integ flex flex-col gap-1.5 px-4 border-b border-[var(--pv-neutral-grey-100)] w-full pb-4">
                <div className="flex items-center gap-2 w-28 h-7">
                  <span className="text-[var(--pv-neutral-grey-500)] font-medium">Description</span>
                  {user?.role?.toLowerCase() === "admin" && (
                    <button
                      className="p-2 rounded-lg hover:bg-[var(--pv-neutral-grey-100)] cursor-pointer hidden group-hover/integ:block"
                      onClick={() => {
                        setEditDescDetails({
                          desc: currIntegSelected?.description || "",
                          type: "integ",
                          name: selectedTab.integrationName
                        });
                        setEditDescModal(true);
                      }}
                    >
                      <PencilSimple size={12} />
                    </button>
                  )}
                </div>
                <span className="text-[var(--pv-neutral-grey-500)] text-xs" style={{ lineHeight: "19px" }}>
                  <MarkdownComp>
                    {currIntegSelected?.description
                      ? currIntegSelected.description.replace(/\n/g, "  \n")
                      : "No description added."}
                  </MarkdownComp>
                </span>
              </div>
              <div
                className="flex w-full items-center justify-between sticky bg-white gap-3"
                style={{ top: 0, zIndex: 1 }}
              >
                <div className="flex gap-1.5 p-4 overflow-hidden">
                  <TooltipWrapper title={selectedTab.label || selectedTab.name} placement="top">
                    <span className="text-base font-semibold flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {selectedTab.label || selectedTab.name}
                    </span>
                  </TooltipWrapper>
                </div>
                <div className="flex items-center" style={{ height: "56px" }}>
                  <div className="flex w-fit items-center px-4 py-3 gap-2">
                    <span className="text-[var(--pv-neutral-grey-500)] text-xs font-medium">Default Columns</span>
                    <span>{defCols || 0}</span>
                  </div>
                  <div className="bg-[var(--pv-neutral-grey-100)]" style={{ height: "60%", width: "1px" }} />
                  <div className="flex w-fit items-center px-4 py-3 gap-2">
                    <span className="text-[var(--pv-neutral-grey-500)] text-xs font-medium">Columns Enabled</span>
                    <span>
                      {enabledCols || 0}/{selectedTab?.column_count || 0}
                    </span>
                  </div>
                  <div className="bg-[var(--pv-neutral-grey-100)]" style={{ height: "60%", width: "1px" }} />
                  <label className="flex w-fit items-center px-4 py-3 gap-2 cursor-pointer">
                    <span className="text-[var(--pv-neutral-grey-500)] text-xs font-medium">Enable table for analysis</span>
                    <Toggle
                      checked={!selectedTab?.disabledForGuidedAnalysis}
                      disabled={toggleDisabled || user?.role?.toLowerCase() !== "admin"}
                      onClick={handleColToggle}
                      size="lg"
                    />
                  </label>
                </div>
              </div>
              <div className="group/table flex flex-col gap-1.5 px-4">
                <div className="flex items-center gap-2 w-28 h-7">
                  <span className="text-[var(--pv-neutral-grey-500)] font-medium">Description</span>
                  {user?.role?.toLowerCase() === "admin" && (
                    <button
                      className="p-2 rounded-lg hover:bg-[var(--pv-neutral-grey-100)] cursor-pointer hidden group-hover/table:block"
                      onClick={() => {
                        setEditDescDetails({
                          desc: selectedTab?.description || "",
                          type: "table",
                          name: selectedTab.name
                        });
                        setEditDescModal(true);
                      }}
                    >
                      <PencilSimple size={12} />
                    </button>
                  )}
                </div>
                <p className="text-[var(--pv-neutral-grey-500)] text-xs mb-4" style={{ lineHeight: "19px" }}>
                  <MarkdownComp>
                    {selectedTab?.description
                      ? selectedTab.description.replace(/\n/g, "  \n")
                      : "No description added."}
                  </MarkdownComp>
                </p>
              </div>
              <div className="bg-[var(--pv-neutral-grey-100)] w-full sticky" style={{ height: "1px", top: "56px", zIndex: 1 }} />
              <div className="flex w-full h-full flex-1" style={{ flexGrow: 1 }}>
                <SelectedTableColumns
                  selectedTab={selectedTab}
                  setColDataModalOpen={setColDataModalOpen}
                  setColumnDetails={setColumnDetails}
                  colRefetch={colRefetch}
                  setColRefetch={setColRefetch}
                  columns={columns}
                  setColumns={setColumns}
                  currentColPageNumber={currentColPageNumber}
                  setCurrentColPageNumber={setCurrentColPageNumber}
                  currIntegSelected={currIntegSelected}
                  colTooltipShow={colTooltipShow}
                  setColTooltipShow={setColTooltipShow}
                  setSelectedColDetails={setSelectedColDetails}
                  setColEditModalOpen={setColEditModalOpen}
                  setDefCols={setDefCols}
                  setEnabledCols={setEnabledCols}
                  columnsLoading={columnsLoading}
                  setColumnsLoading={setColumnsLoading}
                  scrollFilterCleaner={scrollFilterCleaner}
                  setSelectedBulkDetails={setSelectedBulkDetails}
                  setBulkActModalOpen={setBulkActModalOpen}
                  bulkActionPostCleaner={bulkActionPostCleaner}
                  bulkCols={bulkCols}
                  setBulkCols={setBulkCols}
                  bulkActActive={bulkActActive}
                  setBulkActActive={setBulkActActive}
                  bulkExcludeCols={bulkExcludeCols}
                  setBulkExcludeCols={setBulkExcludeCols}
                  shouldScrollFetch={shouldScrollFetch}
                  setShouldScrollFetch={setShouldScrollFetch}
                  tagList={tagList}
                  applyTags={applyTags}
                  setApplyTags={setApplyTags}
                  clearTags={clearTags}
                  setClearTags={setClearTags}
                  setTagBulkActModalOpen={setTagBulkActModalOpen}
                  tableColSearchCleaner={tableColSearchCleaner}
                  Tooltip={Tooltip}
                  Skeleton={Skeleton}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ColumnSampleDataModal
        isOpen={colDataModalOpen}
        handleClose={() => setColDataModalOpen(false)}
        columnDetails={columnDetails}
      />
      <EditDictColumnDetailModal
        isOpen={colEditModalOpen}
        handleCloseModal={() => setColEditModalOpen(false)}
        selectedColDetails={selectedColDetails}
        setColumns={setColumns}
        showLabel={true}
      />
      <BulkActionModal
        isOpen={bulkActModalOpen}
        handleCloseModal={() => setBulkActModalOpen(false)}
        selectedBulkDetails={selectedBulkDetails}
        selectedTab={selectedTab}
        bulkActionPostCleaner={bulkActionPostCleaner}
      />
      <EditDescModal
        isOpen={editDescModal}
        handleCloseModal={() => setEditDescModal(false)}
        editDescDetails={editDescDetails}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        currIntegSelected={currIntegSelected}
        setCurrIntegSelected={setCurrIntegSelected}
        setTables={setTables}
      />
      <TagBulkActionModal
        isOpen={tagBulkActModalOpen.open}
        handleCloseModal={() => setTagBulkActModalOpen({ open: false, type: "", text: "" })}
        type={tagBulkActModalOpen.type}
        text={tagBulkActModalOpen.text}
        applyTags={applyTags}
        setApplyTags={setApplyTags}
        clearTags={clearTags}
        setClearTags={setClearTags}
        selectedBulkDetails={selectedBulkDetails}
        selectedTab={selectedTab}
        tagList={tagList}
        bulkActionPostCleaner={bulkActionPostCleaner}
      />
    </div>
  );
};
