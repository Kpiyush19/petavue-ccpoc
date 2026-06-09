import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'

  return (
    <button
      onClick={onToggle}
      className="relative flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer
        bg-[var(--bg-hover)] border border-[var(--border-primary)]
        hover:bg-[var(--bg-hover-strong)] transition-all duration-200"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun — shown in dark mode (click to go light) */}
      <Sun
        size={16}
        className="absolute transition-all duration-300 ease-in-out text-[var(--text-secondary)]"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
        }}
      />

      {/* Moon — shown in light mode (click to go dark) */}
      <Moon
        size={16}
        className="absolute transition-all duration-300 ease-in-out text-[var(--text-secondary)]"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
        }}
      />
    </button>
  )
}
