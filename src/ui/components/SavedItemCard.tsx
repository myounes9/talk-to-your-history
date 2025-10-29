import { SavedItem } from '@/types/models';
import { formatRelativeTime } from '@/utils/time';
import { extractDomain } from '@/utils/text';
import { useSavedStore } from '../store/savedStore';

interface SavedItemCardProps {
  item: SavedItem;
}

export function SavedItemCard({ item }: SavedItemCardProps) {
  const { deleteSavedItem } = useSavedStore();
  const domain = extractDomain(item.url);

  const handleOpen = () => {
    chrome.tabs.create({ url: item.url });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
    } catch (error) {
      console.error('Failed to copy URL', error);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(`Delete "${item.title}"?`);
    if (confirmed) {
      try {
        await deleteSavedItem(item.id);
      } catch (error) {
        console.error('Failed to delete item', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  return (
    <div className="card hover:bg-slate-700 transition-colors duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-foreground flex-1">{item.title}</h3>
        <span className="text-xs text-muted ml-2 capitalize">
          {item.sourceType === 'current-tab' ? '📑' : '🔍'}
        </span>
      </div>

      <div className="text-sm text-muted mb-2">
        <span>{domain}</span>
        <span className="mx-2">•</span>
        <span>Saved {formatRelativeTime(item.savedAt)}</span>
      </div>

      {item.summary && (
        <div className="mb-3">
          <p className="text-sm text-foreground/90">{item.summary}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleOpen} className="btn btn-primary text-sm flex-1">
          Open
        </button>
        <button onClick={handleCopy} className="btn btn-secondary text-sm">
          Copy URL
        </button>
        <button onClick={handleDelete} className="btn btn-secondary text-sm text-red-400">
          Delete
        </button>
      </div>
    </div>
  );
}

