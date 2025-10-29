import type { DBStats } from '@/types/models';
import { formatRelativeTime } from '@/utils/time';

interface StatsCardProps {
  stats: DBStats | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function StatsCard({ stats, isLoading, onRefresh }: StatsCardProps) {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-skeleton">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <p className="text-muted">Failed to load stats</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Database Statistics</h3>
        <button onClick={onRefresh} className="btn btn-secondary text-sm">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold text-primary">{stats.totalPages}</div>
          <div className="text-sm text-muted">Total Pages</div>
        </div>

        <div>
          <div className="text-2xl font-bold text-green-500">{stats.summarizedPages}</div>
          <div className="text-sm text-muted">Summarized</div>
        </div>

        <div>
          <div className="text-2xl font-bold text-yellow-500">{stats.queuedPages}</div>
          <div className="text-sm text-muted">Queued</div>
        </div>

        <div>
          <div className="text-2xl font-bold text-red-500">{stats.failedPages}</div>
          <div className="text-sm text-muted">Failed</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Database Size:</span>
          <span>{formatSize(stats.estimatedSize)}</span>
        </div>

        {stats.lastScanTime && (
          <div className="flex justify-between">
            <span className="text-muted">Last Scan:</span>
            <span>{formatRelativeTime(stats.lastScanTime)}</span>
          </div>
        )}

        {stats.oldestRecord && (
          <div className="flex justify-between">
            <span className="text-muted">Oldest Record:</span>
            <span>{formatRelativeTime(stats.oldestRecord)}</span>
          </div>
        )}

        {stats.newestRecord && (
          <div className="flex justify-between">
            <span className="text-muted">Newest Record:</span>
            <span>{formatRelativeTime(stats.newestRecord)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

