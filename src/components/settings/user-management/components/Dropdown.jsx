import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';

const Dropdown = ({ title, options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[var(--pv-primary-500)] text-[var(--pv-primary-500)] rounded-lg hover:bg-[var(--pv-primary-50)]"
      >
        {title}
        <CaretDown size={12} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-[var(--pv-neutral-grey-200)] rounded-lg shadow-lg z-20">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--pv-neutral-grey-50)] first:rounded-t-lg last:rounded-b-lg"
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dropdown;
