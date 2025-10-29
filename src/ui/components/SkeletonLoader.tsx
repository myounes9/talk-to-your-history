
export function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {/* AI Processing Message */}
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin">🔄</div>
          <div>
            <div className="font-medium text-blue-300">Using AI to understand your query...</div>
            <div className="text-sm text-blue-400/70 mt-1">
              Expanding search terms → Searching history → Ranking results
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton Cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="card animate-skeleton">
          <div className="h-6 bg-slate-700 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6 mb-3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-slate-700 rounded flex-1"></div>
            <div className="h-8 bg-slate-700 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

