import { useState } from 'react';
import { useSavedStore } from '../store/savedStore';

interface SaveButtonProps {
  url: string;
  title: string;
  summary?: string;
  sourceType?: 'search' | 'current-tab';
  onSaved?: () => void;
}

export function SaveButton({ url, title, summary, sourceType = 'search', onSaved }: SaveButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const { folders, saveItem, createFolder } = useSavedStore();

  const handleSaveToFolder = async (folderId: string) => {
    try {
      await saveItem(folderId, url, title, summary, sourceType);
      setShowModal(false);
      onSaved?.();
    } catch (error) {
      console.error('Failed to save item', error);
      alert('Failed to save item. Please try again.');
    }
  };

  const handleCreateAndSave = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    setIsCreatingFolder(true);
    try {
      const folder = await createFolder(newFolderName.trim());
      await handleSaveToFolder(folder.id);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder', error);
      alert('Failed to create folder. Please try again.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn btn-secondary text-sm">
        Save
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-slate-800 rounded-lg p-6 w-96 max-w-[90%] max-h-[80%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Save to Folder</h3>

            {folders.length > 0 ? (
              <div className="space-y-2 mb-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleSaveToFolder(folder.id)}
                    className="w-full text-left px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                  >
                    <div className="font-medium">{folder.name}</div>
                    <div className="text-xs text-muted">
                      {folder.itemCount} {folder.itemCount === 1 ? 'item' : 'items'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm mb-4">No folders yet. Create one below.</p>
            )}

            <div className="border-t border-gray-700 pt-4">
              <label className="text-sm font-medium block mb-2">Create New Folder</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateAndSave()}
                  placeholder="Folder name"
                  className="flex-1 px-3 py-2 bg-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleCreateAndSave}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="btn btn-primary text-sm"
                >
                  {isCreatingFolder ? 'Creating...' : 'Create & Save'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full btn btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

