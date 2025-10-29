export type PageRecord = {
  id: string;
  url: string;
  title: string;
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  lang?: string;
  summary?: string;
  memoryCard?: string;
  tags?: string[];
  status: 'queued' | 'summarized' | 'failed';
};

export type TimeWindow = 'today' | 'yesterday' | 'week' | 'two_weeks' | 'month' | 'all';

export type SearchQuery = {
  text: string;
  timeWindow: TimeWindow;
  mustKeywords: string[];
  shouldKeywords: string[];
  topicTags: string[];
};

export type SearchResult = PageRecord & {
  rank: number;
  matchReason: string;
};

export interface HistorySearchResult {
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount: number;
  relevanceScore: number;
  matchReason: string;
}

export interface ExpandedQuery {
  originalQuery: string;
  expandedTerms: string[];
  primaryKeywords: string[];
  timeWindow: TimeWindow;
  intent?: string;
}

export type Settings = {
  indexingEnabled: boolean;
  ignoredDomains: string[];
  preferredLanguage: string;
  maxPagesPerDay: number;
};

export type DBStats = {
  totalPages: number;
  queuedPages: number;
  summarizedPages: number;
  failedPages: number;
  estimatedSize: number;
  oldestRecord?: number;
  newestRecord?: number;
  lastScanTime?: number;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: number;
  itemCount: number;
};

export type SavedItem = {
  id: string;
  folderId: string;
  url: string;
  title: string;
  summary?: string;
  savedAt: number;
  sourceType: 'search' | 'current-tab';
};

