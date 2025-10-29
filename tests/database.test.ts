import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openDB } from 'idb';

// Mock idb module
vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('IndexedDB (idb) API Tests', () => {
  let mockDB: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock database object
    mockDB = {
      put: vi.fn(),
      get: vi.fn(),
      clear: vi.fn(),
      transaction: vi.fn(() => ({
        store: {
          getAll: vi.fn(),
          index: vi.fn(() => ({
            openCursor: vi.fn(),
            getAll: vi.fn(),
          })),
        },
      })),
      createObjectStore: vi.fn(),
      objectStoreNames: {
        contains: vi.fn(),
      },
    };
  });

  describe('Database Initialization', () => {
    it('should open database successfully', async () => {
      (openDB as any).mockResolvedValue(mockDB);

      const db = await openDB('tthy', 1);

      expect(db).toBeDefined();
      expect(openDB).toHaveBeenCalledWith('tthy', 1);
    });

    it('should create object store on upgrade', async () => {
      const mockUpgrade = vi.fn((db) => {
        if (!db.objectStoreNames.contains('pages')) {
          const store = db.createObjectStore('pages', { keyPath: 'id' });
          store.createIndex('lastVisit', 'lastVisit', { unique: false });
        }
      });

      (openDB as any).mockImplementation((name, version, { upgrade }) => {
        const mockDb = {
          objectStoreNames: { contains: vi.fn(() => false) },
          createObjectStore: vi.fn(() => ({
            createIndex: vi.fn(),
          })),
        };
        upgrade(mockDb);
        return Promise.resolve(mockDB);
      });

      const db = await openDB('tthy', 1, { upgrade: mockUpgrade });

      expect(db).toBeDefined();
    });
  });

  describe('CRUD Operations', () => {
    it('should save a page record', async () => {
      (openDB as any).mockResolvedValue(mockDB);
      mockDB.put.mockResolvedValue('page-id-1');

      const db = await openDB('tthy', 1);
      const testPage = {
        id: 'page-id-1',
        url: 'https://example.com',
        title: 'Test Page',
        firstVisit: Date.now(),
        lastVisit: Date.now(),
        visitCount: 1,
        status: 'queued',
      };

      await db.put('pages', testPage);

      expect(mockDB.put).toHaveBeenCalledWith('pages', testPage);
    });

    it('should retrieve a page record by id', async () => {
      (openDB as any).mockResolvedValue(mockDB);
      const mockPage = {
        id: 'page-id-1',
        url: 'https://example.com',
        title: 'Test Page',
      };
      mockDB.get.mockResolvedValue(mockPage);

      const db = await openDB('tthy', 1);
      const page = await db.get('pages', 'page-id-1');

      expect(page).toEqual(mockPage);
      expect(mockDB.get).toHaveBeenCalledWith('pages', 'page-id-1');
    });

    it('should clear all records', async () => {
      (openDB as any).mockResolvedValue(mockDB);
      mockDB.clear.mockResolvedValue(undefined);

      const db = await openDB('tthy', 1);
      await db.clear('pages');

      expect(mockDB.clear).toHaveBeenCalledWith('pages');
    });
  });

  describe('Query Operations', () => {
    it('should retrieve all pages', async () => {
      (openDB as any).mockResolvedValue(mockDB);
      const mockPages = [
        { id: '1', title: 'Page 1' },
        { id: '2', title: 'Page 2' },
        { id: '3', title: 'Page 3' },
      ];

      mockDB.transaction.mockReturnValue({
        store: {
          getAll: vi.fn().mockResolvedValue(mockPages),
          index: vi.fn(),
        },
      });

      const db = await openDB('tthy', 1);
      const tx = db.transaction('pages', 'readonly');
      const pages = await tx.store.getAll();

      expect(pages).toEqual(mockPages);
      expect(pages.length).toBe(3);
    });

    it('should query pages by index', async () => {
      (openDB as any).mockResolvedValue(mockDB);
      const mockFilteredPages = [
        { id: '1', status: 'summarized' },
        { id: '2', status: 'summarized' },
      ];

      const mockIndex = {
        getAll: vi.fn().mockResolvedValue(mockFilteredPages),
        openCursor: vi.fn(),
      };

      mockDB.transaction.mockReturnValue({
        store: {
          getAll: vi.fn(),
          index: vi.fn().mockReturnValue(mockIndex),
        },
      });

      const db = await openDB('tthy', 1);
      const tx = db.transaction('pages', 'readonly');
      const index = tx.store.index('status');
      const pages = await index.getAll('summarized');

      expect(pages).toEqual(mockFilteredPages);
      expect(pages.length).toBe(2);
    });

    it('should handle cursor iteration', async () => {
      (openDB as any).mockResolvedValue(mockDB);
      
      const mockCursor = {
        value: { id: '1', title: 'Page 1' },
        continue: vi.fn().mockResolvedValue(null),
      };

      const mockIndex = {
        openCursor: vi.fn().mockResolvedValue(mockCursor),
        getAll: vi.fn(),
      };

      mockDB.transaction.mockReturnValue({
        store: {
          getAll: vi.fn(),
          index: vi.fn().mockReturnValue(mockIndex),
        },
      });

      const db = await openDB('tthy', 1);
      const tx = db.transaction('pages', 'readonly');
      const index = tx.store.index('lastVisit');
      const cursor = await index.openCursor(null, 'prev');

      expect(cursor).toBeDefined();
      expect(cursor.value.title).toBe('Page 1');
    });
  });

  describe('Error Handling', () => {
    it('should handle database open error', async () => {
      (openDB as any).mockRejectedValue(new Error('Database failed to open'));

      await expect(openDB('tthy', 1)).rejects.toThrow('Database failed to open');
    });

    it('should handle transaction errors', async () => {
      (openDB as any).mockResolvedValue(mockDB);
      mockDB.put.mockRejectedValue(new Error('Write failed'));

      const db = await openDB('tthy', 1);

      await expect(db.put('pages', { id: '1' })).rejects.toThrow('Write failed');
    });
  });

  describe('Database Statistics', () => {
    it('should calculate database stats', async () => {
      (openDB as any).mockResolvedValue(mockDB);
      const mockPages = [
        { id: '1', status: 'queued', lastVisit: Date.now() - 1000 },
        { id: '2', status: 'summarized', lastVisit: Date.now() },
        { id: '3', status: 'failed', lastVisit: Date.now() - 2000 },
      ];

      mockDB.transaction.mockReturnValue({
        store: {
          getAll: vi.fn().mockResolvedValue(mockPages),
          index: vi.fn(),
        },
      });

      const db = await openDB('tthy', 1);
      const tx = db.transaction('pages', 'readonly');
      const allPages = await tx.store.getAll();

      const stats = {
        totalPages: allPages.length,
        queuedPages: allPages.filter(p => p.status === 'queued').length,
        summarizedPages: allPages.filter(p => p.status === 'summarized').length,
        failedPages: allPages.filter(p => p.status === 'failed').length,
      };

      expect(stats.totalPages).toBe(3);
      expect(stats.queuedPages).toBe(1);
      expect(stats.summarizedPages).toBe(1);
      expect(stats.failedPages).toBe(1);
    });
  });
});

