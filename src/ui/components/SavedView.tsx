import { useEffect } from 'react';
import { useSavedStore } from '../store/savedStore';
import { FolderSelector } from './FolderSelector';
import { SavedItemCard } from './SavedItemCard';
import { SkeletonLoader } from './SkeletonLoader';

export function SavedView() {
  const { folders, savedItems, activeFolder, isLoading, loadFolders } = useSavedStore();

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  if (isLoading && folders.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="h-10 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <FolderSelector />

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && savedItems.length === 0 ? (
          <SkeletonLoader />
        ) : savedItems.length > 0 ? (
          <div className="space-y-3">
            {savedItems.map((item) => (
              <SavedItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : activeFolder ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📂</div>
            <h3 className="text-lg font-semibold mb-2">No saved items yet</h3>
            <p className="text-muted text-sm">
              Items you save will appear here
            </p>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2">No folders yet</h3>
            <p className="text-muted text-sm">
              Create a folder to start saving items
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

