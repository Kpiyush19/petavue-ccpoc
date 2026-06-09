import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

function LockBodyScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  return null
}

function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return
    const element = ref.current
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const previouslyFocused = document.activeElement

    const focusables = () => element.querySelectorAll(focusableSelector)
    const firstFocusable = () => focusables()[0]
    const lastFocusable = () => focusables()[focusables().length - 1]

    firstFocusable()?.focus()

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const focusableEls = focusables()
      if (focusableEls.length === 0) return

      if (e.shiftKey && document.activeElement === firstFocusable()) {
        e.preventDefault()
        lastFocusable()?.focus()
      } else if (!e.shiftKey && document.activeElement === lastFocusable()) {
        e.preventDefault()
        firstFocusable()?.focus()
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => {
      element.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [active, ref])
}

export function Dialog({ open, onClose, children, className }) {
  const dialogRef = useRef(null)

  useFocusTrap(dialogRef, open)

  useEffect(() => {
    if (!open || !onClose) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <LockBodyScroll />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[6px]"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative bg-[var(--bg-tertiary)] border border-[var(--border-primary)]',
              'rounded-xl shadow-float max-h-[85vh] flex flex-col mx-4',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function DialogHeader({ children, onClose }) {
  return (
    <div className="px-5 py-4 border-b border-[var(--border-primary)] flex justify-between items-center shrink-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">{children}</div>
      {onClose && (
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close" className="shrink-0 ml-2">
          <X size={14} />
        </Button>
      )}
    </div>
  )
}

export function DialogContent({ className, children }) {
  return (
    <div className={cn('overflow-y-auto flex-1 p-5', className)}>
      {children}
    </div>
  )
}

export function DialogFooter({ className, children }) {
  return (
    <div className={cn('px-5 py-3 border-t border-[var(--border-primary)] flex justify-end gap-2 shrink-0', className)}>
      {children}
    </div>
  )
}
