export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="加载管理后台">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full max-w-3xl animate-pulse rounded-md bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border bg-muted/60"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border bg-muted/40" />
    </div>
  );
}
