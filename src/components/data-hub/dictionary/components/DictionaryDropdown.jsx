import { useState, useRef, useCallback } from 'react';
import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react';
import { ClickAwayListener } from '@mui/material';
import { Tooltip, Input } from '@/common-components';
import { useScrollCleanup } from '@/common-components/Tooltip/useScrollCleanup';
import { useNavigate, useBasePath } from '../context';

const DictionaryDropdown = ({
  loading,
  integData,
  currIntegSelected,
  setCurrIntegSelected,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  const basePath = useBasePath();
  const open = Boolean(anchorEl);
  const { tooltipShow, setTooltipShow } = useScrollCleanup({ containerRef: scrollContainerRef, enabled: open });

  const list = Array.isArray(integData)
    ? integData
        .filter((integ) => !integ.isInitialSyncInProgress)
        .filter((integ) => (integ.tables?.length || integ.tableCount || 0) > 0)
        .filter((integ) => {
          if (searchQuery === '') return true;
          return integ?.datasource?.toLowerCase?.()?.includes?.(searchQuery.toLowerCase());
        })
    : [];

  const handleDropdownOpen = useCallback((node) => {
    if (!node) return;
    requestAnimationFrame(() => {
      const listEl = node.querySelector('[data-scroll-container]');
      const selected = node.querySelector('[data-selected]');
      if (listEl && selected) {
        const listRect = listEl.getBoundingClientRect();
        const selectedRect = selected.getBoundingClientRect();
        const relativeTop = selectedRect.top - listRect.top + listEl.scrollTop;
        const listHeight = listEl.clientHeight;
        const itemHeight = selected.clientHeight;
        listEl.scrollTop = relativeTop - listHeight / 2 + itemHeight / 2;
      }
    });
  }, []);

  const handleClick = (event) => {
    const newAnchor = anchorEl ? null : event.currentTarget;
    setAnchorEl(newAnchor);
    if (newAnchor) {
      setTimeout(() => {
        const dropdown = document.getElementById('dictionary-dropdown-menu');
        if (dropdown) handleDropdownOpen(dropdown);
      }, 50);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchQuery('');
  };

  const handleSelect = (integ) => {
    setSearchQuery('');
    setAnchorEl(null);
    setCurrIntegSelected(integ);
    navigate(`${basePath}/${integ.id}`);
  };

  if (loading) {
    return (
      <div className="h-6 w-32 bg-pv-neutral-grey-200 rounded animate-pulse" />
    );
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 px-1 py-1.5 rounded-lg bg-transparent border-none cursor-pointer hover:bg-pv-neutral-grey-50"
        onClick={handleClick}
      >
        {currIntegSelected?.logo && (
          <img src={currIntegSelected.logo} alt="" className="w-5 h-5" />
        )}
        <Tooltip title={currIntegSelected?.datasource} displayTooltipOnOverflow placement="bottom">
          <span className="block truncate text-base font-medium max-w-[200px] text-pv-neutral-grey-900">
            {currIntegSelected?.datasource || 'Select Source'}
          </span>
        </Tooltip>
        <CaretDown
          size={14}
          weight="fill"
          className="text-pv-neutral-grey-400"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 300ms ease-out'
          }}
        />
      </button>

      {open && (
        <ClickAwayListener onClickAway={handleClose}>
          <div
            id="dictionary-dropdown-menu"
            className="absolute top-full left-0 mt-1 bg-white flex flex-col rounded-lg border border-pv-neutral-grey-200 z-50 min-w-[250px] max-w-[300px]"
            style={{ boxShadow: '0px 8px 24px 0px rgba(0, 0, 0, 0.10)' }}
          >
            <div className="flex flex-col w-full py-3">
              <div className="px-3 mb-2">
                <Input
                  leftElem={<MagnifyingGlass size={16} className="text-pv-neutral-grey-400" />}
                  showClearInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Sources"
                  className={{
                    input: {
                      wrapper: 'py-2 px-3',
                      root: 'text-sm'
                    }
                  }}
                />
              </div>
              <div
                ref={scrollContainerRef}
                data-scroll-container
                className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden max-h-44"
              >
                {searchQuery.length > 0 && (
                  <span className="py-1.5 px-3 text-xs text-pv-neutral-grey-500">
                    Search results for <span className="font-medium">"{searchQuery}"</span>
                  </span>
                )}
                {list.length > 0 ? (
                  list.map((integ) => {
                    const isSelected = currIntegSelected?.id === integ.id;
                    return (
                      <div
                        key={integ.id}
                        data-selected={isSelected || undefined}
                        className={`flex items-center gap-2 px-4 py-3 shrink-0 cursor-pointer hover:bg-pv-primary-primary-50 border-l-2 border-transparent ${
                          isSelected ? 'font-medium bg-pv-primary-primary-50 border-pv-primary-primary-500' : ''
                        }`}
                        onMouseEnter={() => setTooltipShow(true)}
                        onClick={() => handleSelect(integ)}
                      >
                        {integ.logo && (
                          <img src={integ.logo} alt="" className="w-4 h-4 shrink-0" />
                        )}
                        <Tooltip
                          title={integ.datasource}
                          displayTooltipOnOverflow
                          tooltipActive={tooltipShow}
                          placement="right"
                        >
                          <span className="truncate text-sm">{integ.datasource}</span>
                        </Tooltip>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-pv-neutral-grey-500">No sources found</div>
                )}
              </div>
            </div>
          </div>
        </ClickAwayListener>
      )}
    </div>
  );
};

export default DictionaryDropdown;
