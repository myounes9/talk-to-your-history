import { PageRecord, HistorySearchResult, TimeWindow } from '@/types/models';
import { makeHash } from '@/utils/hash';
import { logger } from '@/utils/log';
import { getTimeWindowBounds } from '@/utils/time';
import { getPage, putPage } from './db';

const EXCLUDED_PROTOCOLS = ['chrome:', 'chrome-extension:', 'about:', 'file:', 'data:'];
const MAX_RESULTS = 500;

export async function getRecentHistory(hours: number = 48): Promise<chrome.history.HistoryItem[]> {
  const startTime = Date.now() - hours * 60 * 60 * 1000;

  try {
    const historyItems = await chrome.history.search({
      text: '',
      startTime,
      maxResults: MAX_RESULTS,
    });

    logger.info(`Fetched ${historyItems.length} history items from last ${hours} hours`);
    return historyItems;
  } catch (error) {
    logger.error('Failed to fetch history', error);
    throw error;
  }
}

export function filterValidUrls(items: chrome.history.HistoryItem[]): chrome.history.HistoryItem[] {
  return items.filter((item) => {
    if (!item.url) return false;
    
    // Filter out excluded protocols
    const isExcluded = EXCLUDED_PROTOCOLS.some((protocol) => item.url!.startsWith(protocol));
    if (isExcluded) return false;

    // Filter out very short URLs (likely not useful)
    if (item.url.length < 10) return false;

    return true;
  });
}

export async function mergeIntoRecords(
  items: chrome.history.HistoryItem[]
): Promise<PageRecord[]> {
  const records: PageRecord[] = [];
  const validItems = filterValidUrls(items);

  for (const item of validItems) {
    try {
      const url = item.url!;
      const lastVisit = item.lastVisitTime || Date.now();
      const id = await makeId(url, lastVisit);

      // Check if record already exists
      const existing = await getPage(id);

      if (existing) {
        // Update existing record
        const updated: PageRecord = {
          ...existing,
          lastVisit: Math.max(existing.lastVisit, lastVisit),
          visitCount: existing.visitCount + 1,
        };
        records.push(updated);
      } else {
        // Create new record
        const newRecord: PageRecord = {
          id,
          url,
          title: item.title || 'Untitled',
          firstVisit: lastVisit,
          lastVisit,
          visitCount: item.visitCount || 1,
          status: 'queued',
        };
        records.push(newRecord);
      }
    } catch (error) {
      logger.warn(`Failed to process history item: ${item.url}`, error);
    }
  }

  // Save all records
  for (const record of records) {
    try {
      await putPage(record);
    } catch (error) {
      logger.error(`Failed to save record: ${record.url}`, error);
    }
  }

  logger.info(`Merged ${records.length} records into database`);
  return records;
}

export async function makeId(url: string, timestamp: number): Promise<string> {
  const input = `${url}_${Math.floor(timestamp / 86400000)}`; // Group by day
  return await makeHash(input);
}

/**
 * Search Chrome history directly using expanded terms for semantic search
 * Returns more candidates for AI semantic ranking
 */
export async function searchHistoryDirect(
  expandedTerms: string[],
  timeWindow: TimeWindow = 'all',
  limit: number = 200
): Promise<HistorySearchResult[]> {
  try {
    const { start } = getTimeWindowBounds(timeWindow);

    logger.info(`Searching history with ${expandedTerms.length} expanded terms, time: ${timeWindow}`);

    // Strategy: Try multiple search approaches and combine results
    const allResults = new Map<string, chrome.history.HistoryItem>();

    // Approach 1: Search with combined terms (broad search)
    try {
      const combinedSearch = await chrome.history.search({
        text: expandedTerms.slice(0, 5).join(' '), // Use top 5 terms
        startTime: start,
        maxResults: limit,
      });
      combinedSearch.forEach(item => {
        if (item.url) allResults.set(item.url, item);
      });
    } catch (e) {
      logger.warn('Combined search failed', e);
    }

    // Approach 2: If we have few results, search with individual important terms
    if (allResults.size < 50 && expandedTerms.length > 0) {
      for (const term of expandedTerms.slice(0, 10)) { // Top 10 terms
        if (term.length > 2) {
          try {
            const termResults = await chrome.history.search({
              text: term,
              startTime: start,
              maxResults: Math.min(50, limit),
            });
            termResults.forEach(item => {
              if (item.url) allResults.set(item.url, item);
            });
          } catch (e) {
            logger.debug(`Search for term "${term}" failed`, e);
          }
        }
        
        // Stop if we have enough results
        if (allResults.size >= limit) break;
      }
    }

    // Convert to array and filter valid URLs
    const historyItems = Array.from(allResults.values());
    const validItems = filterValidUrls(historyItems);

    logger.info(`Found ${validItems.length} history items from ${allResults.size} unique URLs`);

    // Convert to HistorySearchResult format
    // Note: We don't do heavy scoring here since AI will rank semantically
    const results: HistorySearchResult[] = validItems
      .map((item) => {
        const title = item.title || '';
        const url = item.url || '';
        const lowerTitle = title.toLowerCase();
        const lowerUrl = url.toLowerCase();
        
        // Basic relevance score for fallback sorting
        let score = 0;
        let matchedTerms: string[] = [];

        // Check expanded terms
        expandedTerms.forEach((term) => {
          const lowerTerm = term.toLowerCase();
          if (lowerTerm.length > 2) {
            if (lowerTitle.includes(lowerTerm)) {
              score += 10;
              matchedTerms.push(term);
            }
            if (lowerUrl.includes(lowerTerm)) {
              score += 3;
              if (!matchedTerms.includes(term)) {
                matchedTerms.push(term);
              }
            }
          }
        });

        // Boost recent visits
        const daysAgo = (Date.now() - (item.lastVisitTime || 0)) / (24 * 60 * 60 * 1000);
        const recencyBoost = Math.max(0, 10 - daysAgo);
        score += recencyBoost;

        // Boost frequently visited
        const visitBoost = Math.min(10, (item.visitCount || 0) / 5);
        score += visitBoost;

        const matchReason = matchedTerms.length > 0
          ? `Found: ${matchedTerms.slice(0, 3).join(', ')}`
          : 'Found in history';

        return {
          url: url,
          title: title || 'Untitled',
          lastVisitTime: item.lastVisitTime || 0,
          visitCount: item.visitCount || 0,
          relevanceScore: score,
          matchReason,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by initial relevance
      .slice(0, limit); // Limit candidates for AI ranking

    logger.info(`Returning ${results.length} candidates for semantic ranking`);
    return results;
  } catch (error) {
    logger.error('Failed to search history', error);
    return [];
  }
}

