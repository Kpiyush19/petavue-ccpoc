import { useState } from "react";
import { toast } from "sonner";
import { CaretDown, Eye, PencilSimple } from "@phosphor-icons/react";
import { useUpdateGuidedAnalysisStatus } from "../api";
import { useQueryClient, useUser } from "../context";
import { Toggle } from "@/common-components/Toggle";
import Checkbox from "@/common-components/Checkbox";

export const ColumnElement = ({
  col,
  ind,
  selected,
  setSelected,
  setColDataModalOpen,
  setColumnDetails,
  selectedTab,
  currentColPageNumber,
  currIntegSelected,
  searchQuery,
  setColumns,
  setSelectedColDetails,
  setColEditModalOpen,
  bulkActActive,
  bulkCols,
  selectAll,
  setBulkCols,
  setBulkExcludeCols,
  setBulkActActive,
  filterConfig,
  setEnabledCols,
  shouldScrollFetch,
  setShouldScrollFetch,
  filterCloserRef,
  Tooltip
}) => {
  const [toggleDisabled, setToggleDisabled] = useState(false);
  const user = useUser();
  const queryClient = useQueryClient();
  const updateGuidedAnalysisStatus = useUpdateGuidedAnalysisStatus();

  const index = ind + 1;
  const isSelected = bulkCols.some((c) => c.name === col.name);
  const isExpanded = selected === index;
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (toggleDisabled || !isAdmin) return;

    setToggleDisabled(true);
    const { dataFillOperator, dataFillValue, status, formats, dataTypes, tags } = filterConfig || {};
    const colPageNum = Math.ceil(index / 100);
    const queryKey = ["tableColumns", selectedTab?.id, searchQuery, colPageNum, "searchKeywordInDescription"];
    if (dataFillOperator) queryKey.push(dataFillOperator);
    if (dataFillValue) queryKey.push(dataFillValue);
    if (typeof status === "boolean") queryKey.push(status);
    if (formats) queryKey.push(formats);
    if (dataTypes) queryKey.push(dataTypes);
    if (tags) queryKey.push(tags);

    setColumns((prev) => {
      let temp = structuredClone(prev || []);
      return temp.map((colm) => {
        if (colm.name === col.name) {
          colm.disabledForGuidedAnalysis = !colm.disabledForGuidedAnalysis;
        }
        return colm;
      });
    });

    queryClient.setQueryData(queryKey, (prevData) => {
      let prev = structuredClone(prevData || {});
      let columns = prev?.data || [];
      if (Array.isArray(columns) && columns.length > 0) {
        const colInd = columns.findIndex((column) => column.name === col.name);
        if (colInd > -1) {
          columns[colInd] = {
            ...columns[colInd],
            disabledForGuidedAnalysis: !columns[colInd].disabledForGuidedAnalysis
          };
        }
      }
      prev.data = columns;
      return prev;
    });

    try {
      await updateGuidedAnalysisStatus.mutateAsync({
        data: { enable: col.disabledForGuidedAnalysis },
        metadata: {
          integrationId: currIntegSelected?.id,
          tableId: selectedTab?.id,
          columnName: col.name,
          keyword: searchQuery,
          queryKey,
          setColumns,
          col,
          pagiColPageNum: currentColPageNumber,
          setEnabledCols,
          selectedTab,
          shouldScrollFetch,
          setShouldScrollFetch
        }
      });
    } catch {
      toast.error('Failed to update column status');
    } finally {
      setToggleDisabled(false);
    }
  };

  const handleCheckbox = (checked) => {
    if (checked) {
      if (!bulkActActive) setBulkActActive(true);
      setBulkCols((prev) => [...prev, col]);
      if (selectAll) {
        setBulkExcludeCols((prev) => prev.filter((c) => c.name !== col.name));
      }
    } else {
      setBulkCols((prev) => prev.filter((c) => c.name !== col.name));
      if (selectAll) {
        setBulkExcludeCols((prev) => [...prev, col]);
      }
    }
  };

  const handleRowClick = (e) => {
    if (e.target.classList.value.includes("column-list-button") || e.target.classList.value === "") {
      return;
    }
    setSelected((prev) => (prev === index ? 0 : index));
  };

  const TooltipWrapper = Tooltip || (({ children, title }) => <span title={title}>{children}</span>);

  return (
    <div
      className={`group flex relative flex-col px-2 border rounded-lg py-3 cursor-pointer transition-colors ${
        isExpanded ? "" : "justify-center"
      } border-[var(--pv-neutral-grey-100)] hover:border-[var(--pv-primary-500)] hover:shadow-[0px_8px_24px_0px_rgba(144,144,144,0.1)] ${
        isSelected ? "bg-[var(--pv-primary-50)] border-[var(--pv-primary-500)]" : "bg-white hover:bg-[var(--pv-primary-50)]"
      }`}
      style={{
        height: isExpanded ? "fit-content" : "58px",
        minWidth: "918px"
      }}
      onClick={handleRowClick}
    >
      {/* Main Row */}
      <div
        className={`grid text-[11px] text-[var(--pv-neutral-grey-600)] ${isExpanded ? "pt-2" : "items-center"}`}
        style={{ gridTemplateColumns: "3% 12% 12% 12% 43% 10% 4% 4%" }}
      >
        {/* Index / Checkbox */}
        <span className={`px-2 ${isExpanded ? "h-full" : "h-fit max-h-8 overflow-hidden"}`}>
          {bulkActActive ? (
            <Checkbox checked={isSelected} onChange={(e) => handleCheckbox(e.checked)} />
          ) : isAdmin ? (
            <>
              <span className="group-hover:hidden">{`${index}.`}</span>
              <span className="hidden group-hover:inline">
                <Checkbox checked={isSelected} onChange={(e) => handleCheckbox(e.checked)} />
              </span>
            </>
          ) : (
            `${index}.`
          )}
        </span>

        {/* Label with Caret */}
        <div className={`px-2 w-fit inline-flex gap-2 overflow-hidden ${isExpanded ? "" : "items-center"}`}>
          <CaretDown
            className={`transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            style={{ marginTop: "2px", minWidth: "12px" }}
          />
          <button
            className={`inline-flex text-[var(--pv-neutral-grey-900)] hover:text-[var(--pv-primary-500)] hover:underline text-left ${
              isExpanded ? "self-start" : "line-clamp-2"
            } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
            style={{ wordBreak: "break-all" }}
            onClick={(e) => {
              e.stopPropagation();
              if (isAdmin) {
                if (filterCloserRef?.current) filterCloserRef.current();
                setSelectedColDetails({
                  ...col,
                  integDetails: { ...currIntegSelected }
                });
                setColEditModalOpen(true);
              }
            }}
            disabled={!isAdmin}
          >
            {col.label || col.name}
          </button>
        </div>

        {/* Column Name */}
        <span className={`px-2 ${isExpanded ? "" : "line-clamp-2"}`} style={{ wordBreak: "break-all" }}>
          {col.name || "-"}
        </span>

        {/* Type Badge */}
        <span
          className={`px-2 flex items-center ${isExpanded ? "transform -translate-y-0.5 h-fit" : "h-full max-h-8 overflow-hidden"}`}
        >
          <span className="inline-block w-fit rounded-lg capitalize bg-[var(--pv-primary-100)] py-1 px-1.5 text-[11px]">
            {col.type || "-"}
          </span>
        </span>

        {/* Description */}
        <p className={`m-0 px-2 ${isExpanded ? "" : "line-clamp-2"}`}>{col.description || "-"}</p>

        {/* View Button */}
        <div
          className={`pr-2 pl-5 h-fit flex transform text-[var(--pv-primary-500)] hover:text-[var(--pv-primary-700)] cursor-pointer ${isExpanded ? "" : "max-h-8 overflow-hidden"}`}
        >
          <button
            className="w-fit h-full flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setColDataModalOpen(true);
              setColumnDetails({
                tableId: selectedTab?.id,
                columnName: col.name,
                tableName: selectedTab?.name,
                ...col
              });
            }}
          >
            <Eye size={14} />
            <span>View</span>
          </button>
        </div>

        {/* Toggle */}
        <div className="flex px-2">
          <div className={`flex ${toggleDisabled || !isAdmin ? "cursor-not-allowed" : "cursor-pointer"}`}>
            <Toggle
              checked={!col?.disabledForGuidedAnalysis || false}
              disabled={toggleDisabled || !isAdmin}
              onClick={handleToggle}
              size="lg"
            />
          </div>
        </div>

        {/* Edit Button (on hover) */}
        <TooltipWrapper placement="top" title="Edit">
          <button
            className={`p-2 absolute h-fit w-fit hidden group-hover:flex transform rounded-lg ${
              isExpanded ? "transform -translate-y-1.5" : ""
            } ${isAdmin ? "cursor-pointer hover:bg-[var(--pv-primary-100)]" : "cursor-not-allowed"}`}
            style={{
              right: "10px",
              top: isExpanded ? "20px" : "14px"
            }}
            disabled={!isAdmin}
            onClick={(e) => {
              e.stopPropagation();
              if (isAdmin) {
                setSelectedColDetails({
                  ...col,
                  integDetails: { ...currIntegSelected },
                  index: ind + 1,
                  filterConfig: filterConfig
                });
                setColEditModalOpen(true);
              }
            }}
          >
            <PencilSimple />
          </button>
        </TooltipWrapper>
      </div>

      {/* Expanded Section - Format, Data fill %, Tags, Connected fields */}
      {isExpanded && (
        <div
          className="grid mt-3 pt-3 border-t border-[var(--pv-neutral-grey-100)] justify-between"
          style={{ gridTemplateColumns: "20% 20% 20% 40%" }}
        >
          {/* Format */}
          <div className="px-2 flex flex-col gap-2">
            <span className="text-[11px] text-[var(--pv-neutral-grey-500)] font-semibold">Format</span>
            <p
              className={
                col.format
                  ? `text-[11px] text-[var(--pv-neutral-grey-900)] px-1.5 py-1 w-fit bg-[var(--pv-primary-100)] rounded-lg ${col.format === "datetime" ? "" : "capitalize"}`
                  : "text-[var(--pv-neutral-grey-500)] text-[11px]"
              }
            >
              {col.format ? (col.format === "datetime" ? "Date and Time" : col.format) : "-"}
            </p>
          </div>

          {/* Data fill % */}
          <div className="px-2 flex flex-col gap-2">
            <span className="text-[11px] text-[var(--pv-neutral-grey-500)] font-semibold">Data fill %</span>
            <p className="text-[var(--pv-neutral-grey-500)] text-[11px]">
              {col?.nonNullValuePercentage === null ? "N/A" : col.nonNullValuePercentage + "%"}
            </p>
          </div>

          {/* Tags */}
          <div className="px-2 flex flex-col gap-2">
            <span className="text-[11px] text-[var(--pv-neutral-grey-500)] font-semibold">Tags</span>
            <p className="leading-7">
              {Array.isArray(col.tags) && col.tags.length > 0 ? (
                col.tags.map((tag, tagIndex) => (
                  <span key={tag.id || tagIndex} className="text-[11px] text-[var(--pv-neutral-grey-900)]">
                    {tagIndex !== 0 && <span> &nbsp;|&nbsp; </span>}
                    <span className="inline-block px-1.5 py-1 bg-[var(--pv-primary-100)] rounded-lg">{tag.name}</span>
                  </span>
                ))
              ) : (
                <span className="text-[11px]">-</span>
              )}
            </p>
          </div>

          {/* Connected fields */}
          <div className="px-2 flex flex-col gap-2">
            <span className="text-[11px] text-[var(--pv-neutral-grey-500)] font-semibold">Connected fields</span>
            <p className="leading-7">
              {Array.isArray(col.mappings) && col.mappings.length > 0 ? (
                col.mappings.map((mapping, mapIndex) => (
                  <span key={mapping.id || mapIndex} className="text-[11px] text-[var(--pv-neutral-grey-900)]">
                    {mapIndex !== 0 && <span> &nbsp;|&nbsp; </span>}
                    <span className="inline-block px-1.5 py-1 bg-[var(--pv-primary-100)] rounded-lg">{mapping.foreignField}</span>
                  </span>
                ))
              ) : (
                <span className="text-[11px]">-</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
