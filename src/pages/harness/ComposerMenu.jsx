/* A choice that sits under the composer, such as what the chat should make.
   The trigger is the product Button, so icon, label and value share one colour;
   the list is the product dropdown (components/shadcn/dropdown-menu).
   option: { id, label, description?, icon?, badge?, disabled? } */
import { CaretDown, Check } from "@phosphor-icons/react";
import { Button } from "@/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuDescription,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import "./composerMenu.css";

export default function ComposerMenu({ label, value, options, onChange, variant = "secondaryGhost", align = "start" }) {
  const current = options.find((o) => o.id === value) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant={variant} size="md" className="composer-menu__button" />}>
        {current.icon && <current.icon size={16} />}
        <span>{label}</span>
        <span className="composer-menu__value">{current.label}</span>
        <CaretDown size={14} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} sideOffset={6} aria-label={label} className="composer-menu__list">
        {options.map((o) => {
          const Icon = o.icon;
          const selected = o.id === value;
          return (
            <DropdownMenuItem
              key={o.id}
              disabled={o.disabled}
              aria-current={selected || undefined}
              className={o.description ? "items-start" : undefined}
              onClick={() => onChange(o.id)}
            >
              {Icon && <Icon size={16} className={o.description ? "mt-0.5" : undefined} />}
              <span className="composer-menu__text">
                <span className="composer-menu__name">
                  {o.label}
                  {o.badge && <span className="composer-menu__badge">{o.badge}</span>}
                </span>
                {o.description && <DropdownMenuDescription>{o.description}</DropdownMenuDescription>}
              </span>
              {selected && <Check size={16} weight="bold" className="composer-menu__check" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
