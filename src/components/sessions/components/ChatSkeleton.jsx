import { Skeleton } from "@/common-components";

function UserMessageSkeleton({ width = 200 }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <Skeleton width={width} height={44} className="rounded-[16px_16px_6px_16px]" />
      <Skeleton width={52} height={14} className="rounded mt-1" />
    </div>
  );
}

function AssistantMessageSkeleton({ lines = [320, 280, 200] }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 shrink-0 mt-0.5 flex items-center justify-center">
        <Skeleton width={20} height={20} className="rounded-md" />
      </div>
      <div className="flex flex-col gap-2 flex-1 max-w-[90%]">
        {lines.map((w, i) => (
          <Skeleton key={i} width={w} height={16} className="rounded" />
        ))}
      </div>
    </div>
  );
}

function ToolCallSkeleton({ toolCount = 2 }) {
  return (
    <div className="ml-9">
      <div className="border border-[var(--pv-neutral-grey-200)] rounded-md overflow-hidden">
        <div className="flex items-center gap-2 p-2.5 bg-white">
          <Skeleton width={16} height={16} className="rounded shrink-0" />
          <Skeleton width={100} height={12} className="rounded" />
          <div className="ml-auto">
            <Skeleton width={28} height={16} className="rounded-md" />
          </div>
        </div>
        <div className="border-t border-[var(--pv-neutral-grey-200)] p-3 flex flex-col gap-2">
          {Array.from({ length: toolCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton width={14} height={14} className="rounded shrink-0" />
              <Skeleton width={80 + i * 30} height={12} className="rounded" />
              <div className="ml-auto">
                <Skeleton width={40} height={10} className="rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimestampSkeleton() {
  return (
    <div className="ml-9 mt-3">
      <Skeleton width={64} height={24} className="rounded" />
    </div>
  );
}

export default function ChatSkeleton({ showHeader = false }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {showHeader && (
        <div className="h-[58px] border-b border-[var(--pv-neutral-grey-200)] flex items-center px-4 gap-3 shrink-0">
          <Skeleton width={24} height={24} className="rounded" />
          <Skeleton width={180} height={18} className="rounded" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton width={100} height={24} className="rounded-full" />
            <Skeleton width={32} height={32} className="rounded-lg" />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <div className="w-full max-w-[816px] mx-auto px-6 py-7 flex flex-col gap-5">
          <UserMessageSkeleton width={240} />
          <AssistantMessageSkeleton lines={[420, 380, 320, 180]} />
          {/* <TimestampSkeleton /> */}

          <UserMessageSkeleton width={320} />
          {/* <ToolCallSkeleton toolCount={3} /> */}
          <AssistantMessageSkeleton lines={[400, 340, 260]} />
          {/* <TimestampSkeleton /> */}

          <UserMessageSkeleton width={200} />
          <AssistantMessageSkeleton lines={[460, 400, 360, 280, 160]} />
        </div>
      </div>
    </div>
  );
}
