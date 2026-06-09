import { useCallback, useEffect, useState } from "react";
import { Funnel, CaretDown, CaretRight } from "@phosphor-icons/react";
import { debounce, isEqual } from "lodash";
import { useGetTagsList } from "../api";
import Checkbox from "@/common-components/Checkbox";
import { Popper } from "@/common-components/Popper";
import { Button } from "@/common-components/Button";

const DEFAULT_FILTERS = {
  format: [],
  tags: [],
  dataType: [],
  dataFill: { opType: "less or equal to", opSign: "<=", value: 100 },
  status: "All"
};

const DATA_TYPES = [
  { name: "Numeric", val: "numeric" },
  { name: "Text/String", val: "text" },
  { name: "Decimal", val: "decimal" },
  { name: "Boolean", val: "boolean" },
  { name: "Enum/Multienum", val: "enum" },
  { name: "Date/Date Time", val: "datetime" },
  { name: "JSON", val: "json" }
];

const FORMATS = [
  { name: "Currency", val: "currency" },
  { name: "Date", val: "date" },
  { name: "Date and time", val: "datetime" },
  { name: "None", val: "none" }
];

const OPERATORS = [
  { name: "equals to", sign: "=", icon: "=" },
  { name: "greater than", sign: ">", icon: ">" },
  { name: "less than", sign: "<", icon: "<" },
  { name: "greater or equal to", sign: ">=", icon: "≥" },
  { name: "less or equal to", sign: "<=", icon: "≤" }
];

