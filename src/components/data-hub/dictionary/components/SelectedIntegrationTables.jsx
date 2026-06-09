import { useCallback, useEffect, useState, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { debounce } from 'lodash';
import { useGetTablesList } from '../api';
import TablesFilter from './TablesFilter';
import { SearchResults } from './SearchResults';
import Input from '@/common-components/Input';

export const SelectedIntegrationTables = ({
  currIntegSelected,
  isSidebarOpen,
  selectedTab,
  setSelectedTab,
  setTablesLoading,
  tablesPageNumber,
  setTablesPageNumber,
  tables,
  setTables,
  columns,
  handleTableClick,
  searchQuery,
  setSearchQuery,
  tableRef,
  handleColumnClick,
  immediateSearchQuery,
  setImmediateSearchQuery,
  tableColSearchCleaner,
  showLabel = true,
  noCols,
  setNoCols,
  Skeleton,
  Tooltip,
}) => {
  const [filter, setFilter] = useState('All');
  const [tooltipShow, setTooltipShow] = useState(true);
  const [firstFetch, setFirstFetch] = useState(true);
  const [tabRefetch, setTabRefetch] = useState(false);
  const [totalTablePageCount, setTotalTablePageCount] = useState(0);
  const [searchTabIndex, setSearchTabIndex] = useState(0);
  const clickAwayRef = useRef(null);

  const searchDebounce = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  useEffect(() => {
    setTables([]);
    setTablesPageNumber(1);
  }, [currIntegSelected?.id]);

  useEffect(() => {
    setImmediateSearchQuery('');
    setSearchQuery('');
    setSearchTabIndex(0);
  }, [currIntegSelected?.id]);

  useEffect(() => {
    setFilter('All');
  }, [currIntegSelected?.id]);

  const tablesListData = useGetTablesList({
    integrationId: currIntegSelected.id,
    pageNumber: tablesPageNumber,
    config: { staleTime: Infinity },
  });

  let filteredList =
    tables?.filter((tab) =>
      filter === 'All'
        ? true
        : filter === 'Enabled for analysis'
          ? !tab?.disabledForGuidedAnalysis
          : tab?.disabledForGuidedAnalysis
    ) || [];

  useEffect(() => {
    if (tabRefetch && tablesPageNumber < totalTablePageCount) {
      setTablesPageNumber((prev) => prev + 1);
    }
  }, [tabRefetch]);

  useEffect(() => {
    if (!tablesListData.isLoading && Array.isArray(tablesListData.data?.data)) {
      if (tablesListData.data.data.length > 0) {
        if (tablesPageNumber === 1) {
          setTables(tablesListData.data.data);
          setTotalTablePageCount(tablesListData.data?.totalPages);
        } else {
          setTables((prev) => [...prev, ...tablesListData.data.data]);
          setTabRefetch(false);
        }
      } else if (tablesListData.data?.total === 0) {
        setNoCols(true);
      }
    }
    return () => setNoCols(false);
  }, [tablesListData.isLoading, tablesListData.data]);

  useEffect(() => {
    setTablesLoading(tablesListData.isLoading);
  }, [tablesListData.isLoading]);

  useEffect(() => {
    if (!firstFetch) setFirstFetch(true);
  }, [currIntegSelected?.id]);

  useEffect(() => {
    if (firstFetch && filteredList.length > 0) {
      setSelectedTab({ ...filteredList[0], index: 0 });
      setFirstFetch(false);
    }
  }, [filteredList.length, firstFetch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clickAwayRef.current && !clickAwayRef.current.contains(e.target)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const TooltipWrapper = Tooltip || (({ children, title }) => <span title={title}>{children}</span>);
  const SkeletonComp = Skeleton || (({ width, height }) => (
    <div className="bg-[var(--pv-neutral-grey-200)] rounded animate-pulse" style={{ width, height }} />
  ));

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        opacity: isSidebarOpen ? '1' : '0',
        transition: 'opacity 0.3s ease',
        pointerEvents: isSidebarOpen ? 'all' : 'none',
        height: 'calc(100% - 53px)',
      }}
    >
      <div className="flex w-full px-3 py-2 gap-2 relative" ref={clickAwayRef}>
        <div className="flex relative" style={{ width: 'calc(100% - 40px)' }}>
          <Input
            leftElem={<MagnifyingGlass size={16} className="text-[var(--pv-neutral-grey-300)]" />}
            showClearInput
            disabled={tablesListData.isLoading || noCols}
            value={immediateSearchQuery}
            onChange={(e) => {
              searchDebounce(e.target.value);
              setImmediateSearchQuery(e.target.value);
            }}
            onFocusChange={() => {
              if (immediateSearchQuery) {
                setSearchQuery(immediateSearchQuery);
              }
            }}
            placeholder="Search Tables/Columns"
            className={{
              wrapper: 'w-full',
              input: {
                wrapper: 'py-1.5 px-3',
                root: 'text-xs'
              }
            }}
          />
          {searchQuery.length > 0 && (
            <div
              className="absolute bg-white border border-[var(--pv-primary-500)] rounded-lg z-20"
              style={{ top: 'calc(100% + 4px)', left: 0, width: '400px', boxShadow: '0px 16px 20px -6px rgba(0, 0, 0, 0.10)' }}
            >
              <SearchResults
                searchQuery={searchQuery}
                tableId={selectedTab}
                handleTableClick={(tab) => {
                  if (tableColSearchCleaner?.current) tableColSearchCleaner.current();
                  handleTableClick(tab);
                }}
                handleColumnClick={(col) => {
                  if (tableColSearchCleaner?.current) tableColSearchCleaner.current();
                  handleColumnClick(col);
                }}
                setSearchQuery={setSearchQuery}
                setImmediateSearchQuery={setImmediateSearchQuery}
                immediateSearchQuery={immediateSearchQuery}
                filter={filter}
                currIntegSelected={currIntegSelected}
                showLabel={showLabel}
                activeTab={searchTabIndex}
                setActiveTab={setSearchTabIndex}
                from="dict"
              />
            </div>
          )}
        </div>
        <TablesFilter
          isLoading={tablesListData.isLoading}
          filter={filter}
          setFilter={setFilter}
          noCols={noCols}
        />
      </div>

      {tablesListData.isLoading && tablesPageNumber === 1 ? (
        <div className="w-full flex flex-col px-3 gap-1">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 border-b border-[var(--pv-neutral-grey-100)]">
              <SkeletonComp width={index % 2 === 1 ? '55%' : '70%'} height={16} />
              <SkeletonComp width={28} height={20} />
            </div>
          ))}
        </div>
      ) : filteredList.length > 0 ? (
        <div
          ref={tableRef}
          className="flex flex-col px-3 py-2 overflow-y-auto w-full"
          onScroll={(e) => {
            setTooltipShow(false);
            if (e.target.scrollTop >= e.target.scrollHeight - 1500) {
              setTabRefetch(true);
            }
          }}
        >
          {filteredList.map((tab, ind) => (
            <div key={`${ind}-${tab?.id}`}>
              {ind > 0 && <span className="w-full h-px bg-[var(--pv-primary-100)]" />}
              <div
                className={`flex w-full items-center gap-2 p-3 border-l-2 cursor-pointer hover:bg-[var(--pv-primary-50)] ${selectedTab.id === tab.id ? 'font-medium border-[var(--pv-primary-500)] bg-[var(--pv-primary-50)]' : 'border-transparent'}`}
                onClick={() => setSelectedTab({ ...tab, index: ind })}
              >
                <div className="flex-1 min-w-0 overflow-hidden">
                  <TooltipWrapper title={showLabel ? tab?.label || tab?.name : tab?.name} placement="top">
                    <span
                      onMouseEnter={() => setTooltipShow(true)}
                      className={`block truncate ${selectedTab.id === tab.id ? 'font-medium' : ''}`}
                    >
                      {showLabel ? tab?.label || tab?.name : tab?.name}
                    </span>
                  </TooltipWrapper>
                </div>
                <span className={`text-xs py-0.5 px-1.5 rounded-md ${selectedTab?.id === tab?.id ? 'text-white bg-[var(--pv-primary-500)]' : 'text-[var(--pv-neutral-grey-500)] bg-[var(--pv-neutral-grey-100)]'}`}>
                  {tab?.column_count || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : filter === 'All' ? (
        <div className="flex flex-col w-full h-full justify-center items-center gap-1">
          <span className="text-[var(--pv-neutral-grey-500)] text-xs">No tables found.</span>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full justify-center items-center gap-1">
          <span className="text-[var(--pv-neutral-grey-500)] text-xs">No data found for the selected filter.</span>
          <button
            className="px-3 py-1 text-sm border border-[var(--pv-neutral-grey-200)] rounded hover:bg-[var(--pv-neutral-grey-50)]"
            onClick={() => setFilter('All')}
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
};
