import { useState, useEffect, useRef } from "react";
import { useGetSearchedTables, useGetSearchedColumns } from "../api";

export const SearchResults = ({
  tableId,
  searchQuery,
  handleTableClick,
  handleColumnClick,
  activeTab,
  setActiveTab,
  setSearchQuery,
  setImmediateSearchQuery,
  immediateSearchQuery,
  filter,
  from = "",
  currIntegSelected,
  tabString,
  showLabel = true,
  Skeleton,
  Tooltip,
  Button
}) => {
  const [tooltipShow, setTooltipShow] = useState(false);
  const [tableRefetch, setTableRefetch] = useState(false);
  const [colRefetch, setColRefetch] = useState(false);

  const wrapperRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const columnWrapperRef = useRef(null);

  const [tablePageNumber, setTablePageNumber] = useState(1);
  const [columnPageNumber, setColumnPageNumber] = useState(1);
  const [tablePageCount, setTablePageCount] = useState(0);
  const [columnPageCount, setColumnPageCount] = useState(0);

  let tableConfig = {
    tableNameKeyword: searchQuery,
    config: {
      staleTime: Infinity,
      enabled: searchQuery.length > 0
    }
  };

  let columnConfig = {
    keyword: searchQuery,
    sortTableOnTop: tableId?.name,
    config: {
      staleTime: Infinity,
      enabled: searchQuery.length > 0
    }
  };

  if (filter) {
    if (filter === "Enabled for analysis") {
      tableConfig.status = true;
      columnConfig.status = true;
    } else if (filter === "Disabled for analysis") {
      tableConfig.status = false;
      columnConfig.status = false;
    }
  }

  if (from === "dict" && currIntegSelected?.id) {
    tableConfig.integrationId = currIntegSelected.id;
    columnConfig.integrationId = currIntegSelected.id;
  }

  if (from === "metric" && tabString) {
    tableConfig.tableIds = tabString;
    columnConfig.tableIds = tabString;
  }

  const tablesListData = useGetSearchedTables(tableConfig);
  const columnListData = useGetSearchedColumns(columnConfig);

  // Reset pagination when search query changes
  useEffect(() => {
    setTablePageNumber(1);
    setColumnPageNumber(1);
    setTableRefetch(false);
    setColRefetch(false);
  }, [immediateSearchQuery]);

  // Auto-scroll to first result when tables data loads
  useEffect(() => {
    if (
      tableWrapperRef.current &&
      Array.isArray(tablesListData.data?.pages) &&
      tablesListData.data?.pages.length === 1
    ) {
      const tabElems = Array.from(tableWrapperRef.current.children);
      const tabElem = tabElems?.[0];
      tabElem?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [tablesListData.data]);

  // Auto-scroll to first result when columns data loads
  useEffect(() => {
    if (
      columnWrapperRef.current &&
      Array.isArray(columnListData.data?.pages) &&
      columnListData.data?.pages.length === 1
    ) {
      const colElems = Array.from(columnWrapperRef.current.children);
      const colElem = colElems?.[0];
      colElem?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [columnListData.data]);

  // Auto-scroll to top when switching tabs
  useEffect(() => {
    if (tableWrapperRef.current) {
      const tabElems = Array.from(tableWrapperRef.current.children);
      const tabElem = tabElems?.[0];
      tabElem?.scrollIntoView({ behavior: "instant", block: "start" });
    }
    if (columnWrapperRef.current) {
      const colElems = Array.from(columnWrapperRef.current.children);
      const colElem = colElems?.[0];
      colElem?.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [activeTab]);

  // Fetch next page for columns when triggered
  useEffect(() => {
    if (colRefetch && columnListData.hasNextPage) {
      columnListData.fetchNextPage();
      setColumnPageNumber((prev) => prev + 1);
    }
  }, [colRefetch, columnListData.hasNextPage]);

  // Fetch next page for tables when triggered
  useEffect(() => {
    if (tableRefetch && tablesListData.hasNextPage) {
      tablesListData.fetchNextPage();
      setTablePageNumber((prev) => prev + 1);
    }
  }, [tableRefetch, tablesListData.hasNextPage]);

  // Reset table refetch flag after fetch completes
  useEffect(() => {
    if (!tablesListData.isFetching && Array.isArray(tablesListData.data?.pages)) {
      const len = tablesListData.data.pages.length;
      if (
        Array.isArray(tablesListData.data.pages?.[len - 1]?.data) &&
        tablesListData.data.pages[len - 1].data.length > 0
      ) {
        setTableRefetch(false);
      }
    }
  }, [tablesListData.isFetching, tablesListData.data?.pages]);

  // Reset column refetch flag after fetch completes
  useEffect(() => {
    if (!columnListData.isFetching && Array.isArray(columnListData.data?.pages)) {
      const len = columnListData.data.pages.length;
      if (
        Array.isArray(columnListData.data.pages?.[len - 1]?.data) &&
        columnListData.data.pages[len - 1].data.length > 0
      ) {
        setColRefetch(false);
      }
    }
  }, [columnListData.isFetching, columnListData.data?.pages]);

  // Track total pages for tables
  useEffect(() => {
    if (
      Array.isArray(tablesListData.data?.pages?.[0]?.data) &&
      tablesListData.data.pages[0].data.length > 0 &&
      tablesListData.data.pages[0]?.totalPages
    ) {
      setTablePageCount(tablesListData.data.pages[0].totalPages);
    }
  }, [tablesListData.data]);

  // Track total pages for columns
  useEffect(() => {
    if (
      Array.isArray(columnListData.data?.pages?.[0]?.data) &&
      columnListData.data.pages[0].data.length > 0 &&
      columnListData.data.pages[0]?.totalPages
    ) {
      setColumnPageCount(columnListData.data.pages[0].totalPages);
    }
  }, [columnListData.data]);

  // Flatten paginated data
  const tabList =
    tablesListData.data?.pages
      ?.map((page) => (Array.isArray(page?.data) ? [...page.data] : []))
      .flat()
      .filter(Boolean) || [];

  const colList =
    columnListData.data?.pages
      ?.map((page) => (Array.isArray(page?.data) ? [...page.data] : []))
      .flat()
      .filter(Boolean) || [];

  // Get total counts
  const tableTotal = tablesListData.data?.pages?.[0]?.total || 0;
  const columnTotal = columnListData.data?.pages?.[0]?.total || 0;

  // Highlight search text component
  const HighlightSearchText = ({ text }) => {
    if (!text) return <span>-</span>;
    const textStr = String(text);
    const lowerText = textStr.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();

    if (!lowerText.includes(lowerQuery)) {
      return <span className="pointer-events-none">{textStr}</span>;
    }

    const startIndex = lowerText.indexOf(lowerQuery);
    const endIndex = startIndex + searchQuery.length;

    return (
      <span className="pointer-events-none">
        <span>{textStr.slice(0, startIndex)}</span>
        <span className="font-medium">{textStr.slice(startIndex, endIndex)}</span>
        <span>{textStr.slice(endIndex)}</span>
      </span>
    );
  };

  // Fallback components
  const SkeletonComp =
    Skeleton ||
    (({ width, height }) => <div className="bg-[var(--pv-neutral-grey-200)] rounded animate-pulse" style={{ width, height }} />);

  const TooltipWrapper = Tooltip || (({ children, title }) => <span title={typeof title === "string" ? title : ""}>{children}</span>);

  const ButtonComp =
    Button ||
    (({ onClick, children, className }) => (
      <button
        onClick={onClick}
        className={`px-2 py-0.5 text-xs border border-[var(--pv-neutral-grey-200)] rounded hover:bg-[var(--pv-neutral-grey-50)] ${className || ""}`}
      >
        {children}
      </button>
    ));

  const handleTableScroll = (e) => {
    setTooltipShow(false);
    if (e.target.scrollHeight - e.target.scrollTop < 1000) {
      setTableRefetch(true);
    }
  };

  const handleColumnScroll = (e) => {
    setTooltipShow(false);
    if (e.target.scrollHeight - e.target.scrollTop < 1000) {
      setColRefetch(true);
    }
  };

  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between py-2 px-2 rounded" style={{ height: "28px" }}>
          <div className="flex items-center gap-2">
            <SkeletonComp width={index % 2 === 0 ? 100 : 70} height={14} />
            {index % 3 === 0 && <SkeletonComp width={60} height={18} />}
          </div>
          <div className="flex items-center gap-1">
            {index % 2 === 0 && <SkeletonComp width={14} height={14} />}
            <SkeletonComp width={index % 2 === 0 ? 80 : 60} height={14} />
          </div>
        </div>
      ))}
    </div>
  );

  const PaginationSkeleton = () => (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between py-2 px-2 rounded" style={{ height: "28px" }}>
          <div className="flex items-center gap-2">
            <SkeletonComp width={index % 2 === 0 ? 90 : 65} height={14} />
          </div>
          <SkeletonComp width={index % 2 === 0 ? 70 : 55} height={14} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col w-full p-2 gap-2" ref={wrapperRef}>
      {/* Tabs */}
      <div className="h-fit border-b border-[var(--pv-neutral-grey-100)]">
        <div className="flex gap-2 px-2">
          <button
            className={`flex items-center gap-2.5 px-3 py-2 text-xs border-b-2 transition-colors ${
              activeTab === 0 ? "border-[var(--pv-primary-500)] text-[var(--pv-primary-500)]" : "border-transparent text-[var(--pv-neutral-grey-600)] hover:text-[var(--pv-primary-500)]"
            }`}
            onClick={() => setActiveTab(0)}
          >
            <span>Tables</span>
            <span
              className={`text-xs font-normal py-0.5 px-1.5 rounded-md ${
                activeTab === 0 ? "bg-[var(--pv-primary-500)] text-white" : "bg-[var(--pv-neutral-grey-100)] text-[var(--pv-neutral-grey-400)]"
              }`}
            >
              {tableTotal}
            </span>
          </button>
          <button
            className={`flex items-center gap-2.5 px-3 py-2 text-xs border-b-2 transition-colors ${
              activeTab === 1 ? "border-[var(--pv-primary-500)] text-[var(--pv-primary-500)]" : "border-transparent text-[var(--pv-neutral-grey-600)] hover:text-[var(--pv-primary-500)]"
            }`}
            onClick={() => setActiveTab(1)}
          >
            <span>Columns</span>
            <span
              className={`text-xs font-normal py-0.5 px-1.5 rounded-md ${
                activeTab === 1 ? "bg-[var(--pv-primary-500)] text-white" : "bg-[var(--pv-neutral-grey-100)] text-[var(--pv-neutral-grey-400)]"
              }`}
            >
              {columnTotal}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 0 ? (
          <div className="flex flex-col gap-2">
            {tablesListData.isLoading && tablePageNumber === 1 ? (
              <LoadingSkeleton />
            ) : tabList.length > 0 ? (
              <div
                className="flex flex-col overflow-y-auto"
                style={{ maxHeight: "224px" }}
                onScroll={handleTableScroll}
                ref={tableWrapperRef}
              >
                {tabList.map((tab, ind) => (
                  <div
                    key={`${tab.id || tab.name}-${ind}`}
                    className="flex items-center justify-between text-xs py-1 px-2 hover:bg-[var(--pv-primary-50)] cursor-pointer rounded"
                    style={{ height: "28px" }}
                    onClick={() => handleTableClick(tab)}
                  >
                    <div className="flex items-center overflow-hidden">
                      <TooltipWrapper placement="top" title={showLabel ? tab?.label || tab?.name : tab?.name}>
                        <span
                          onMouseEnter={() => setTooltipShow(true)}
                          className="overflow-hidden whitespace-nowrap text-ellipsis"
                          style={{ maxWidth: "200px" }}
                        >
                          <HighlightSearchText text={showLabel ? tab?.label || tab?.name : tab?.name} />
                        </span>
                      </TooltipWrapper>
                    </div>
                    <div className="flex items-center gap-1">
                      {tab.integration_logo && (
                        <img src={tab.integration_logo} alt="" style={{ width: "16px", aspectRatio: 1 }} />
                      )}
                      <div className="flex items-center text-[var(--pv-neutral-grey-500)]">
                        <TooltipWrapper placement="top" title={tab.datasource_description}>
                          <span
                            onMouseEnter={() => setTooltipShow(true)}
                            className="overflow-hidden whitespace-nowrap text-ellipsis"
                            style={{ maxWidth: "150px" }}
                          >
                            {tab.datasource_description}
                          </span>
                        </TooltipWrapper>
                      </div>
                    </div>
                  </div>
                ))}
                {tablePageNumber <= tablePageCount && tabList.length < tableTotal && <PaginationSkeleton />}
              </div>
            ) : (
              <div className="flex items-center justify-between px-2">
                <span className="text-xs py-1 text-[var(--pv-neutral-grey-500)]" style={{ height: "28px" }}>
                  No results found. Try refining your search.
                </span>
                <ButtonComp
                  onClick={() => {
                    setSearchQuery("");
                    setImmediateSearchQuery("");
                  }}
                >
                  Clear Search
                </ButtonComp>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {columnListData.isLoading && columnPageNumber === 1 ? (
              <LoadingSkeleton />
            ) : colList.length > 0 ? (
              <div
                className="flex flex-col overflow-y-auto"
                style={{ maxHeight: "224px" }}
                onScroll={handleColumnScroll}
                ref={columnWrapperRef}
              >
                {colList.map((col, ind) => (
                  <div
                    key={`${col.name}-${col.tableId}-${ind}`}
                    className="flex items-center justify-between gap-8 text-xs py-1 px-2 hover:bg-[var(--pv-primary-50)] cursor-pointer rounded"
                    style={{ height: "28px" }}
                    onClick={() => handleColumnClick(col)}
                  >
                    <div className="flex-1 min-w-0 flex gap-2 items-center overflow-hidden">
                      <div className="flex overflow-hidden">
                        <TooltipWrapper placement="top" title={col.label}>
                          <span
                            onMouseEnter={() => setTooltipShow(true)}
                            className="whitespace-nowrap text-ellipsis overflow-hidden"
                          >
                            <HighlightSearchText text={col.label} />
                          </span>
                        </TooltipWrapper>
                      </div>
                      <div className="flex overflow-hidden items-center bg-[var(--pv-primary-100)] px-1.5 py-0.5 text-xs rounded-lg">
                        <TooltipWrapper placement="top" title={col.name}>
                          <span
                            onMouseEnter={() => setTooltipShow(true)}
                            className="whitespace-nowrap text-ellipsis overflow-hidden"
                          >
                            <HighlightSearchText text={col.name} />
                          </span>
                        </TooltipWrapper>
                      </div>
                    </div>
                    <div className="flex items-center text-[var(--pv-neutral-grey-500)]">
                      <TooltipWrapper
                        placement="top"
                        title={showLabel ? col?.tableLabel || col.tableName : col.tableName}
                      >
                        <span
                          onMouseEnter={() => setTooltipShow(true)}
                          className="whitespace-nowrap text-ellipsis overflow-hidden"
                          style={{ maxWidth: "148px" }}
                        >
                          {showLabel ? col?.tableLabel || col.tableName : col.tableName}
                        </span>
                      </TooltipWrapper>
                    </div>
                  </div>
                ))}
                {columnPageNumber <= columnPageCount && colList.length < columnTotal && <PaginationSkeleton />}
              </div>
            ) : (
              <div className="flex items-center justify-between px-2">
                <span className="text-xs py-1 text-[var(--pv-neutral-grey-500)]" style={{ height: "28px" }}>
                  No results found. Try refining your search.
                </span>
                <ButtonComp
                  onClick={() => {
                    setSearchQuery("");
                    setImmediateSearchQuery("");
                  }}
                >
                  Clear Search
                </ButtonComp>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
