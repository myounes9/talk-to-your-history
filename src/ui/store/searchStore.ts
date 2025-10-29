import { create } from 'zustand';
import { SearchResult, Settings } from '@/types/models';
import { searchQuery, getSettings, updateSettings } from '../lib/chromeApi';

interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
  settings: Settings | null;
  
  // Actions
  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Partial<Settings>) => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  isSearching: false,
  error: null,
  settings: null,

  setQuery: (query: string) => {
    set({ query });
  },

  search: async (query: string) => {
    if (!query.trim()) {
      set({ results: [], error: null });
      return;
    }

    set({ isSearching: true, error: null, query });

    try {
      const results = await searchQuery(query);
      set({ results, isSearching: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      set({ error: errorMessage, results: [], isSearching: false });
    }
  },

  loadSettings: async () => {
    try {
      const settings = await getSettings();
      set({ settings });
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  },

  saveSettings: async (newSettings: Partial<Settings>) => {
    try {
      const current = get().settings;
      const updated = { ...current, ...newSettings } as Settings;
      await updateSettings(newSettings);
      set({ settings: updated });
    } catch (error) {
      console.error('Failed to save settings', error);
      throw error;
    }
  },

  clearResults: () => {
    set({ results: [], query: '', error: null });
  },
}));

