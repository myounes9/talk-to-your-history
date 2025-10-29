import { openDB, IDBPDatabase } from 'idb';
import { PageRecord, SearchQuery, DBStats, Folder, SavedItem } from '@/types/models';
import { logger } from '@/utils/log';
import { getTimeWindowBounds } from '@/utils/time';

const DB_NAME = 'tthy';
const DB_VERSION = 2;
const STORE_NAME = 'pages';
const FOLDERS_STORE = 'folders';
const SAVED_ITEMS_STORE = 'saved_items';

let dbInstance: IDBPDatabase | null = null;

export async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Create pages store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('lastVisit', 'lastVisit', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('url', 'url', { unique: false });
          logger.info('Database initialized with object store and indexes');
        }

        // Create folders store in version 2
        if (oldVersion < 2 && !db.objectStoreNames.contains(FOLDERS_STORE)) {
          const foldersStore = db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
          foldersStore.createIndex('name', 'name', { unique: false });
          logger.info('Folders store created');
        }

        // Create saved_items store in version 2
        if (oldVersion < 2 && !db.objectStoreNames.contains(SAVED_ITEMS_STORE)) {
          const savedItemsStore = db.createObjectStore(SAVED_ITEMS_STORE, { keyPath: 'id' });
          savedItemsStore.createIndex('folderId', 'folderId', { unique: false });
          logger.info('Saved items store created');
        }
      },
    });
    return dbInstance;
  } catch (error) {
    logger.error('Failed to initialize database', error);
    throw error;
  }
}

export async function putPage(page: PageRecord): Promise<void> {
  const db = await initDB();
  try {
    await db.put(STORE_NAME, page);
    logger.debug(`Saved page: ${page.title} (${page.status})`);
  } catch (error) {
    logger.error('Failed to save page', error);
    throw error;
  }
}

export async function getPage(id: string): Promise<PageRecord | undefined> {
  const db = await initDB();
  try {
    return await db.get(STORE_NAME, id);
  } catch (error) {
    logger.error('Failed to get page', error);
    throw error;
  }
}

export async function listRecent(limit: number = 100): Promise<PageRecord[]> {
  const db = await initDB();
  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.store.index('lastVisit');
    let cursor = await index.openCursor(null, 'prev');
    const results: PageRecord[] = [];

    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    return results;
  } catch (error) {
    logger.error('Failed to list recent pages', error);
    throw error;
  }
}

export async function listByStatus(
  status: string,
  limit: number = 100
): Promise<PageRecord[]> {
  const db = await initDB();
  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.store.index('status');
    const results = await index.getAll(status, limit);
    return results;
  } catch (error) {
    logger.error('Failed to list pages by status', error);
    throw error;
  }
}

export async function searchPages(query: SearchQuery): Promise<PageRecord[]> {
  const db = await initDB();
  try {
    const { start, end } = getTimeWindowBounds(query.timeWindow);
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.store.index('lastVisit');
    const range = IDBKeyRange.bound(start, end);
    let cursor = await index.openCursor(range, 'prev');
    const results: PageRecord[] = [];

    while (cursor) {
      const page = cursor.value;
      
      // Filter by status (only summarized pages)
      if (page.status === 'summarized') {
        // Apply keyword filters if present
        if (query.mustKeywords.length > 0) {
          const searchText = `${page.title} ${page.memoryCard || page.summary || ''}`.toLowerCase();
          const hasAllKeywords = query.mustKeywords.every((kw) =>
            searchText.includes(kw.toLowerCase())
          );
          if (hasAllKeywords) {
            results.push(page);
          }
        } else {
          results.push(page);
        }
      }
      
      cursor = await cursor.continue();
      
      // Limit results to 50 for performance
      if (results.length >= 50) break;
    }

    return results;
  } catch (error) {
    logger.error('Failed to search pages', error);
    throw error;
  }
}

export async function clearAll(): Promise<void> {
  const db = await initDB();
  try {
    await db.clear(STORE_NAME);
    logger.info('All pages cleared from database');
  } catch (error) {
    logger.error('Failed to clear database', error);
    throw error;
  }
}

