import { Skeleton } from "@/ui";

/**
 * Page-navigation loading skeleton (Suspense fallback — replaces the petavue
 * splash spinner). Each variant is shaped like the real page beneath it:
 *   - "list"    → header + stacked list rows (Dashboards / Sessions / Workflows)
 *   - "grid"    → toolbar + 3-col card grid (Skills library)
 *   - "goals"   → insight-card row + a section of rows (Goals)
 *   - "default" → generic header + cards + rows (everything else)
 */

function HeaderBar() {
  return (
    <div className="flex items-center justify-between shrink-0">
      <div className="flex flex-col gap-2">
        <Skeleton width={200} height={22} className="rounded-lg" />
        <Skeleton width={300} height={12} className="rounded" />
      </div>
      <Skeleton width={120} height={36} className="rounded-lg" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col gap-5 p-6 bg-[var(--bg-primary)]">
      <HeaderBar />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]"
          >
            <Skeleton variant="circular" width={32} height={32} />
            <div className="flex flex-col gap-2">
              <Skeleton width={220} height={14} className="rounded" />
              <Skeleton width={140} height={10} className="rounded" />
            </div>
            <div className="ml-auto flex items-center gap-6">
              <Skeleton width={80} height={12} className="rounded" />
              <Skeleton width={64} height={28} className="rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col p-4 bg-[var(--bg-primary)]">
      <div className="flex flex-col bg-white rounded-xl h-full w-full overflow-hidden border border-[var(--border-primary)]">
        {/* Toolbar — title + count, search, filter/view toggles */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)] shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton width={90} height={20} className="rounded" />
            <Skeleton width={28} height={20} className="rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width={280} height={32} className="rounded-lg" />
            <Skeleton width={120} height={32} className="rounded-lg" />
            <Skeleton width={64} height={32} className="rounded-lg" />
          </div>
        </div>
        {/* Card grid */}
        <div className="grid grid-cols-3 gap-6 p-4 overflow-hidden">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 p-5 bg-white border border-[var(--border-primary)] rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton width={120} height={14} className="rounded" />
              </div>
              <Skeleton width="100%" height={10} className="rounded" />
              <Skeleton width="85%" height={10} className="rounded" />
              <div className="flex items-center gap-2 mt-2">
                <Skeleton width={56} height={20} className="rounded-full" />
                <Skeleton width={56} height={20} className="rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col gap-5 p-6 bg-[var(--bg-primary)]">
      <HeaderBar />
      {/* Insight cards — color-coded top-border tiles */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 px-4 py-3.5 bg-white border border-[var(--border-primary)] border-t-2 border-t-[var(--color-grey-200)] rounded-lg"
          >
            <Skeleton width={90} height={10} className="rounded" />
            <Skeleton width="60%" height={24} className="rounded" />
            <Skeleton width="100%" height={10} className="rounded" />
          </div>
        ))}
      </div>
      {/* Section — header + rows */}
      <div className="bg-white border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border-primary)]">
          <Skeleton width={140} height={14} className="rounded" />
          <Skeleton width={24} height={16} className="rounded-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-5 py-3 border-t border-[var(--border-primary)] first:border-t-0"
          >
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton width={220} height={12} className="rounded" />
            <div className="ml-auto flex items-center gap-4">
              <Skeleton width={100} height={10} className="rounded" />
              <Skeleton width={64} height={12} className="rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col gap-6 p-6 bg-[var(--bg-primary)]">
      <div className="flex items-center justify-between shrink-0">
        <Skeleton width={220} height={26} className="rounded-lg" />
        <Skeleton width={120} height={36} className="rounded-lg" />
      </div>
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

export default function PageSkeleton({ variant = "default" }) {
  if (variant === "none") return null;
  if (variant === "list") return <ListSkeleton />;
  if (variant === "grid") return <GridSkeleton />;
  if (variant === "goals") return <GoalsSkeleton />;
  return <DefaultSkeleton />;
}
