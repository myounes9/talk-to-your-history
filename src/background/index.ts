import { logger } from '@/utils/log';
import { initScheduler, runScan } from './scheduler';
import { 
  getStats, 
  clearAll, 
  putPage, 
  createFolder, 
  getFolders, 
  renameFolder, 
  deleteFolder, 
  saveItem, 
  getSavedItemsByFolder, 
  deleteSavedItem 
} from './db';
import { expandQuery, rankCandidatesSemanticaly, checkAIAvailability } from './ai';
import { searchHistoryDirect } from './history';
import { PageRecord } from '@/types/models';
import {
  SearchQueryMessage,
  GetStatsMessage,
  EraseAllDataMessage,
  SeedTestDataMessage,
  TriggerScanMessage,
  GetSettingsMessage,
  UpdateSettingsMessage,
  SaveItemMessage,
  GetFoldersMessage,
  CreateFolderMessage,
  RenameFolderMessage,
  DeleteFolderMessage,
  GetSavedItemsMessage,
  DeleteSavedItemMessage,
} from '@/types/messages';

// Initialize on service worker startup
chrome.runtime.onInstalled.addListener(async (details) => {
  logger.info('Extension installed/updated', details.reason);

  try {
    // Initialize scheduler
    initScheduler();

    // Check if first install
    if (details.reason === 'install') {
      await handleFirstInstall();
    }

    // Check AI availability
    const availability = await checkAIAvailability();
    logger.info('AI APIs availability:', availability);
  } catch (error) {
    logger.error('Initialization failed', error);
  }
});

// Handle first install - set default settings
async function handleFirstInstall(): Promise<void> {
  logger.info('First install detected');

  const defaultSettings = {
    indexingEnabled: false, // Opt-in by default
    ignoredDomains: [],
    preferredLanguage: 'en',
    maxPagesPerDay: 100,
  };

  await chrome.storage.sync.set({
    settings: defaultSettings,
    firstRun: true,
  });

  logger.info('Default settings saved');
}

