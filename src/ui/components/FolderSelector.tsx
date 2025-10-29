import { useState } from 'react';
import { useSavedStore } from '../store/savedStore';

export function FolderSelector() {
  const { folders, activeFolder, setActiveFolder, renameFolder, deleteFolder, createFolder } = useSavedStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleRename = async () => {
    if (!activeFolder || !newName.trim()) return;

    try {
      await renameFolder(activeFolder.id, newName.trim());
      setIsRenaming(false);
      setNewName('');
    } catch (error) {
      console.error('Failed to rename folder', error);
      alert('Failed to rename folder. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!activeFolder) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${activeFolder.name}"? This will also delete all saved items in this folder.`
    );

    if (confirmed) {
      try {
        await deleteFolder(activeFolder.id);
      } catch (error) {
        console.error('Failed to delete folder', error);
        alert('Failed to delete folder. Please try again.');
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    try {
      const folder = await createFolder(newFolderName.trim());
      setActiveFolder(folder);
      setNewFolderName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create folder', error);
      alert('Failed to create folder. Please try again.');
    }
  };

  if (folders.length === 0 && !isCreating) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted text-sm mb-3">No folders yet</p>
        <button onClick={() => setIsCreating(true)} className="btn btn-primary text-sm">
          Create First Folder
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-800">
      {isCreating ? (
        <div className="space-y-2">
          <label className="text-sm font-medium block">New Folder Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="Enter folder name"
              className="flex-1 px-3 py-2 bg-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={handleCreateFolder} className="btn btn-primary text-sm">
              Create
            </button>
            <button onClick={() => setIsCreating(false)} className="btn btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : isRenaming && activeFolder ? (
        <div className="space-y-2">
          <label className="text-sm font-medium block">Rename Folder</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              placeholder={activeFolder.name}
              className="flex-1 px-3 py-2 bg-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={handleRename} className="btn btn-primary text-sm">
              Save
            </button>
            <button
              onClick={() => {
                setIsRenaming(false);
                setNewName('');
              }}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={activeFolder?.id || ''}
              onChange={(e) => {
                const folder = folders.find((f) => f.id === e.target.value);
                setActiveFolder(folder || null);
              }}
              className="w-full px-3 py-2 bg-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name} ({folder.itemCount})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
              ▼
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn btn-secondary text-sm px-3"
              title="Folder actions"
            >
              ⋮
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded shadow-lg z-20 min-w-[150px]">
                  <button
                    onClick={() => {
                      setIsCreating(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-600 rounded-t"
                  >
                    New Folder
                  </button>
                  {activeFolder && (
                    <>
                      <button
                        onClick={() => {
                          setIsRenaming(true);
                          setNewName(activeFolder.name);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-600"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-600 text-red-400 rounded-b"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