export default function ColumnsFilter({
  isLoading,
  filters,
  setFilters,
  scrollFilterCleaner,
  selectedTab,
  filterCloserRef,
  Slider
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [opOpen, setOpOpen] = useState(false);
  const [immediateFilterVal, setImmediateFilterVal] = useState(filters.dataFill.value || 100);

  // Set up refs for external control
  if (filterCloserRef) {
    filterCloserRef.current = () => {
      setFilterOpen(false);
      setHoveredCategory(null);
    };
  }

  if (scrollFilterCleaner) {
    scrollFilterCleaner.current = () => {
      setOpOpen(false);
      setHoveredCategory(null);
      setFilterOpen(false);
    };
  }

  // Reset filter value when tab changes
  useEffect(() => {
    setImmediateFilterVal(100);
  }, [selectedTab?.id]);

  // Fetch tags from API
  const tagList = useGetTagsList({
    payload: { keyword: "" },
    config: { staleTime: Infinity }
  });

  // Debounced filter value update
  const valDebouncer = useCallback(
    debounce((val) => {
      setFilters((prev) => {
        let temp = structuredClone(prev);
        temp.dataFill.value = val;
        return temp;
      });
    }, 300),
    [setFilters]
  );

  // Close sub-menus when main menu closes
  useEffect(() => {
    if (!filterOpen) {
      setHoveredCategory(null);
    }
  }, [filterOpen]);

  // Close operator dropdown when not on Data Fill %
  useEffect(() => {
    if (hoveredCategory !== "Data Fill %") {
      setOpOpen(false);
    }
  }, [hoveredCategory]);

  const hasActiveFilters = !isEqual(filters, DEFAULT_FILTERS);

  // Get display value for filter categories
  const getDisplayValue = (category) => {
    switch (category) {
      case "Status":
        return filters.status;
      case "Data Type":
        const selectedTypes = DATA_TYPES.filter((dt) => filters.dataType.includes(dt.val)).map((dt) => dt.name);
        if (selectedTypes.length === 0) return null;
        return selectedTypes.length > 1 ? `${selectedTypes[0]} +${selectedTypes.length - 1}` : selectedTypes[0];
      case "Format":
        const selectedFormats = FORMATS.filter((f) => filters.format.includes(f.val)).map((f) => f.name);
        if (selectedFormats.length === 0) return null;
        return selectedFormats.length > 1 ? `${selectedFormats[0]} +${selectedFormats.length - 1}` : selectedFormats[0];
      case "Tags":
        if (!Array.isArray(tagList.data?.data)) return null;
        const selectedTags = tagList.data.data.filter((t) => filters.tags.includes(t.id)).map((t) => t.name);
        if (selectedTags.length === 0) return null;
        return selectedTags.length > 1 ? `${selectedTags[0]} +${selectedTags.length - 1}` : selectedTags[0];
      case "Data Fill %":
        return null;
      default:
        return null;
    }
  };

  // Slider fallback
  const SliderComponent =
    Slider ||
    (({ value, onChange, min = 0, max = 100 }) => (
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange({ value: parseInt(e.target.value) })}
        className="w-full h-1 bg-[var(--pv-neutral-grey-200)] rounded-lg appearance-none cursor-pointer accent-[var(--pv-primary-500)]"
      />
    ));

  // Render Status options
  const renderStatusOptions = () => (
    <div className="flex flex-col">
      {["All", "Status on", "Status off"].map((status) => (
        <label
          key={status}
          className="px-4 py-3 flex gap-2 items-center hover:bg-[var(--pv-primary-50)] cursor-pointer"
          style={{ accentColor: "var(--pv-primary-500)" }}
        >
          <input
            type="radio"
            checked={filters.status === status}
            onChange={() => setFilters((prev) => ({ ...prev, status }))}
          />
          {status}
        </label>
      ))}
    </div>
  );

  // Render Data Type options
  const renderDataTypeOptions = () => (
    <div className="flex flex-col">
      {DATA_TYPES.map((dType, ind) => (
        <Checkbox
          key={ind}
          label={dType.name}
          checked={filters.dataType.includes(dType.val)}
          className={{
            wrapper: "px-4 py-3 w-full flex gap-2 items-center hover:bg-[var(--pv-primary-50)] cursor-pointer",
            label: "max-w-52 overflow-hidden text-ellipsis"
          }}
          onChange={(e) => {
            if (e.checked) {
              setFilters((prev) => ({
                ...prev,
                dataType: [...prev.dataType, dType.val]
              }));
            } else {
              setFilters((prev) => ({
                ...prev,
                dataType: prev.dataType.filter((t) => t !== dType.val)
              }));
            }
          }}
        />
      ))}
    </div>
  );

  // Render Format options
  const renderFormatOptions = () => (
    <div className="flex flex-col">
      {FORMATS.map((frmt, ind) => (
        <Checkbox
          key={ind}
          label={frmt.name}
          checked={filters.format.includes(frmt.val)}
          className={{
            wrapper: "px-4 py-3 w-full flex gap-2 items-center hover:bg-[var(--pv-primary-50)] cursor-pointer",
            label: "max-w-52 overflow-hidden text-ellipsis"
          }}
          onChange={(e) => {
            if (e.checked) {
              setFilters((prev) => ({
                ...prev,
                format: [...prev.format, frmt.val]
              }));
            } else {
              setFilters((prev) => ({
                ...prev,
                format: prev.format.filter((f) => f !== frmt.val)
              }));
            }
          }}
        />
      ))}
    </div>
  );

  // Render Tags options
  const renderTagsOptions = () => {
    if (!Array.isArray(tagList.data?.data) || tagList.data.data.length === 0) {
      return <div className="px-4 py-3 text-[var(--pv-neutral-grey-500)] text-sm">No tags available</div>;
    }

    return (
      <div className="flex flex-col max-h-48 overflow-y-auto">
        {tagList.data.data.map((tag, ind) => (
          <Checkbox
            key={ind}
            label={tag.name}
            checked={filters.tags.includes(tag.id)}
            className={{
              wrapper: "px-4 py-3 w-full flex gap-2 items-center hover:bg-[var(--pv-primary-50)] cursor-pointer",
              label: "max-w-52 overflow-hidden text-ellipsis"
            }}
            onChange={(e) => {
              if (e.checked) {
                setFilters((prev) => ({
                  ...prev,
                  tags: [...prev.tags, tag.id]
                }));
              } else {
                setFilters((prev) => ({
                  ...prev,
                  tags: prev.tags.filter((t) => t !== tag.id)
                }));
              }
            }}
          />
        ))}
      </div>
    );
  };

  // Render Data Fill % options
  const renderDataFillOptions = () => {
    const currentOp = OPERATORS.find((op) => op.name === filters.dataFill.opType) || OPERATORS[4];

    return (
      <div className="flex flex-col items-center gap-3 p-3">
        <div className="flex items-center gap-2 justify-between w-full">
          {/* Operator selector */}
          <Popper
            open={opOpen}
            onOpenChange={setOpOpen}
            placement="bottom-start"
            btnColor="secondary ghost"
            btnSize="sm"
            mainBtnClassName={`!px-2 !py-1.5 !rounded !min-w-[60px] !h-9 ${opOpen ? "!bg-[var(--pv-primary-50)]" : ""}`}
            popperClassName="!rounded-lg"
            popperStyle={{ width: "180px" }}
            buttonChildren={({ open }) => (
              <>
                <span className="font-mono text-sm">{currentOp.icon}</span>
                <CaretDown weight="fill" className={`transform transition-transform ${open ? "rotate-180" : ""}`} size={12} />
              </>
            )}
          >
            {({ close }) => (
              <div className="flex flex-col">
                {OPERATORS.map((op) => (
                  <label
                    key={op.sign}
                    className="px-4 py-2 flex gap-2 items-center hover:bg-[var(--pv-primary-50)] cursor-pointer"
                    style={{ accentColor: "var(--pv-primary-500)" }}
                  >
                    <input
                      type="radio"
                      checked={filters.dataFill.opType === op.name}
                      onChange={() => {
                        setFilters((prev) => ({
                          ...prev,
                          dataFill: { ...prev.dataFill, opType: op.name, opSign: op.sign }
                        }));
                        close();
                      }}
                    />
                    <span className="font-mono w-4">{op.icon}</span>
                    <span className="text-sm">{op.name}</span>
                  </label>
                ))}
              </div>
            )}
          </Popper>
          <span className="bg-[var(--pv-neutral-grey-200)]" style={{ width: "1px", height: "20px" }} />

          {/* Value input */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="100"
              value={immediateFilterVal}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 0 && val <= 100) {
                  setImmediateFilterVal(val);
                  valDebouncer(val);
                }
              }}
              className="w-14 px-2 py-1.5 border border-[var(--pv-neutral-grey-200)] rounded text-center text-sm"
            />
            <span className="text-[var(--pv-neutral-grey-400)]">%</span>
          </div>
        </div>

        {/* Slider */}
        <div className="flex w-full items-center px-1">
          <SliderComponent
            value={immediateFilterVal}
            onChange={(e) => {
              setImmediateFilterVal(e.value);
              valDebouncer(e.value);
            }}
            min={0}
            max={100}
          />
        </div>
      </div>
    );
  };

  // Render sub-menu content based on hovered category
  const renderSubMenu = () => {
    switch (hoveredCategory) {
      case "Status":
        return renderStatusOptions();
      case "Data Type":
        return renderDataTypeOptions();
      case "Format":
        return renderFormatOptions();
      case "Tags":
        return renderTagsOptions();
      case "Data Fill %":
        return renderDataFillOptions();
      default:
        return null;
    }
  };

  const categories = ["Status", "Data Type", "Format", "Tags", "Data Fill %"];

  const getFilterButtonClass = () => {
    if (isLoading || tagList.isLoading) {
      return "!bg-[var(--pv-neutral-grey-100)] !text-[var(--pv-neutral-grey-300)] !border-transparent";
    }
    if (filterOpen) {
      return "!border-[var(--pv-neutral-grey-200)] !bg-[var(--pv-primary-50)] !text-[var(--pv-primary-500)]";
    }
    if (hasActiveFilters) {
      return "!border-[var(--pv-primary-500)] !bg-[var(--pv-primary-50)] !text-[var(--pv-primary-500)]";
    }
    return "!border-[var(--pv-neutral-grey-200)] !bg-white !text-[var(--pv-neutral-grey-600)] hover:!bg-[var(--pv-neutral-grey-50)]";
  };

  return (
    <Popper
      open={filterOpen}
      onOpenChange={setFilterOpen}
      placement="bottom-end"
      disabled={isLoading || tagList.isLoading}
      btnSize="sm"
      btnColor="secondary ghost"
      mainBtnClassName={`!w-8 !h-8 !p-0 !rounded-lg relative ${getFilterButtonClass()}`}
      popperClassName="!overflow-visible"
      popperStyle={{ width: "260px" }}
      buttonChildren={
        <div className="relative flex items-center justify-center w-full h-full">
          <Funnel size={14} weight={hasActiveFilters ? "fill" : "bold"} />
          {hasActiveFilters && (
            <span className="absolute h-1.5 w-1.5 bg-[var(--pv-primary-500)] rounded-full -top-0.5 -right-0.5" />
          )}
        </div>
      }
    >
      {({ close }) => (
        <>
          <div className="flex flex-col w-full">
            {categories.map((category) => (
              <div key={category} className="relative w-full">
                <div
                  className={`flex justify-between items-center cursor-pointer px-4 py-3 ${
                    hoveredCategory === category ? "bg-[var(--pv-primary-50)]" : "hover:bg-[var(--pv-neutral-grey-50)]"
                  }`}
                  onMouseEnter={() => setHoveredCategory(category)}
                >
                  <span className="text-sm">{category}</span>
                  <div className="flex gap-1 items-center">
                    <span className="text-xs text-[var(--pv-neutral-grey-500)]">{getDisplayValue(category)}</span>
                    <CaretRight size={14} />
                  </div>
                </div>

                {/* Sub-menu */}
                {hoveredCategory === category && (
                  <div
                    className="absolute bg-white h-fit flex flex-col border border-[var(--pv-neutral-grey-200)] rounded-lg overflow-visible z-30"
                    style={{
                      top: "0px",
                      right: "100%",
                      width: category === "Data Fill %" ? "220px" : "200px",
                      boxShadow: "0px 0px 24px 0px rgba(0, 0, 0, 0.10)"
                    }}
                  >
                    {renderSubMenu()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Clear filter button */}
          <div className="flex w-full justify-start p-2 border-t border-[var(--pv-neutral-grey-100)]">
            <Button
              btnColor="ghost"
              btnSize="sm"
              disabled={!hasActiveFilters}
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setImmediateFilterVal(100);
                setHoveredCategory(null);
                close();
              }}
            >
              Clear Filter
            </Button>
          </div>
        </>
      )}
    </Popper>
  );
}