export async function getStats(): Promise<DBStats> {
  const db = await initDB();
  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.store;
    const allPages = await store.getAll();

    const stats: DBStats = {
      totalPages: allPages.length,
      queuedPages: 0,
      summarizedPages: 0,
      failedPages: 0,
      estimatedSize: 0,
    };

    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    allPages.forEach((page) => {
      // Count by status
      if (page.status === 'queued') stats.queuedPages++;
      else if (page.status === 'summarized') stats.summarizedPages++;
      else if (page.status === 'failed') stats.failedPages++;

      // Track oldest and newest
      if (page.lastVisit < oldestTimestamp) oldestTimestamp = page.lastVisit;
      if (page.lastVisit > newestTimestamp) newestTimestamp = page.lastVisit;

      // Rough size estimate (each page ~2-5KB)
      stats.estimatedSize += JSON.stringify(page).length;
    });

    if (oldestTimestamp !== Infinity) stats.oldestRecord = oldestTimestamp;
    if (newestTimestamp !== 0) stats.newestRecord = newestTimestamp;

    return stats;
  } catch (error) {
    logger.error('Failed to get stats', error);
    throw error;
  }
}

// ===== Folder Management Functions =====

export async function createFolder(name: string): Promise<Folder> {
  const db = await initDB();
  try {
    const folder: Folder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: Date.now(),
      itemCount: 0,
    };
    await db.put(FOLDERS_STORE, folder);
    logger.info(`Created folder: ${name}`);
    return folder;
  } catch (error) {
    logger.error('Failed to create folder', error);
    throw error;
  }
}

export async function getFolders(): Promise<Folder[]> {
  const db = await initDB();
  try {
    const folders = await db.getAll(FOLDERS_STORE);
    
    // Update item counts for each folder
    const updatedFolders = await Promise.all(
      folders.map(async (folder) => {
        const items = await getSavedItemsByFolder(folder.id);
        return { ...folder, itemCount: items.length };
      })
    );
    
    return updatedFolders.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    logger.error('Failed to get folders', error);
    throw error;
  }
}

export async function renameFolder(folderId: string, newName: string): Promise<void> {
  const db = await initDB();
  try {
    const folder = await db.get(FOLDERS_STORE, folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    folder.name = newName;
    await db.put(FOLDERS_STORE, folder);
    logger.info(`Renamed folder ${folderId} to ${newName}`);
  } catch (error) {
    logger.error('Failed to rename folder', error);
    throw error;
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const db = await initDB();
  try {
    // Delete all saved items in this folder
    const items = await getSavedItemsByFolder(folderId);
    const tx = db.transaction(SAVED_ITEMS_STORE, 'readwrite');
    await Promise.all(items.map((item) => tx.store.delete(item.id)));
    await tx.done;

    // Delete the folder
    await db.delete(FOLDERS_STORE, folderId);
    logger.info(`Deleted folder ${folderId} and ${items.length} items`);
  } catch (error) {
    logger.error('Failed to delete folder', error);
    throw error;
  }
}

// ===== Saved Items Management Functions =====

export async function saveItem(item: Omit<SavedItem, 'id' | 'savedAt'>): Promise<SavedItem> {
  const db = await initDB();
  try {
    const savedItem: SavedItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      savedAt: Date.now(),
    };
    await db.put(SAVED_ITEMS_STORE, savedItem);
    logger.info(`Saved item: ${savedItem.title}`);
    return savedItem;
  } catch (error) {
    logger.error('Failed to save item', error);
    throw error;
  }
}

export async function getSavedItemsByFolder(folderId: string): Promise<SavedItem[]> {
  const db = await initDB();
  try {
    const tx = db.transaction(SAVED_ITEMS_STORE, 'readonly');
    const index = tx.store.index('folderId');
    const items = await index.getAll(folderId);
    return items.sort((a, b) => b.savedAt - a.savedAt);
  } catch (error) {
    logger.error('Failed to get saved items', error);
    throw error;
  }
}

export async function deleteSavedItem(itemId: string): Promise<void> {
  const db = await initDB();
  try {
    await db.delete(SAVED_ITEMS_STORE, itemId);
    logger.info(`Deleted saved item ${itemId}`);
  } catch (error) {
    logger.error('Failed to delete saved item', error);
    throw error;
  }
}

