/* The one dropdown for the product. Added with
   `shadcn add @reui/c-dropdown-menu-3` (Base UI menu), then set in Petavue
   colours: a white panel, primary-50 on hover, primary text. */
import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "@/utils/cn"
import { CaretRight as CaretRightIcon, Check as CheckIcon } from "@phosphor-icons/react"

function DropdownMenu({
  ...props
}) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-[2000] outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}>
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "max-h-(--available-height) min-w-(--anchor-width) w-max max-w-[min(360px,92vw)] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg border border-solid border-[var(--color-grey-200)] bg-white p-1.5 font-[family-name:var(--font-family-primary)] text-[var(--color-text-primary)] shadow-[0_8px_24px_rgba(31,33,46,0.12)] outline-none transition-[opacity,transform] duration-100 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
            className
          )}
          {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-grey-500)] data-inset:pl-8",
        className
      )}
      {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[14px] leading-[20px] text-[var(--color-text-primary)] outline-hidden select-none focus:bg-[var(--color-primary-50)] data-[highlighted]:bg-[var(--color-primary-50)] data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[variant=destructive]:text-[var(--color-error-500,#f93d3d)] data-[variant=destructive]:focus:bg-[#fef2f2] data-[variant=destructive]:data-[highlighted]:bg-[#fef2f2]",
        className
      )}
      {...props} />
  );
}

function DropdownMenuSub({
  ...props
}) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[14px] leading-[20px] text-[var(--color-text-primary)] outline-hidden select-none focus:bg-[var(--color-primary-50)] data-[highlighted]:bg-[var(--color-primary-50)] data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-popup-open:bg-[var(--color-primary-50)]",
        className
      )}
      {...props}>
      {children}
      <CaretRightIcon size={14} className="ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "w-auto min-w-[96px]",
        className
      )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props} />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[14px] leading-[20px] text-[var(--color-text-primary)] outline-hidden select-none focus:bg-[var(--color-primary-50)] data-[highlighted]:bg-[var(--color-primary-50)] data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 pr-9",
        className
      )}
      checked={checked}
      {...props}>
      <span
        className="pointer-events-none absolute right-2.5 top-2.5 flex items-center justify-center text-[var(--color-primary-500)]"
        data-slot="dropdown-menu-checkbox-item-indicator">
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon size={16} weight="bold" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}) {
  return (<MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />);
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[14px] leading-[20px] text-[var(--color-text-primary)] outline-hidden select-none focus:bg-[var(--color-primary-50)] data-[highlighted]:bg-[var(--color-primary-50)] data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 pr-9",
        className
      )}
      {...props}>
      <span
        className="pointer-events-none absolute right-2.5 top-2.5 flex items-center justify-center text-[var(--color-primary-500)]"
        data-slot="dropdown-menu-radio-item-indicator">
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon size={16} weight="bold" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1.5 my-1.5 h-px bg-[var(--color-grey-100)]", className)}
      {...props} />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-[12px] text-[var(--color-grey-500)]",
        className
      )}
      {...props} />
  );
}

/* A second line under an item's label. */
function DropdownMenuDescription({ className, ...props }) {
  return (
    <span
      data-slot="dropdown-menu-description"
      className={cn("text-[12px] leading-[18px] text-[var(--color-grey-500)]", className)}
      {...props} />
  );
}

export {
  DropdownMenuDescription,
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
