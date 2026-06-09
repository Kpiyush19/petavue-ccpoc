import { cn } from '../utils/cn'

export default function StatusDot({ connectionStatus, isThinking, isCompacting }) {
  return (
    <span
      className={cn(
        'w-2 h-2 rounded-full inline-block',
        isCompacting && 'bg-[var(--status-warning)] animate-pulse',
        !isCompacting && isThinking && 'bg-[var(--status-warning)] animate-thinking',
        !isCompacting && !isThinking && connectionStatus === 'connected' && 'bg-[var(--status-success)]',
        !isCompacting && !isThinking && connectionStatus !== 'connected' && 'bg-[var(--status-disconnected)]'
      )}
    />
  )
}
