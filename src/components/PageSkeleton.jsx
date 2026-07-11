import { Skeleton } from "@/ui";

/**
 * Generic page loading skeleton — a header, a row of cards, and list rows.
 * Used as the page-navigation Suspense fallback (replaces the petavue splash
 * spinner) so opening a page shows content-shaped placeholders.
 */
export default function PageSkeleton() {
  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col gap-6 p-6 bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <Skeleton width={220} height={26} className="rounded-lg" />
        <Skeleton width={120} height={36} className="rounded-lg" />
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]"
          >
            <Skeleton width={100} height={12} className="rounded" />
            <Skeleton width="55%" height={26} className="rounded" />
            <Skeleton width="100%" height={44} className="rounded-lg" />
          </div>
        ))}
      </div>

      {/* List rows */}
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)]"
          >
            <Skeleton variant="circular" width={34} height={34} />
            <Skeleton width="28%" height={14} className="rounded" />
            <Skeleton width="18%" height={14} className="rounded" />
            <div className="ml-auto">
              <Skeleton width={80} height={14} className="rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
