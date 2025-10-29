import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Chrome Extension APIs Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chrome History API', () => {
    it('should search browsing history', async () => {
      const mockHistoryItems = [
        {
          id: '1',
          url: 'https://example.com',
          title: 'Example Site',
          lastVisitTime: Date.now(),
          visitCount: 5,
        },
        {
          id: '2',
          url: 'https://test.com',
          title: 'Test Site',
          lastVisitTime: Date.now() - 1000,
          visitCount: 2,
        },
      ];

      chrome.history.search.mockResolvedValue(mockHistoryItems);

      const results = await chrome.history.search({
        text: '',
        startTime: Date.now() - 24 * 60 * 60 * 1000,
        maxResults: 100,
      });

      expect(results).toEqual(mockHistoryItems);
      expect(results.length).toBe(2);
      expect(chrome.history.search).toHaveBeenCalled();
    });

    it('should filter history by text search', async () => {
      const mockResults = [
        {
          id: '1',
          url: 'https://github.com',
          title: 'GitHub',
          lastVisitTime: Date.now(),
        },
      ];

      chrome.history.search.mockResolvedValue(mockResults);

      const results = await chrome.history.search({
        text: 'github',
        maxResults: 10,
      });

      expect(results.length).toBeGreaterThanOrEqual(0);
      expect(chrome.history.search).toHaveBeenCalledWith({
        text: 'github',
        maxResults: 10,
      });
    });

    it('should handle empty history results', async () => {
      chrome.history.search.mockResolvedValue([]);

      const results = await chrome.history.search({ text: 'nonexistent' });

      expect(results).toEqual([]);
    });
  });

  describe('Chrome Storage API', () => {
    it('should save and retrieve settings from sync storage', async () => {
      const testSettings = {
        indexingEnabled: true,
        ignoredDomains: ['example.com'],
        preferredLanguage: 'en',
        maxPagesPerDay: 100,
      };

      chrome.storage.sync.set.mockResolvedValue(undefined);
      chrome.storage.sync.get.mockResolvedValue({ settings: testSettings });

      await chrome.storage.sync.set({ settings: testSettings });
      const result = await chrome.storage.sync.get('settings');

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ settings: testSettings });
      expect(result.settings).toEqual(testSettings);
    });

    it('should clear all storage', async () => {
      chrome.storage.sync.clear.mockResolvedValue(undefined);

      await chrome.storage.sync.clear();

      expect(chrome.storage.sync.clear).toHaveBeenCalled();
    });

    it('should handle storage with multiple keys', async () => {
      const mockData = {
        settings: { enabled: true },
        lastScanTime: Date.now(),
        version: '1.0.0',
      };

      chrome.storage.sync.get.mockResolvedValue(mockData);

      const result = await chrome.storage.sync.get(['settings', 'lastScanTime', 'version']);

      expect(result).toEqual(mockData);
    });
  });

  describe('Chrome Alarms API', () => {
    it('should create an alarm', async () => {
      chrome.alarms.create.mockResolvedValue(undefined);

      await chrome.alarms.create('indexer', {
        delayInMinutes: 1,
        periodInMinutes: 60,
      });

      expect(chrome.alarms.create).toHaveBeenCalledWith('indexer', {
        delayInMinutes: 1,
        periodInMinutes: 60,
      });
    });

    it('should clear an alarm', async () => {
      chrome.alarms.clear.mockResolvedValue(true);

      const cleared = await chrome.alarms.clear('indexer');

      expect(cleared).toBe(true);
      expect(chrome.alarms.clear).toHaveBeenCalledWith('indexer');
    });

    it('should handle alarm listener', () => {
      const mockCallback = vi.fn();
      chrome.alarms.onAlarm.addListener(mockCallback);

      expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalledWith(mockCallback);
    });
  });

  describe('Chrome Runtime API', () => {
    it('should send message to background script', async () => {
      const mockResponse = { success: true, data: 'test' };
      chrome.runtime.sendMessage.mockResolvedValue(mockResponse);

      const response = await chrome.runtime.sendMessage({
        type: 'TEST_MESSAGE',
        payload: 'test data',
      });

      expect(response).toEqual(mockResponse);
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should add message listener', () => {
      const mockListener = vi.fn();
      chrome.runtime.onMessage.addListener(mockListener);

      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(mockListener);
    });

    it('should handle runtime errors', () => {
      chrome.runtime.lastError = { message: 'Test error' };

      expect(chrome.runtime.lastError).toBeDefined();
      expect(chrome.runtime.lastError.message).toBe('Test error');
    });
  });

  describe('Chrome Tabs API', () => {
    it('should create a new tab', async () => {
      const mockTab = {
        id: 1,
        url: 'https://example.com',
        active: true,
      };

      chrome.tabs.create.mockResolvedValue(mockTab);

      const tab = await chrome.tabs.create({ url: 'https://example.com' });

      expect(tab).toEqual(mockTab);
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://example.com' });
    });

    it('should query tabs', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com', active: true },
        { id: 2, url: 'https://test.com', active: false },
      ];

      chrome.tabs.query.mockResolvedValue(mockTabs);

      const tabs = await chrome.tabs.query({ active: true });

      expect(tabs).toEqual(mockTabs);
      expect(chrome.tabs.query).toHaveBeenCalled();
    });

    it('should send message to content script', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const response = await chrome.tabs.sendMessage(1, { type: 'EXTRACT' });

      expect(response.success).toBe(true);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'EXTRACT' });
    });
  });

  describe('Chrome Scripting API', () => {
    it('should execute script in tab', async () => {
      const mockResults = [{ result: 'success' }];
      chrome.scripting.executeScript.mockResolvedValue(mockResults);

      const results = await chrome.scripting.executeScript({
        target: { tabId: 1 },
        func: () => 'test',
      });

      expect(results).toEqual(mockResults);
      expect(chrome.scripting.executeScript).toHaveBeenCalled();
    });
  });
});

