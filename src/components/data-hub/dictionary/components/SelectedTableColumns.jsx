import { useCallback, useEffect, useRef, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { debounce, isEqual, uniqBy } from "lodash";
import { useGetTableColumnsList, useGetTagsList } from "../api";
import { useQueryClient, useUser } from "../context";
import ColumnsFilter from "./ColumnsFilter";
import { ColumnElement } from "./ColumnElement";
import Checkbox from "@/common-components/Checkbox";
import Input from "@/common-components/Input";

export const SelectedTableColumns = ({
  selectedTab,
  setColDataModalOpen,
  setColumnDetails,
  colRefetch,
  setColRefetch,
  columns,
  setColumns,
  currentColPageNumber,
  setCurrentColPageNumber,
  currIntegSelected,
  colTooltipShow,
  setColTooltipShow,
  setSelectedColDetails,
  setColEditModalOpen,
  setDefCols,
  setEnabledCols,
  columnsLoading,
  setColumnsLoading,
  scrollFilterCleaner,
  setSelectedBulkDetails,
  setBulkActModalOpen,
  bulkActionPostCleaner,
  bulkCols,
  setBulkCols,
  bulkActActive,
  setBulkActActive,
  bulkExcludeCols,
  setBulkExcludeCols,
  shouldScrollFetch,
  setShouldScrollFetch,
  tagList,
  applyTags,
  setApplyTags,
  clearTags,
  setClearTags,
  setTagBulkActModalOpen,
  tableColSearchCleaner,
  Tooltip,
  Skeleton
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [immediateSearchQuery, setImmediateSearchQuery] = useState("");
  const [currentTotalColCount, setCurrentTotalColCount] = useState(0);
  const [selectedColIndex, setSelectedColIndex] = useState(0);
  const [filters, setFilters] = useState({
    format: [],
    tags: [],
    dataType: [],
    dataFill: { opType: "less or equal to", opSign: "<=", value: 100 },
    status: "All"
  });
  const [selectAll, setSelectAll] = useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [hashHover, setHashHover] = useState(false);
  const [colCount, setColCount] = useState(0);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [bulkPostFetch, setBulkPostFetch] = useState(false);
  const filterCloserRef = useRef();
  const pageRef = useRef(0);
  const user = useUser();
  const queryClient = useQueryClient();

  tableColSearchCleaner.current = () => {
    setImmediateSearchQuery("");
    setSearchQuery("");
  };

  bulkActionPostCleaner.current = () => {
    if (!bulkPostFetch) setBulkPostFetch(true);
    queryClient.resetQueries("searchedTablesWithTableName");
    queryClient.resetQueries("searchedColumnsWithColumnName");
    setSelectAll(false);
    setBulkCols([]);
    setBulkExcludeCols([]);
    setBulkActActive(false);
    setApplyTags([]);
    setClearTags([]);
  };

  useEffect(() => {
    const defaultFilters = {
      format: [],
      tags: [],
      dataType: [],
      dataFill: { opType: "less or equal to", opSign: "<=", value: 100 },
      status: "All"
    };
    if (!isEqual(filters, defaultFilters)) {
      setFilters(defaultFilters);
    }
  }, [currIntegSelected?.id, selectedTab?.id]);

  useEffect(() => {
    setImmediateSearchQuery("");
    setSearchQuery("");
  }, [currIntegSelected?.id, selectedTab?.id]);

  const searchDebounce = useCallback(
    debounce((value) => setSearchQuery(value), 300),
    []
  );

  useEffect(() => {
    setColumnsLoading(true);
    setCurrentColPageNumber(1);
    if (shouldScrollFetch) setShouldScrollFetch(false);
    pageRef.current = 0;
    setColumns([]);
    setColRefetch(false);
    setShouldRefetch(true);
    setApplyTags([]);
    setClearTags([]);
    if (bulkPostFetch) setBulkPostFetch(false);
  }, [selectedTab?.id, currIntegSelected?.id, searchQuery, filters, bulkPostFetch]);

  useEffect(() => {
    setSelectAll(false);
    setBulkActActive(false);
    setBulkCols([]);
    setSelectedColIndex(0);
  }, [currIntegSelected?.id, selectedTab?.id, filters]);

  useEffect(() => {
    if (!columnsLoading && colRefetch) {
      setShouldRefetch(true);
      pageRef.current = currentColPageNumber;
      setCurrentColPageNumber((prev) => prev + 1);
    }
  }, [colRefetch]);

  useEffect(() => {
    if (selectAll) {
      setBulkCols(structuredClone(columns));
      setBulkExcludeCols([]);
    } else {
      setBulkCols([]);
      setBulkExcludeCols([]);
    }
  }, [selectAll, columns]);

  let filterConfig = {
    dataFillOperator: filters.dataFill.opSign,
    dataFillValue: filters.dataFill.value
  };
  if (filters.status !== "All") {
    filterConfig.status = filters.status === "Status on";
  }
  if (filters.format.length > 0) {
    filterConfig.formats = filters.format.join(",");
  }
  if (filters.dataType.length > 0) {
    filterConfig.dataTypes = filters.dataType.join(",");
  }
  if (filters.tags.length > 0) {
    filterConfig.tags = filters.tags.join(",");
  }

  const columnListData = useGetTableColumnsList({
    tableId: selectedTab.id,
    keyword: searchQuery,
    pageNumber: currentColPageNumber,
    filterConfig,
    searchKeywordInDescription: true,
    config: { staleTime: Infinity, enabled: shouldRefetch }
  });

  useEffect(() => {
    if (shouldRefetch) setShouldRefetch(false);
  }, [currentColPageNumber]);

  useEffect(() => {
    setColumnsLoading(columnListData.isLoading);
    if (!columnListData.isLoading && Array.isArray(columnListData.data?.data)) {
      if (currentColPageNumber === 1) {
        if (columnListData.data.data.length > 0 && pageRef.current === 0) {
          setColumns(columnListData.data.data);
          setCurrentTotalColCount(columnListData.data?.totalPages);
          pageRef.current = 1;
        }
        setShouldScrollFetch(true);
      } else if (columnListData.data.data.length > 0 && currentColPageNumber === pageRef.current + 1) {
        setColumns((prev) => uniqBy([...structuredClone(prev || []), ...columnListData.data.data], "name"));
        pageRef.current = currentColPageNumber;
        setColRefetch(false);
      }
      if (currentColPageNumber === 1) {
        setColCount(columnListData.data?.total || 0);
        if (typeof columnListData.data?.meta?.totalDefaultColumns === "number") {
          setDefCols(columnListData.data.meta.totalDefaultColumns);
        }
        if (typeof columnListData.data?.meta?.totalEnabledColumns === "number") {
          setEnabledCols(columnListData.data.meta.totalEnabledColumns);
        }
      }
    }
  }, [columnListData.isLoading, columnListData.data]);

  let tags = {};
  if (!tagList?.isLoading && Array.isArray(tagList?.data?.data)) {
    tagList.data.data.forEach((tag) => {
      if (tag?.name === "Drill-Down") tags["Drill-down"] = tag;
      if (tag?.name === "Default") tags["Default"] = tag;
    });
  }

  const SkeletonComp =
    Skeleton ||
    (({ width, height }) => (
      <div className="bg-[var(--pv-neutral-grey-200)] rounded animate-pulse" style={{ width, height }} />
    ));

  const defaultFilters = {
    format: [],
    tags: [],
    dataType: [],
    dataFill: { opType: "less or equal to", opSign: "<=", value: 100 },
    status: "All"
  };

  return (
    <div className="flex flex-col w-full h-full" style={{ zIndex: 0 }}>
      <div className="flex justify-between items-center sticky bg-white py-4" style={{ top: "57px", zIndex: 1 }}>
        <div className="flex gap-3 items-center pl-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{bulkActActive ? "Selected" : "Columns"}</span>
            <span className="bg-[var(--pv-primary-500)] text-white flex px-1.5 py-0.5 text-center text-xs rounded-md">
              {bulkActActive ? (selectAll ? colCount - bulkExcludeCols.length : bulkCols.length) : colCount}
            </span>
          </div>
          <button
            className="px-2 py-0.5 text-xs border border-[var(--pv-neutral-grey-200)] rounded hover:bg-[var(--pv-neutral-grey-50)] disabled:opacity-50"
            disabled={columns.length === 0 || user?.role?.toLowerCase() !== "admin"}
            onClick={() => {
              if (user?.role?.toLowerCase() === "admin") {
                setBulkActActive((prev) => !prev);
                setBulkCols([]);
                setSelectAll(false);
              }
            }}
          >
            {bulkActActive ? "Clear Selection" : "Select"}
          </button>
        </div>
        <div className="flex gap-3 items-center pr-4">
          {bulkActActive && (
            <div className="flex items-center gap-3 pr-3 border-r border-[var(--pv-neutral-grey-100)]">
              <div className="relative">
                <button
                  className="px-3 py-1 text-sm border border-[var(--pv-neutral-grey-200)] rounded hover:bg-[var(--pv-neutral-grey-50)] flex items-center gap-1 disabled:opacity-50"
                  disabled={bulkCols.length === 0}
                  onClick={(e) => setStatusAnchorEl(statusAnchorEl ? null : e.currentTarget)}
                >
                  Status <CaretDown size={12} className={statusAnchorEl ? "rotate-180" : ""} />
                </button>
                {statusAnchorEl && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusAnchorEl(null)} />
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-[var(--pv-neutral-grey-200)] rounded-lg shadow-lg z-20 overflow-hidden"
                      style={{ width: "120px" }}
                    >
                      {["Enable", "Disable"].map((status) => (
                        <label
                          key={status}
                          className="px-4 py-3 flex gap-2 items-center hover:bg-[var(--pv-primary-50)] cursor-pointer"
                        >
                          <input
                            type="radio"
                            checked={false}
                            onChange={() => {
                              setBulkActModalOpen(true);
                              setSelectedBulkDetails({
                                type: "status",
                                operation: status === "Enable" ? "enable all" : "disable all",
                                booleanVal: status === "Enable",
                                selectAll,
                                bulkCols,
                                bulkExcludeCols,
                                filterConfig,
                                searchQuery
                              });
                              setStatusAnchorEl(null);
                            }}
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <Input
            leftElem={<MagnifyingGlass size={16} className="text-[var(--pv-neutral-grey-300)]" />}
            showClearInput
            value={immediateSearchQuery}
            onChange={(e) => {
              searchDebounce(e.target.value);
              setImmediateSearchQuery(e.target.value);
            }}
            placeholder="Search Columns"
            className={{
              wrapper: "w-[260px]",
              input: {
                wrapper: "py-2 px-3",
                root: "text-xs"
              }
            }}
          />
          <ColumnsFilter
            isLoading={columnListData.isLoading}
            filters={filters}
            setFilters={setFilters}
            scrollFilterCleaner={scrollFilterCleaner}
            selectedTab={selectedTab}
            filterCloserRef={filterCloserRef}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col w-full h-full bg-white">
        {columnListData.isLoading && currentColPageNumber === 1 ? (
          <div className="flex flex-col w-full">
            {/* Header skeleton */}
            <div className="grid pb-2 px-6" style={{ gridTemplateColumns: "3% 12% 12% 12% 43% 10% 4% 4%" }}>
              <span className="px-2">
                <SkeletonComp width={10} height={14} />
              </span>
              <span className="px-2">
                <SkeletonComp width={70} height={14} />
              </span>
              <span className="px-2">
                <SkeletonComp width={80} height={14} />
              </span>
              <span className="px-2">
                <SkeletonComp width={55} height={14} />
              </span>
              <span className="px-2">
                <SkeletonComp width={70} height={14} />
              </span>
              <span className="px-2">
                <SkeletonComp width={70} height={14} />
              </span>
              <span className="px-2">
                <SkeletonComp width={35} height={14} />
              </span>
            </div>
            <div className="h-px bg-[var(--pv-neutral-grey-100)] mx-3 mb-2" />
            {/* Row skeletons */}
            <div className="flex flex-col gap-2 px-4">
              {[...Array(6)].map((_, ind) => (
                <div
                  key={ind}
                  className="grid items-center w-full py-3 px-2 border border-[var(--pv-neutral-grey-100)] rounded-lg"
                  style={{ gridTemplateColumns: "3% 12% 12% 12% 43% 10% 4% 4%" }}
                >
                  <span className="px-2">
                    <SkeletonComp width={16} height={16} />
                  </span>
                  <span className="px-2">
                    <SkeletonComp width={ind % 2 === 0 ? "80%" : "60%"} height={16} />
                  </span>
                  <span className="px-2">
                    <SkeletonComp width={ind % 2 === 1 ? "90%" : "70%"} height={16} />
                  </span>
                  <span className="px-2">
                    <SkeletonComp width={60} height={16} />
                  </span>
                  <span className="px-2">
                    <SkeletonComp width={ind % 2 === 0 ? "70%" : "50%"} height={16} />
                  </span>
                  <span className="px-2">
                    <SkeletonComp width={40} height={24} />
                  </span>
                  <span className="px-2">
                    <SkeletonComp width={36} height={20} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : columns.length > 0 ? (
          <div className="flex flex-col" style={{ zIndex: 0 }}>
            <div
              className="grid pb-2 px-6 sticky bg-white"
              style={{ gridTemplateColumns: "3% 12% 12% 12% 43% 10% 4% 4%", top: "121px", zIndex: 1 }}
            >
              <span
                className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2"
                onMouseEnter={() => setHashHover(true)}
                onMouseLeave={() => setHashHover(false)}
              >
                {user?.role?.toLowerCase() === "admin" && (hashHover || bulkActActive) ? (
                  <Checkbox
                    checked={selectAll || bulkCols.length > 0}
                    intermediate={bulkCols.length > 0 && bulkCols.length < columns.length}
                    onChange={(e) => {
                      if (e.checked && !bulkActActive) setBulkActActive(true);
                      setSelectAll(e.checked);
                    }}
                  />
                ) : (
                  "#"
                )}
              </span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Display Label</span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Column Name</span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Data Type</span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Description</span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Sample Data</span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Status</span>
            </div>
            <div className="h-px bg-[var(--pv-neutral-grey-100)] mx-3 sticky" style={{ top: "145px" }} />
            <div className="col-list flex flex-col gap-2 px-4 pt-2 pb-4" style={{ zIndex: 0 }}>
              {columns.map((col, ind) => (
                <ColumnElement
                  key={`${col.name}-${ind}`}
                  col={col}
                  ind={ind}
                  selected={selectedColIndex}
                  setSelected={setSelectedColIndex}
                  setColDataModalOpen={setColDataModalOpen}
                  setColumnDetails={setColumnDetails}
                  selectedTab={selectedTab}
                  currentColPageNumber={currentColPageNumber}
                  currIntegSelected={currIntegSelected}
                  searchQuery={searchQuery}
                  setColumns={setColumns}
                  setSelectedColDetails={setSelectedColDetails}
                  setColEditModalOpen={setColEditModalOpen}
                  bulkActActive={bulkActActive}
                  bulkCols={bulkCols}
                  selectAll={selectAll}
                  setBulkCols={setBulkCols}
                  setBulkExcludeCols={setBulkExcludeCols}
                  setBulkActActive={setBulkActActive}
                  filterConfig={filterConfig}
                  setEnabledCols={setEnabledCols}
                  bulkActionPostCleaner={bulkActionPostCleaner}
                  shouldScrollFetch={shouldScrollFetch}
                  setShouldScrollFetch={setShouldScrollFetch}
                  filterCloserRef={filterCloserRef}
                  Tooltip={Tooltip}
                />
              ))}
            </div>
          </div>
        ) : searchQuery !== "" ? (
          <div className="flex flex-col w-full h-full flex-1 justify-center items-center gap-2 py-6">
            <span className="text-[var(--pv-neutral-grey-500)]">
              No results for <strong>"{searchQuery}"</strong>. Try refining your search.
            </span>
            <button
              className="px-4 py-2 text-sm border border-[var(--pv-neutral-grey-200)] rounded hover:bg-[var(--pv-neutral-grey-50)]"
              onClick={() => {
                setSearchQuery("");
                setImmediateSearchQuery("");
              }}
            >
              Clear Search
            </button>
          </div>
        ) : !isEqual(filters, defaultFilters) ? (
          <div className="flex flex-col w-full h-full flex-1 justify-center items-center gap-2 py-6">
            <span className="text-[var(--pv-neutral-grey-500)]">No data found for the selected filter.</span>
            <button
              className="px-4 py-2 text-sm border border-[var(--pv-neutral-grey-200)] rounded hover:bg-[var(--pv-neutral-grey-50)]"
              onClick={() => setFilters(defaultFilters)}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col w-full h-full flex-1 justify-center items-center gap-2 py-6">
            <span className="text-[var(--pv-neutral-grey-500)]">No results found.</span>
          </div>
        )}
      </div>
    </div>
  );
};
