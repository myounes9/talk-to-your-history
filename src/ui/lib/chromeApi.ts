import { SearchResult, DBStats, Settings, Folder, SavedItem } from '@/types/models';

export async function sendMessage<T>(message: any): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      
      resolve(response as T);
    });
  });
}

export async function searchQuery(query: string): Promise<SearchResult[]> {
  const response = await sendMessage<{ results: SearchResult[]; error?: string }>({
    type: 'SEARCH_QUERY',
    query,
  });
  return response.results || [];
}

export async function getStats(): Promise<DBStats> {
  const response = await sendMessage<{ stats: DBStats }>({
    type: 'GET_STATS',
  });
  return response.stats;
}

export async function eraseAllData(): Promise<void> {
  await sendMessage({ type: 'ERASE_ALL_DATA' });
}

export async function seedTestData(): Promise<void> {
  await sendMessage({ type: 'SEED_TEST_DATA' });
}

export async function triggerScan(): Promise<void> {
  await sendMessage({ type: 'TRIGGER_SCAN' });
}

export async function getSettings(): Promise<Settings> {
  const response = await sendMessage<{ settings: Settings }>({
    type: 'GET_SETTINGS',
  });
  return response.settings;
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  await sendMessage({
    type: 'UPDATE_SETTINGS',
    settings,
  });
}

// ===== Saved Items API =====

export async function saveItem(
  folderId: string,
  url: string,
  title: string,
  summary?: string,
  sourceType: 'search' | 'current-tab' = 'search'
): Promise<SavedItem> {
  const response = await sendMessage<{ success: boolean; item: SavedItem }>({
    type: 'SAVE_ITEM',
    folderId,
    url,
    title,
    summary,
    sourceType,
  });
  return response.item;
}

export async function getFolders(): Promise<Folder[]> {
  const response = await sendMessage<{ folders: Folder[] }>({
    type: 'GET_FOLDERS',
  });
  return response.folders || [];
}

export async function createFolder(name: string): Promise<Folder> {
  const response = await sendMessage<{ success: boolean; folder: Folder }>({
    type: 'CREATE_FOLDER',
    name,
  });
  return response.folder;
}

export async function renameFolder(folderId: string, newName: string): Promise<void> {
  await sendMessage({
    type: 'RENAME_FOLDER',
    folderId,
    newName,
  });
}

export async function deleteFolder(folderId: string): Promise<void> {
  await sendMessage({
    type: 'DELETE_FOLDER',
    folderId,
  });
}

export async function getSavedItems(folderId: string): Promise<SavedItem[]> {
  const response = await sendMessage<{ items: SavedItem[] }>({
    type: 'GET_SAVED_ITEMS',
    folderId,
  });
  return response.items || [];
}

export async function deleteSavedItem(itemId: string): Promise<void> {
  await sendMessage({
    type: 'DELETE_SAVED_ITEM',
    itemId,
  });
}

