import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ClickAwayListener } from "@mui/material";
import { Tooltip, Input } from "@/ui";
import { useScrollCleanup } from "@/hooks/useScrollCleanup";

export default function WorkflowDropdown({ workflows, currentWorkflow, loading }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);
  const { tooltipShow, setTooltipShow } = useScrollCleanup({ containerRef: scrollContainerRef, enabled: open });

  const list =
    Array.isArray(workflows) && workflows.length > 0
      ? workflows.filter((wf) => {
          if (searchQuery === "") return true;
          return wf?.name?.toLowerCase?.()?.includes?.(searchQuery.toLowerCase());
        })
      : [];

  const handleDropdownOpen = useCallback((node) => {
    if (!node) return;
    requestAnimationFrame(() => {
      const list = node.querySelector("[data-scroll-container]");
      const selected = node.querySelector("[data-selected]");
      if (list && selected) {
        const listRect = list.getBoundingClientRect();
        const selectedRect = selected.getBoundingClientRect();
        const relativeTop = selectedRect.top - listRect.top + list.scrollTop;
        const listHeight = list.clientHeight;
        const itemHeight = selected.clientHeight;
        list.scrollTop = relativeTop - listHeight / 2 + itemHeight / 2;
      }
    });
  }, []);

  const handleClick = (event) => {
    const newAnchor = anchorEl ? null : event.currentTarget;
    setAnchorEl(newAnchor);
    if (newAnchor) {
      setTimeout(() => {
        const dropdown = document.getElementById("workflow-dropdown-menu");
        if (dropdown) handleDropdownOpen(dropdown);
      }, 50);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (wf) => {
    setSearchQuery("");
    setAnchorEl(null);
    navigate(`/workflows/${wf.workflow_id}`);
  };

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-1.5 px-1 py-1.5 rounded-lg bg-transparent border-none ${
          loading ? "text-grey-400 cursor-not-allowed" : "cursor-pointer hover:bg-grey-50"
        }`}
        onClick={handleClick}
        disabled={loading}
      >
        <Tooltip title={currentWorkflow?.name} displayTooltipOnOverflow placement="bottom">
          <span className="block truncate text-[16px] leading-[24px] font-medium max-w-[300px] text-grey-900">
            {currentWorkflow?.name || "Select Workflow"}
          </span>
        </Tooltip>
        <CaretDown
          size={14}
          weight="fill"
          className="text-grey-400"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 300ms ease-out"
          }}
        />
      </button>

      {open && (
        <ClickAwayListener onClickAway={handleClose}>
          <div
            id="workflow-dropdown-menu"
            className="absolute top-full left-0 mt-1 bg-white flex flex-col rounded-lg border border-grey-200 z-50 min-w-[300px] max-w-[350px]"
            style={{ boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.10)" }}
          >
            <div className="flex flex-col w-full py-3">
              <div className="px-3 mb-2">
                <Input
                  leftElem={<MagnifyingGlass size={16} className="text-grey-400" />}
                  showClearInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Workflows"
                />
              </div>
              <div
                ref={scrollContainerRef}
                data-scroll-container
                className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden max-h-44"
              >
                {searchQuery.length > 0 && (
                  <span className="py-1.5 px-3 text-xs text-grey-500">
                    Search results for <span className="font-medium">"{searchQuery}"</span>
                  </span>
                )}
                {list.length > 0 ? (
                  list.map((wf) => {
                    const isSelected = currentWorkflow?.workflow_id === wf.workflow_id;
                    return (
                      <Tooltip
                        key={wf.workflow_id}
                        title={wf.name}
                        displayTooltipOnOverflow
                        tooltipActive={tooltipShow}
                        placement="bottom"
                      >
                        <div
                          data-selected={isSelected || undefined}
                          className={`truncate px-4 py-3 shrink-0 cursor-pointer hover:bg-primary-50 border-l-2 border-transparent ${
                            isSelected ? "font-medium bg-primary-50 border-primary-500" : ""
                          }`}
                          onMouseEnter={() => setTooltipShow(true)}
                          onClick={() => handleSelect(wf)}
                        >
                          {wf.name}
                        </div>
                      </Tooltip>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-grey-500">No workflows found</div>
                )}
              </div>
            </div>
          </div>
        </ClickAwayListener>
      )}
    </div>
  );
}
