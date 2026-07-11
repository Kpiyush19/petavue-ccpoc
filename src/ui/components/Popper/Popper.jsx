import { useState, useCallback, useEffect } from 'react';
import { ClickAwayListener, Fade, Popper as MUIPopper } from '@mui/material';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/ui';
import { useScrollCleanup } from './useScrollCleanup';

// Map the legacy btnColor/btnSize API (this component's public props) onto the
// canonical Button's variant/size.
const VARIANT_MAP = { primary: 'primary', secondary: 'secondary', ghost: 'ghost', transparent: 'ghost', 'secondary ghost': 'secondaryGhost', 'primary red': 'red', 'red ghost': 'red', 'blue ghost': 'blueGhost' };
const SIZE_MAP = { sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' };

export const Popper = ({
  buttonChildren,
  children,
  placement = 'bottom-start',
  disablePortal = false,
  fadeTimeout = 200,
  zIndex = 50,
  open: controlledOpen,
  onOpenChange,
  onClickAway,
  btnSize = 'md',
  btnColor = 'secondary ghost',
  buttonClassName = '',
  mainBtnClassName = '',
  popperClassName = '',
  popperStyle = {},
  disabled = false,
  id,
  closeOnClickInside = false,
  ignoreClickAwaySelectors = [],
  scrollContainerRef,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = typeof controlledOpen !== 'undefined';
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const { popperShow, setPopperShow } = useScrollCleanup({
    containerRef: scrollContainerRef,
    enabled: isOpen && Boolean(scrollContainerRef),
  });

  useEffect(() => {
    if (isOpen) {
      setPopperShow(true);
    }
  }, [isOpen, setPopperShow]);

  useEffect(() => {
    if (!popperShow && isOpen) {
      setAnchorEl(null);
      if (isControlled) {
        onOpenChange?.(false);
      } else {
        setInternalOpen(false);
      }
    }
  }, [popperShow, isOpen, isControlled, onOpenChange]);

  const handleToggle = useCallback(
    (event) => {
      const newOpen = !isOpen;
      setAnchorEl(newOpen ? event.currentTarget : null);

      if (isControlled) {
        onOpenChange?.(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    },
    [isOpen, isControlled, onOpenChange]
  );

  const closePopper = useCallback(() => {
    setAnchorEl(null);
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
  }, [isControlled, onOpenChange]);

  const handleClose = useCallback(
    (event) => {
      if (ignoreClickAwaySelectors.length > 0) {
        const shouldIgnore = ignoreClickAwaySelectors.some((selector) =>
          event?.target?.closest(selector)
        );
        if (shouldIgnore) return;
      }

      if (onClickAway) {
        onClickAway(event);
        return;
      }

      closePopper();
    },
    [closePopper, onClickAway, ignoreClickAwaySelectors]
  );

  const handlePopperClick = useCallback(() => {
    if (closeOnClickInside) {
      setTimeout(closePopper, 100);
    }
  }, [closeOnClickInside, closePopper]);

  return (
    <>
      <Button
        onClick={handleToggle}
        variant={VARIANT_MAP[btnColor] || 'secondaryGhost'}
        size={SIZE_MAP[btnSize] || 'md'}
        className={[buttonClassName, mainBtnClassName].filter(Boolean).join(' ')}
        disabled={disabled}
        id={id}
      >
        {typeof buttonChildren === 'function'
          ? buttonChildren({ open: isOpen })
          : buttonChildren}
      </Button>

      <MUIPopper
        open={isOpen && Boolean(anchorEl)}
        anchorEl={anchorEl}
        transition
        placement={placement}
        disablePortal={disablePortal}
        style={{ zIndex }}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Fade {...TransitionProps} timeout={fadeTimeout}>
              <div
                className={twMerge(
                  'bg-white rounded-lg shadow-lg border border-grey-200 overflow-hidden',
                  popperClassName
                )}
                style={popperStyle}
                onClickCapture={handlePopperClick}
              >
                {typeof children === 'function'
                  ? children({ open: isOpen, close: () => handleClose({}) })
                  : children}
              </div>
            </Fade>
          </ClickAwayListener>
        )}
      </MUIPopper>
    </>
  );
};

export { useScrollCleanup } from './useScrollCleanup';
export default Popper;
