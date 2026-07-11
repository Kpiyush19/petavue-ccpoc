import { useState, useRef, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';

const Menu = ({ trigger, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);

  const handleOpen = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = items.length * 44 + 8;
      const menuWidth = 144;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight;

      setMenuStyle({
        position: 'fixed',
        top: openUpward ? rect.top - menuHeight : rect.bottom + 4,
        left: rect.right - menuWidth,
        zIndex: 50,
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setMenuStyle(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMenuStyle(null);
  };

  return (
    <div className="relative" ref={triggerRef}>
      {isValidElement(trigger) ? cloneElement(trigger, { onClick: handleOpen }) : trigger}
      {isOpen && menuStyle && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div
            style={menuStyle}
            className="w-36 bg-white border border-[var(--color-grey-200)] rounded-lg shadow-lg overflow-hidden"
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={(e) => {
                  item.onClick(e);
                  handleClose();
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--color-grey-50)]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default Menu;
