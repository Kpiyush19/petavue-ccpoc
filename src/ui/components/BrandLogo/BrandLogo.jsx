import './BrandLogo.css';

/*
 * Petavue Brand Logo
 *
 * Props:
 *   variant  — "full" (icon + text) | "icon" (icon only)       default: "full"
 *   mode     — "light" | "dark"                                  default: "light"
 *   size     — "sm" (24px) | "md" (32px) | "lg" (40px)          default: "md"
 *
 * Usage:
 *   <BrandLogo />
 *   <BrandLogo variant="icon" mode="dark" />
 *   <BrandLogo size="lg" mode="dark" />
 */

const SIZE_MAP = {
  sm: { icon: 24, text: 18, lineHeight: 29 },
  md: { icon: 32, text: 20, lineHeight: 32 },
  lg: { icon: 40, text: 24, lineHeight: 36 },
};

function LogoIcon({ size = 32, color = 'var(--color-primary-500, #3661ED)' }) {
  /* Aspect ratio from Figma viewBox: 18 x 24 */
  const width = size * (18 / 24);

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 18 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="brand-logo__icon"
      aria-hidden="true"
    >
      <path
        d="M9 15.0295C12.075 15.0295 14.5678 12.4577 14.5678 9.28525C14.5678 6.11278 12.075 3.54098 9 3.54098C5.92499 3.54098 3.4322 6.11278 3.4322 9.28525V12.0025C3.4322 12.2863 3.30854 12.5549 3.09542 12.7342L0.373431 15.0246C0.22397 15.1504 0 15.0407 0 14.8417V9.28525C0 4.15715 4.02944 0 9 0C13.9706 0 18 4.15715 18 9.28525C18 14.4134 13.9706 18.5705 9 18.5705C8.46267 18.5705 7.93632 18.5219 7.42489 18.4288C7.28983 18.4041 7.15044 18.4392 7.04427 18.5288L0.747333 23.8416C0.448516 24.0937 0 23.8743 0 23.4761V19.9875C0 19.9166 0.0309162 19.8494 0.0841965 19.8046L3.4322 16.9874V17.002L4.87148 15.7877C5.78558 15.0164 6.94633 14.7459 8.02152 14.9417C8.33682 14.9991 8.66357 15.0295 9 15.0295Z"
        fill={color}
      />
    </svg>
  );
}

export function BrandLogo({
  variant = 'full',
  mode = 'light',
  size = 'md',
  className = '',
}) {
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;
  const iconColor = mode === 'dark'
    ? 'var(--color-white, #FFFFFF)'
    : 'var(--color-primary-500, #3661ED)';

  return (
    <span
      className={`brand-logo brand-logo--${mode} brand-logo--${size} ${className}`}
      role="img"
      aria-label="Petavue logo"
    >
      <LogoIcon size={dimensions.icon} color={iconColor} />

      {variant === 'full' && (
        <span
          className="brand-logo__wordmark"
          style={{
            fontSize: dimensions.text + 'px',
            lineHeight: dimensions.lineHeight + 'px',
          }}
        >
          <span className="brand-logo__wordmark-bold">Peta</span>
          <span className="brand-logo__wordmark-regular">vue</span>
        </span>
      )}
    </span>
  );
}
