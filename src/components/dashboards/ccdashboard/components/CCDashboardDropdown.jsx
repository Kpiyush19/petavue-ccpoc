import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { ClickAwayListener } from "@mui/material";
import { Tooltip, Input } from "@/ui";
import { useScrollCleanup } from "@/hooks/useScrollCleanup";
import { getDashboardId } from "../api";
import { useNavigate, useBasePath } from "../context";

export default function CCDashboardDropdown({
  dashboards,
  currentDashboard,
  loading,
  onSelect,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  const basePath = useBasePath();
  const open = Boolean(anchorEl);
  const { tooltipShow, setTooltipShow } = useScrollCleanup({ containerRef: scrollContainerRef, enabled: open });

  useEffect(() => {
    if (!open) return;

    const intervalId = setInterval(() => {
      if (document.activeElement?.tagName === 'IFRAME') {
        setAnchorEl(null);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [open]);

  const list =
    Array.isArray(dashboards) && dashboards.length > 0
      ? dashboards.filter((db) => {
          if (searchQuery === '') return true;
          return db?.name?.toLowerCase?.()?.includes?.(searchQuery.toLowerCase());
        })
      : [];

  const currentId = getDashboardId(currentDashboard);

  const handleDropdownOpen = useCallback((node) => {
    if (!node) return;
    requestAnimationFrame(() => {
      const list = node.querySelector('[data-scroll-container]');
      const selected = node.querySelector('[data-selected]');
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
        const dropdown = document.getElementById('cc-dropdown-menu');
        if (dropdown) handleDropdownOpen(dropdown);
      }, 50);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (db) => {
    setSearchQuery('');
    setAnchorEl(null);
    if (onSelect) onSelect(db);
    const dbId = getDashboardId(db);
    navigate(`${basePath}/${dbId}`);
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
        <Tooltip title={currentDashboard?.name} displayTooltipOnOverflow placement="bottom">
          <span className="block truncate text-[16px] leading-[24px] font-medium max-w-[300px] text-grey-900">
            {currentDashboard?.name || "Select Dashboard"}
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
            id="cc-dropdown-menu"
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
                  placeholder="Search Dashboards"
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
                  list.map((db) => {
                    const dbId = getDashboardId(db);
                    const isSelected = currentId === dbId;
                    return (
                      <Tooltip
                        key={dbId}
                        title={db.name}
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
                          onClick={() => handleSelect(db)}
                        >
                          {db.name}
                        </div>
                      </Tooltip>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-grey-500">No dashboards found</div>
                )}
              </div>
            </div>
          </div>
        </ClickAwayListener>
      )}
    </div>
  );
}
