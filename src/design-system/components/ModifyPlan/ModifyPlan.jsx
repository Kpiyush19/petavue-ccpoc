import { useState, useRef, useEffect, useCallback } from 'react';
import {
  PencilSimpleLine,
  CaretUp,
  X,
  ArrowUp,
  CheckCircle,
  DotsThree,
  PencilSimple,
  TrashSimple,
} from '@phosphor-icons/react';
import './ModifyPlan.css';

/**
 * ModifyPlan — collapsible modify input with modification thread.
 *
 * @param {object} props
 * @param {string} props.label - Button label (default "Modify Plan")
 * @param {string} props.placeholder - Textarea placeholder
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.initials - User initials for avatar
 * @param {Array} props.modifications - Array of {id, text} modifications
 * @param {function} props.onAdd - Called with modification text when submitted
 * @param {function} props.onEdit - Called with (id, newText)
 * @param {function} props.onDelete - Called with id
 * @param {string} props.className - External override class
 */
export function ModifyPlan({
  label = 'Modify Plan',
  placeholder = 'Adjust this plan to... (e.g., add a new step, remove a step, change the approach)',
  disabled = false,
  initials = 'AU',
  modifications = [],
  onAdd,
  onEdit,
  onDelete,
  className = '',
  expanded: controlledExpanded,
  onExpandedChange,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;
  const setExpanded = isControlled
    ? (val) => onExpandedChange && onExpandedChange(val)
    : setInternalExpanded;
  const [value, setValue] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef(null);
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const threadRef = useRef(null);

  const hasText = value.trim().length > 0;
  const count = modifications.length;
  const headerLabel = count > 0 ? `${label} (${count})` : label;

  /* Focus textarea when expanded */
  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  /* Close menu on outside click */
  useEffect(() => {
    if (activeMenu === null) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeMenu]);

  /* Scroll thread to bottom when new modification added */
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [modifications.length]);

  const handleSubmit = useCallback(() => {
    if (!hasText || disabled) return;
    onAdd && onAdd(value.trim());
    setValue('');
  }, [value, hasText, disabled, onAdd]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleClose = useCallback(() => {
    setExpanded(false);
    setValue('');
    setActiveMenu(null);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((mod) => {
    setEditingId(mod.id);
    setEditValue(mod.text);
    setActiveMenu(null);
  }, []);

  const handleEditSubmit = useCallback((id) => {
    if (editValue.trim()) {
      onEdit && onEdit(id, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  }, [editValue, onEdit]);

  const handleDelete = useCallback((id) => {
    onDelete && onDelete(id);
    setActiveMenu(null);
  }, [onDelete]);

  if (disabled) {
    return (
      <div className={`modify-plan modify-plan--disabled ${className}`} ref={wrapperRef}>
        <div className="modify-plan__collapsed modify-plan__collapsed--disabled">
          <div className="modify-plan__header">
            <div className="modify-plan__title">
              <PencilSimpleLine size={12} weight="regular" color="var(--color-text-disabled)" />
              <span className="text-body-2-regular modify-plan__label modify-plan__label--disabled">
                {headerLabel}
              </span>
            </div>
            <div className="modify-plan__toggle-icon">
              <CaretUp size={12} weight="regular" color="var(--color-text-disabled)" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modify-plan ${className}`} ref={wrapperRef}>
      {expanded ? (
        <div className="modify-plan__expanded">
          {/* Expanded header */}
          <div className="modify-plan__header modify-plan__header--expanded">
            <div className="modify-plan__title">
              <PencilSimpleLine size={12} weight="regular" color="var(--color-primary-500)" />
              <span className="text-body-2-regular modify-plan__label">
                {headerLabel}
              </span>
            </div>
            <button
              className="modify-plan__close"
              type="button"
              onClick={handleClose}
              aria-label="Close"
            >
              <X size={12} weight="regular" color="var(--color-neutral-600)" />
            </button>
          </div>

          {/* Modification thread */}
          {count > 0 && (
            <div className="modify-plan__thread" ref={threadRef}>
              {modifications.map((mod) => (
                <div key={mod.id} className="modify-plan__mod-item">
                  {editingId === mod.id ? (
                    <div className="modify-plan__edit-row">
                      <input
                        className="modify-plan__edit-input text-body-1-regular"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSubmit(mod.id);
                          if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="modify-plan__msg">
                      <div className="modify-plan__msg-avatar">
                        <span className="modify-plan__msg-avatar-text text-metadata-regular">
                          {initials}
                        </span>
                      </div>
                      <p className="modify-plan__msg-text text-body-1-regular">{mod.text}</p>
                      <div className="modify-plan__msg-actions-wrapper">
                        <button
                          className="modify-plan__msg-menu-btn"
                          type="button"
                          onClick={() => setActiveMenu(activeMenu === mod.id ? null : mod.id)}
                          aria-label="More options"
                        >
                          <DotsThree size={16} weight="bold" color="var(--color-primary-500)" />
                        </button>
                        {activeMenu === mod.id && (
                          <div className="modify-plan__actions-dropdown" ref={menuRef}>
                            <button
                              className="modify-plan__action-item"
                              type="button"
                              onClick={() => handleEdit(mod)}
                            >
                              <PencilSimple size={12} weight="regular" color="var(--color-text-primary)" />
                              <span className="text-body-2-regular">Edit</span>
                            </button>
                            <button
                              className="modify-plan__action-item"
                              type="button"
                              onClick={() => handleDelete(mod.id)}
                            >
                              <TrashSimple size={12} weight="regular" color="var(--color-text-primary)" />
                              <span className="text-body-2-regular">Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {editingId !== mod.id && (
                    <div className="modify-plan__added-status">
                      <CheckCircle size={16} weight="fill" color="var(--color-primary-500)" />
                      <span className="text-body-1-regular modify-plan__added-text">Added</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Textarea area */}
          <div className="modify-plan__body">
            <div className="modify-plan__input-box">
              <textarea
                ref={textareaRef}
                className="modify-plan__textarea text-body-1-regular"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                aria-label="Modify plan input"
              />
              <div className="modify-plan__input-actions">
                <button
                  className={`modify-plan__submit ${hasText ? 'modify-plan__submit--active' : ''}`}
                  type="button"
                  onClick={handleSubmit}
                  disabled={!hasText}
                  aria-label="Submit modification"
                >
                  <ArrowUp
                    size={12}
                    weight="bold"
                    color={hasText ? 'var(--color-white)' : 'var(--color-neutral-300)'}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="modify-plan__collapsed"
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Expand modify plan"
        >
          <div className="modify-plan__header">
            <div className="modify-plan__title">
              <PencilSimpleLine size={12} weight="regular" color="var(--color-primary-500)" />
              <span className="text-body-2-regular modify-plan__label">
                {headerLabel}
              </span>
            </div>
            <div className="modify-plan__toggle-icon">
              <CaretUp size={12} weight="regular" color="var(--color-primary-500)" />
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
