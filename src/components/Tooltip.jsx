import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({
  title,
  placement = 'top',
  arrow = false,
  tooltipActive,
  displayTooltipOnOverflow = false,
  disablePortal = false,
  children,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const checkOverflow = () => {
    if (!displayTooltipOnOverflow || !triggerRef.current) return true;
    const el = triggerRef.current;
    return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = arrow ? 10 : 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + gap;
        break;
      default:
        break;
    }

    const padding = 8;
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - tooltipRect.width - padding)
    );
    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - tooltipRect.height - padding)
    );

    setPosition({ top, left });
  };

  const showTooltip = tooltipActive !== undefined ? tooltipActive : isVisible;

  useEffect(() => {
    if (showTooltip && !disablePortal) {
      requestAnimationFrame(() => {
        calculatePosition();
        setIsPositioned(true);
      });
    } else {
      setIsPositioned(false);
    }
  }, [showTooltip, disablePortal]);

  const handleMouseEnter = () => {
    if (tooltipActive !== undefined) return;
    if (checkOverflow()) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipActive !== undefined) return;
    setIsVisible(false);
  };

  if (!title) {
    return children;
  }

  const arrowStyles = {
    top: 'left-1/2 -translate-x-1/2 top-full border-l-transparent border-r-transparent border-b-transparent border-t-[var(--color-text-primary)]',
    bottom: 'left-1/2 -translate-x-1/2 bottom-full border-l-transparent border-r-transparent border-t-transparent border-b-[var(--color-text-primary)]',
    left: 'top-1/2 -translate-y-1/2 left-full border-t-transparent border-b-transparent border-r-transparent border-l-[var(--color-text-primary)]',
    right: 'top-1/2 -translate-y-1/2 right-full border-t-transparent border-b-transparent border-l-transparent border-r-[var(--color-text-primary)]',
  };

  const tooltipContent = showTooltip && (
    <div
      ref={tooltipRef}
      className="fixed z-50 px-2.5 py-1.5 text-xs text-white bg-[var(--color-text-primary)] rounded-md shadow-lg max-w-xs break-words pointer-events-none transition-opacity duration-75"
      style={{
        ...(disablePortal ? {} : { top: position.top, left: position.left }),
        opacity: isPositioned ? 1 : 0,
      }}
    >
      {title}
      {arrow && (
        <span
          className={`absolute w-0 h-0 border-4 border-solid ${arrowStyles[placement]}`}
        />
      )}
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </span>
      {!disablePortal && tooltipContent
        ? createPortal(tooltipContent, document.body)
        : tooltipContent}
    </>
  );
}
