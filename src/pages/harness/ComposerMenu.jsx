/* A choice that sits under the composer, such as what the chat should make.
   A quiet pill showing the current value; the list opens below it, styled as
   the product's workbook dropdown (WorkbookHome.css).
   option: { id, label, description?, icon?, badge?, disabled? } */
import { useEffect, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import "./composerMenu.css";

export default function ComposerMenu({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.id === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="composer-menu" ref={ref}>
      <button
        type="button"
        className={`composer-menu__button${open ? " composer-menu__button--open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {current.icon && <current.icon size={14} className="composer-menu__glyph" />}
        <span className="composer-menu__label">{label}</span>
        <span className="composer-menu__value">{current.label}</span>
        <CaretDown size={12} />
      </button>

      {open && (
        <ul className="composer-menu__list" role="listbox" aria-label={label}>
          {options.map((o) => {
            const Icon = o.icon;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.id === value}
                  disabled={o.disabled}
                  className="composer-menu__option"
                  onClick={() => { onChange(o.id); setOpen(false); }}
                >
                  {Icon && <Icon size={13} className="composer-menu__icon" />}
                  <span className="composer-menu__text">
                    <span className={`text-body-2-medium composer-menu__name${o.id === value ? " composer-menu__name--selected" : ""}`}>
                      {o.label}
                      {o.badge && <span className="composer-menu__badge">{o.badge}</span>}
                    </span>
                    {o.description && <span className="text-metadata-regular composer-menu__description">{o.description}</span>}
                  </span>
                  {o.id === value && <Check size={12} className="composer-menu__check" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
