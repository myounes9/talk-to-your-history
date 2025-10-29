import type { SearchResult, DBStats, Settings, Folder, SavedItem } from './models';

export type MessageType =
  | 'SEARCH_QUERY'
  | 'SEARCH_RESPONSE'
  | 'EXTRACT_READABLE'
  | 'EXTRACT_RESPONSE'
  | 'SEED_TEST_DATA'
  | 'GET_STATS'
  | 'STATS_RESPONSE'
  | 'ERASE_ALL_DATA'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'TRIGGER_SCAN'
  | 'SAVE_ITEM'
  | 'GET_FOLDERS'
  | 'FOLDERS_RESPONSE'
  | 'CREATE_FOLDER'
  | 'RENAME_FOLDER'
  | 'DELETE_FOLDER'
  | 'GET_SAVED_ITEMS'
  | 'SAVED_ITEMS_RESPONSE'
  | 'DELETE_SAVED_ITEM';

export interface BaseMessage {
  type: MessageType;
}

export interface SearchQueryMessage extends BaseMessage {
  type: 'SEARCH_QUERY';
  query: string;
}

export interface SearchResponseMessage extends BaseMessage {
  type: 'SEARCH_RESPONSE';
  results: SearchResult[];
  error?: string;
}

export interface ExtractReadableMessage extends BaseMessage {
  type: 'EXTRACT_READABLE';
}

export interface ExtractResponseMessage extends BaseMessage {
  type: 'EXTRACT_RESPONSE';
  success: boolean;
  data?: {
    title: string;
    text: string;
    excerpt?: string;
  };
  error?: string;
}

export interface SeedTestDataMessage extends BaseMessage {
  type: 'SEED_TEST_DATA';
}

export interface GetStatsMessage extends BaseMessage {
  type: 'GET_STATS';
}

export interface StatsResponseMessage extends BaseMessage {
  type: 'STATS_RESPONSE';
  stats: DBStats;
}

export interface EraseAllDataMessage extends BaseMessage {
  type: 'ERASE_ALL_DATA';
}

export interface GetSettingsMessage extends BaseMessage {
  type: 'GET_SETTINGS';
}

export interface UpdateSettingsMessage extends BaseMessage {
  type: 'UPDATE_SETTINGS';
  settings: Partial<Settings>;
}

export interface TriggerScanMessage extends BaseMessage {
  type: 'TRIGGER_SCAN';
}

export interface SaveItemMessage extends BaseMessage {
  type: 'SAVE_ITEM';
  folderId: string;
  url: string;
  title: string;
  summary?: string;
  sourceType: 'search' | 'current-tab';
}

export interface GetFoldersMessage extends BaseMessage {
  type: 'GET_FOLDERS';
}

export interface FoldersResponseMessage extends BaseMessage {
  type: 'FOLDERS_RESPONSE';
  folders: Folder[];
}

export interface CreateFolderMessage extends BaseMessage {
  type: 'CREATE_FOLDER';
  name: string;
}

export interface RenameFolderMessage extends BaseMessage {
  type: 'RENAME_FOLDER';
  folderId: string;
  newName: string;
}

export interface DeleteFolderMessage extends BaseMessage {
  type: 'DELETE_FOLDER';
  folderId: string;
}

export interface GetSavedItemsMessage extends BaseMessage {
  type: 'GET_SAVED_ITEMS';
  folderId: string;
}

export interface SavedItemsResponseMessage extends BaseMessage {
  type: 'SAVED_ITEMS_RESPONSE';
  items: SavedItem[];
}

export interface DeleteSavedItemMessage extends BaseMessage {
  type: 'DELETE_SAVED_ITEM';
  itemId: string;
}

export type Message =
  | SearchQueryMessage
  | SearchResponseMessage
  | ExtractReadableMessage
  | ExtractResponseMessage
  | SeedTestDataMessage
  | GetStatsMessage
  | StatsResponseMessage
  | EraseAllDataMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | TriggerScanMessage
  | SaveItemMessage
  | GetFoldersMessage
  | FoldersResponseMessage
  | CreateFolderMessage
  | RenameFolderMessage
  | DeleteFolderMessage
  | GetSavedItemsMessage
  | SavedItemsResponseMessage
  | DeleteSavedItemMessage;

