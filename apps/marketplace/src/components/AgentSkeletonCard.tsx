// Skeleton placeholder that mirrors AgentCard layout — shown while agents load.

export function AgentSkeletonCard(): React.ReactElement {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex flex-col gap-4 animate-pulse">
      {/* Avatar + name row */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-3/4 rounded-full bg-slate-200" />
          <div className="h-2.5 w-1/2 rounded-full bg-slate-100" />
          <div className="h-2.5 w-1/3 rounded-full bg-slate-100" />
        </div>
      </div>

      {/* Badge row */}
      <div className="h-6 w-28 rounded-full bg-slate-100" />

      {/* Contact pills */}
      <div className="flex gap-2">
        <div className="h-7 w-16 rounded-full bg-slate-100" />
        <div className="h-7 w-14 rounded-full bg-slate-100" />
        <div className="h-7 w-20 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}
