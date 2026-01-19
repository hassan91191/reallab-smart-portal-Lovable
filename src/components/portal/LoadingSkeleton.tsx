export function LoadingSkeleton() {
  return (
    <div className="flex-1 p-4 md:p-6">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg skeleton-pulse" />
          <div>
            <div className="h-5 w-32 skeleton-pulse rounded mb-1" />
            <div className="h-4 w-20 skeleton-pulse rounded" />
          </div>
        </div>
        <div className="w-full sm:w-72 h-10 skeleton-pulse rounded-lg" />
      </div>

      {/* File cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl skeleton-pulse" />
              <div className="flex-1">
                <div className="h-5 w-3/4 skeleton-pulse rounded mb-2" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 skeleton-pulse rounded" />
                  <div className="h-5 w-16 skeleton-pulse rounded" />
                </div>
              </div>
              <div className="h-9 w-16 skeleton-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
