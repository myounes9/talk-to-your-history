
interface EmptyStateProps {
  hasSearched: boolean;
}

export function EmptyState({ hasSearched }: EmptyStateProps) {
  if (hasSearched) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">No results found</h3>
        <p className="text-muted text-sm mb-4">
          Try a different search query or check if indexing is enabled in settings.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-4">🧠</div>
      <h3 className="text-xl font-semibold mb-2">Talk To Your History</h3>
      <p className="text-muted text-sm mb-6">
        Search your browsing history using natural language.
      </p>
      <div className="text-left max-w-md mx-auto space-y-2">
        <p className="text-sm text-muted">
          <strong>Try asking:</strong>
        </p>
        <ul className="text-sm text-muted space-y-1 list-disc list-inside">
          <li>"Two weeks ago I viewed a SaaS for content planning"</li>
          <li>"That article about AI pricing models"</li>
          <li>"The FAQ page I saw yesterday"</li>
        </ul>
      </div>
    </div>
  );
}