// Message handler
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  logger.debug('Received message:', message.type);

  switch (message.type) {
    case 'SEARCH_QUERY':
      handleSearchQuery(message as SearchQueryMessage)
        .then((results) => {
          sendResponse({ type: 'SEARCH_RESPONSE', results });
        })
        .catch((error) => {
          logger.error('Search query failed', error);
          sendResponse({
            type: 'SEARCH_RESPONSE',
            results: [],
            error: error.message,
          });
        });
      return true; // Keep channel open for async response

    case 'GET_STATS':
      handleGetStats(message as GetStatsMessage)
        .then((stats) => {
          sendResponse({ type: 'STATS_RESPONSE', stats });
        })
        .catch((error) => {
          logger.error('Get stats failed', error);
          sendResponse({ type: 'STATS_RESPONSE', stats: null, error: error.message });
        });
      return true;

    case 'ERASE_ALL_DATA':
      handleEraseAllData(message as EraseAllDataMessage)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Erase data failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'SEED_TEST_DATA':
      handleSeedTestData(message as SeedTestDataMessage)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Seed test data failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'TRIGGER_SCAN':
      handleTriggerScan(message as TriggerScanMessage)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Trigger scan failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'GET_SETTINGS':
      handleGetSettings(message as GetSettingsMessage)
        .then((settings) => {
          sendResponse({ settings });
        })
        .catch((error) => {
          logger.error('Get settings failed', error);
          sendResponse({ settings: null, error: error.message });
        });
      return true;

    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message as UpdateSettingsMessage)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Update settings failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'SAVE_ITEM':
      handleSaveItem(message as SaveItemMessage)
        .then((item) => {
          sendResponse({ success: true, item });
        })
        .catch((error) => {
          logger.error('Save item failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'GET_FOLDERS':
      handleGetFolders(message as GetFoldersMessage)
        .then((folders) => {
          sendResponse({ type: 'FOLDERS_RESPONSE', folders });
        })
        .catch((error) => {
          logger.error('Get folders failed', error);
          sendResponse({ type: 'FOLDERS_RESPONSE', folders: [], error: error.message });
        });
      return true;

    case 'CREATE_FOLDER':
      handleCreateFolder(message as CreateFolderMessage)
        .then((folder) => {
          sendResponse({ success: true, folder });
        })
        .catch((error) => {
          logger.error('Create folder failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'RENAME_FOLDER':
      handleRenameFolder(message as RenameFolderMessage)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Rename folder failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'DELETE_FOLDER':
      handleDeleteFolder(message as DeleteFolderMessage)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Delete folder failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'GET_SAVED_ITEMS':
      handleGetSavedItems(message as GetSavedItemsMessage)
        .then((items) => {
          sendResponse({ type: 'SAVED_ITEMS_RESPONSE', items });
        })
        .catch((error) => {
          logger.error('Get saved items failed', error);
          sendResponse({ type: 'SAVED_ITEMS_RESPONSE', items: [], error: error.message });
        });
      return true;

    case 'DELETE_SAVED_ITEM':
      handleDeleteSavedItem(message as DeleteSavedItemMessage)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Delete saved item failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    default:
      logger.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

async function handleSearchQuery(message: SearchQueryMessage) {
  logger.info('🔍 Processing semantic search query:', message.query);

  try {
    // Step 1: AI Query Expansion - Expand query into related terms, brands, concepts
    logger.debug('Step 1: Expanding query with AI...');
    const expansion = await expandQuery(message.query);
    logger.info('✨ Query expanded:', {
      intent: expansion.intent,
      terms: expansion.expandedTerms.length,
      timeWindow: expansion.timeWindow
    });

    // Step 2: Broad History Search - Cast a wide net with expanded terms
    logger.debug('Step 2: Searching Chrome history...');
    const candidates = await searchHistoryDirect(
      expansion.expandedTerms,
      expansion.timeWindow,
      200 // Get lots of candidates for AI semantic ranking
    );
    logger.info(`📚 Found ${candidates.length} candidate history items`);

    if (candidates.length === 0) {
      logger.info('No history items found');
      return [];
    }

    // Step 3: AI Semantic Ranking - Rank ALL candidates with AI for maximum accuracy
    logger.debug(`Step 3: Ranking ALL ${candidates.length} candidates semantically with AI...`);
    const rankedResults = await rankCandidatesSemanticaly(
      message.query,
      expansion.expandedTerms,
      candidates // Rank ALL candidates, not just top 50
    );

    logger.info(`✅ Returning ${rankedResults.length} semantically ranked results (confidence ≥ 0.5)`);
    return rankedResults.slice(0, 20); // Top 20 results
    
  } catch (error) {
    logger.error('❌ AI semantic search failed:', error);
    
    // Fallback: Simple keyword search if AI unavailable
    logger.warn('⚠️ Falling back to keyword search (AI unavailable)');
    try {
      const keywords = message.query.split(' ').filter(w => w.length > 2);
      const fallbackResults = await searchHistoryDirect(keywords, 'month', 50);
      
      return fallbackResults.slice(0, 20).map((item, index) => ({
        id: `history-${item.url}`,
        url: item.url,
        title: item.title,
        firstVisit: item.lastVisitTime,
        lastVisit: item.lastVisitTime,
        visitCount: item.visitCount,
        status: 'summarized' as const,
        rank: index + 1,
        matchReason: `⚠️ Keyword match (AI unavailable): ${item.matchReason}`,
      }));
    } catch (fallbackError) {
      logger.error('Fallback search also failed:', fallbackError);
      return [];
    }
  }
}

async function handleGetStats(_message: GetStatsMessage) {
  const stats = await getStats();
  const storage = await chrome.storage.sync.get('lastScanTime');
  stats.lastScanTime = storage.lastScanTime;
  return stats;
}

async function handleEraseAllData(_message: EraseAllDataMessage) {
  logger.warn('Erasing all data');
  await clearAll();
  await chrome.storage.sync.clear();
  logger.info('All data erased');
}

async function handleSeedTestData(_message: SeedTestDataMessage) {
  logger.info('Seeding test data');

  const testPages: PageRecord[] = [
    {
      id: 'test1',
      url: 'https://example.com/contentcal',
      title: 'ContentCal - Social Media Planning Tool',
      firstVisit: Date.now() - 7 * 24 * 60 * 60 * 1000,
      lastVisit: Date.now() - 7 * 24 * 60 * 60 * 1000,
      visitCount: 2,
      lang: 'en',
      summary:
        'ContentCal is a comprehensive social media planning and scheduling tool designed for marketing teams. It offers calendar views, content approval workflows, and analytics.',
      memoryCard:
        'ContentCal helps teams plan and schedule social media content with calendar views and approval workflows. [SaaS][social-media][content-planning][marketing]',
      tags: ['SaaS', 'social-media', 'content-planning', 'marketing'],
      status: 'summarized',
    },
    {
      id: 'test2',
      url: 'https://example.com/ai-pricing',
      title: 'AI Agent Pricing Models - Complete Guide',
      firstVisit: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastVisit: Date.now() - 30 * 24 * 60 * 60 * 1000,
      visitCount: 1,
      lang: 'en',
      summary:
        'This article explores various pricing models for AI agents, including token-based, subscription, and usage-based pricing. Covers OpenAI, Anthropic, and other providers.',
      memoryCard:
        'Guide to AI agent pricing models covering token-based, subscription, and usage pricing from major providers. [AI][pricing][business-model][SaaS]',
      tags: ['AI', 'pricing', 'business-model', 'SaaS'],
      status: 'summarized',
    },
    {
      id: 'test3',
      url: 'https://example.com/hubspot-shortcuts',
      title: 'HubSpot Keyboard Shortcuts FAQ',
      firstVisit: Date.now() - 1 * 24 * 60 * 60 * 1000,
      lastVisit: Date.now() - 1 * 24 * 60 * 60 * 1000,
      visitCount: 3,
      lang: 'en',
      summary:
        'Frequently asked questions about HubSpot keyboard shortcuts and productivity tips. Includes shortcuts for contacts, deals, and email management.',
      memoryCard:
        'HubSpot FAQ covering keyboard shortcuts for contacts, deals, and email productivity. [CRM][HubSpot][shortcuts][productivity]',
      tags: ['CRM', 'HubSpot', 'shortcuts', 'productivity'],
      status: 'summarized',
    },
  ];

  for (const page of testPages) {
    await putPage(page);
  }

  logger.info(`Seeded ${testPages.length} test pages`);
}

async function handleTriggerScan(_message: TriggerScanMessage) {
  logger.info('Manually triggering scan');
  await runScan();
}

async function handleGetSettings(_message: GetSettingsMessage) {
  const result = await chrome.storage.sync.get('settings');
  return result.settings || {
    indexingEnabled: false,
    ignoredDomains: [],
    preferredLanguage: 'en',
    maxPagesPerDay: 100,
  };
}

async function handleUpdateSettings(message: UpdateSettingsMessage) {
  const current = await chrome.storage.sync.get('settings');
  const updated = { ...current.settings, ...message.settings };
  await chrome.storage.sync.set({ settings: updated });
  logger.info('Settings updated', updated);
}

async function handleSaveItem(message: SaveItemMessage) {
  logger.info('Saving item:', message.title);
  const item = await saveItem({
    folderId: message.folderId,
    url: message.url,
    title: message.title,
    summary: message.summary,
    sourceType: message.sourceType,
  });
  return item;
}

async function handleGetFolders(_message: GetFoldersMessage) {
  logger.debug('Getting folders');
  const folders = await getFolders();
  return folders;
}

async function handleCreateFolder(message: CreateFolderMessage) {
  logger.info('Creating folder:', message.name);
  const folder = await createFolder(message.name);
  return folder;
}

async function handleRenameFolder(message: RenameFolderMessage) {
  logger.info('Renaming folder:', message.folderId, 'to', message.newName);
  await renameFolder(message.folderId, message.newName);
}

async function handleDeleteFolder(message: DeleteFolderMessage) {
  logger.info('Deleting folder:', message.folderId);
  await deleteFolder(message.folderId);
}

async function handleGetSavedItems(message: GetSavedItemsMessage) {
  logger.debug('Getting saved items for folder:', message.folderId);
  const items = await getSavedItemsByFolder(message.folderId);
  return items;
}

async function handleDeleteSavedItem(message: DeleteSavedItemMessage) {
  logger.info('Deleting saved item:', message.itemId);
  await deleteSavedItem(message.itemId);
}

logger.info('Background service worker loaded');

