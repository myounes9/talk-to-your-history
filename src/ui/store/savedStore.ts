import { create } from 'zustand';
import { Folder, SavedItem } from '@/types/models';
import * as chromeApi from '../lib/chromeApi';

interface SavedState {
  folders: Folder[];
  savedItems: SavedItem[];
  activeFolder: Folder | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<Folder>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  setActiveFolder: (folder: Folder | null) => void;
  
  loadSavedItems: (folderId: string) => Promise<void>;
  saveItem: (
    folderId: string,
    url: string,
    title: string,
    summary?: string,
    sourceType?: 'search' | 'current-tab'
  ) => Promise<SavedItem>;
  deleteSavedItem: (itemId: string) => Promise<void>;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  folders: [],
  savedItems: [],
  activeFolder: null,
  isLoading: false,
  error: null,

  loadFolders: async () => {
    set({ isLoading: true, error: null });
    try {
      const folders = await chromeApi.getFolders();
      set({ folders, isLoading: false });
      
      // If no active folder but folders exist, set first one as active
      const state = get();
      if (!state.activeFolder && folders.length > 0) {
        set({ activeFolder: folders[0] });
        // Load items for the first folder
        await get().loadSavedItems(folders[0].id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load folders';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createFolder: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const folder = await chromeApi.createFolder(name);
      const folders = [...get().folders, folder];
      set({ folders, isLoading: false });
      
      // If this is the first folder, set it as active
      if (folders.length === 1) {
        set({ activeFolder: folder, savedItems: [] });
      }
      
      return folder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  renameFolder: async (folderId: string, newName: string) => {
    set({ isLoading: true, error: null });
    try {
      await chromeApi.renameFolder(folderId, newName);
      
      // Update local state
      const folders = get().folders.map((f) =>
        f.id === folderId ? { ...f, name: newName } : f
      );
      set({ folders, isLoading: false });
      
      // Update active folder if it was the one renamed
      const activeFolder = get().activeFolder;
      if (activeFolder && activeFolder.id === folderId) {
        set({ activeFolder: { ...activeFolder, name: newName } });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename folder';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteFolder: async (folderId: string) => {
    set({ isLoading: true, error: null });
    try {
      await chromeApi.deleteFolder(folderId);
      
      // Update local state
      const folders = get().folders.filter((f) => f.id !== folderId);
      set({ folders, isLoading: false });
      
      // If the deleted folder was active, clear it and set a new one
      const activeFolder = get().activeFolder;
      if (activeFolder && activeFolder.id === folderId) {
        const newActiveFolder = folders.length > 0 ? folders[0] : null;
        set({ activeFolder: newActiveFolder, savedItems: [] });
        if (newActiveFolder) {
          await get().loadSavedItems(newActiveFolder.id);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete folder';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  setActiveFolder: (folder: Folder | null) => {
    set({ activeFolder: folder });
    if (folder) {
      get().loadSavedItems(folder.id);
    } else {
      set({ savedItems: [] });
    }
  },

  loadSavedItems: async (folderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const items = await chromeApi.getSavedItems(folderId);
      set({ savedItems: items, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load saved items';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  saveItem: async (
    folderId: string,
    url: string,
    title: string,
    summary?: string,
    sourceType: 'search' | 'current-tab' = 'search'
  ) => {
    set({ isLoading: true, error: null });
    try {
      const item = await chromeApi.saveItem(folderId, url, title, summary, sourceType);
      
      // If the item was saved to the active folder, add it to the list
      const activeFolder = get().activeFolder;
      if (activeFolder && activeFolder.id === folderId) {
        const savedItems = [item, ...get().savedItems];
        set({ savedItems, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      
      // Reload folders to update item counts
      await get().loadFolders();
      
      return item;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save item';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteSavedItem: async (itemId: string) => {
    set({ isLoading: true, error: null });
    try {
      await chromeApi.deleteSavedItem(itemId);
      
      // Remove from local state
      const savedItems = get().savedItems.filter((item) => item.id !== itemId);
      set({ savedItems, isLoading: false });
      
      // Reload folders to update item counts
      await get().loadFolders();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));

