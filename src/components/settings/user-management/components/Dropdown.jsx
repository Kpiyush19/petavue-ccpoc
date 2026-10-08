import { CaretDown } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';

const Dropdown = ({ title, options, onSelect }) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[var(--color-primary-500)] text-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-50)]" />
      }
    >
      {title}
      <CaretDown size={12} />
    </DropdownMenuTrigger>
    <DropdownMenuContent className="min-w-32">
      {options.map((option, index) => (
        <DropdownMenuItem key={index} onClick={() => onSelect(option)}>
          {option}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default Dropdown;
