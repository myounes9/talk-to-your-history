import { SearchResult } from '@/types/models';
import { formatRelativeTime } from '@/utils/time';
import { extractDomain } from '@/utils/text';
import { SaveButton } from './SaveButton';

interface ResultCardProps {
  result: SearchResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const domain = extractDomain(result.url);

  const handleOpen = () => {
    chrome.tabs.create({ url: result.url });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.url);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy URL', error);
    }
  };

  return (
    <div className="card hover:bg-slate-700 transition-colors duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-foreground flex-1">{result.title}</h3>
        <span className="text-xs text-muted ml-2">#{result.rank}</span>
      </div>
      
      <div className="text-sm text-muted mb-2">
        <span>{domain}</span>
        <span className="mx-2">•</span>
        <span>{formatRelativeTime(result.lastVisit)}</span>
        {result.visitCount > 1 && (
          <>
            <span className="mx-2">•</span>
            <span>{result.visitCount} visits</span>
          </>
        )}
      </div>
      
      {result.memoryCard && (
        <div className="mb-3">
          <p className="text-sm text-foreground/90">{result.memoryCard}</p>
        </div>
      )}
      
      {result.tags && result.tags.length > 0 && (
        <div className="flex flex-wrap mb-3">
          {result.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="text-xs text-muted mb-3 italic">
        {result.matchReason}
      </div>
      
      <div className="flex gap-2">
        <button onClick={handleOpen} className="btn btn-primary text-sm flex-1">
          Open
        </button>
        <button onClick={handleCopy} className="btn btn-secondary text-sm">
          Copy URL
        </button>
        <SaveButton
          url={result.url}
          title={result.title}
          summary={result.memoryCard}
          sourceType="search"
        />
      </div>
    </div>
  );
}

