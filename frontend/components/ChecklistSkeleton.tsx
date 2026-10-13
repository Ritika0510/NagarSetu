export function ChecklistSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading checklist">
      <div className="rounded-xl border bg-card p-6">
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted" />
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-5 h-2 w-full animate-pulse rounded-full bg-muted" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}