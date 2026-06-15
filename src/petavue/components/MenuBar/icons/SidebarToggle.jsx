/* SidebarSimple icon — collapse/expand toggle */
export function SidebarToggle({ size = 20, color = 'var(--color-neutral-500, #757A97)' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="3.75"
        width="15"
        height="12.5"
        rx="1.5"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="7.5"
        y1="3.75"
        x2="7.5"
        y2="16.25"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
