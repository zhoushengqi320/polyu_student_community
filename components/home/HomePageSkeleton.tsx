export function HomePageSkeleton() {
  return (
    <div className="animate-pulse">
      <section className="border-b bg-muted/20">
        <div className="container space-y-6 py-14 md:py-20">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-12 w-72 max-w-full rounded bg-muted" />
          <div className="h-6 w-96 max-w-full rounded bg-muted" />
          <div className="h-11 w-full max-w-2xl rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-10 w-32 rounded bg-muted" />
            <div className="h-10 w-32 rounded bg-muted" />
          </div>
        </div>
      </section>

      <div className="container space-y-12 py-12 md:py-16">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <div key={cardIndex} className="h-44 rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
