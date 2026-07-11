import { forwardRef, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * Self-contained TextareaAutosize component for the Analytics Chat Widget
 * Auto-resizes based on content up to maxRows
 */
export const TextareaAutosize = forwardRef(
  (
    {
      value,
      onChange,
      onKeyDown,
      placeholder,
      disabled,
      maxRows = 8,
      className,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef(null);
    const combinedRef = ref || textareaRef;

    useEffect(() => {
      const textarea = combinedRef.current;
      if (!textarea) return;

      // Reset height to calculate scrollHeight properly
      textarea.style.height = 'auto';

      // Calculate line height
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

      const maxHeight =
        lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);

      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY =
        textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [value, maxRows, combinedRef]);

    return (
      <textarea
        ref={combinedRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          'w-full resize-none bg-transparent border-none outline-none',
          'text-sm leading-5 placeholder:text-[var(--color-grey-400)]',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

TextareaAutosize.displayName = 'TextareaAutosize';

export default TextareaAutosize;
