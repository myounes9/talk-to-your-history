import { PageRecord } from '@/types/models';
import { logger } from '@/utils/log';
import { getRecentHistory, mergeIntoRecords } from './history';
import { listByStatus, putPage } from './db';
import { summarize, rewriteToMemoryCard, detectLanguage } from './ai';
import { extractTags } from '@/utils/text';

const MAX_CONCURRENT = 3;
const BATCH_SIZE = 10;

class ProcessingQueue {
  private queue: PageRecord[] = [];
  private processing = 0;
  private callbacks: Array<() => void> = [];

  add(record: PageRecord): void {
    this.queue.push(record);
  }

  async getNext(): Promise<PageRecord | null> {
    while (this.queue.length === 0 && this.processing > 0) {
      await new Promise((resolve) => {
        this.callbacks.push(resolve as () => void);
      });
    }
    return this.queue.shift() || null;
  }

  startProcessing(): void {
    this.processing++;
  }

  finishProcessing(): void {
    this.processing--;
    const callback = this.callbacks.shift();
    if (callback) callback();
  }

  get hasWork(): boolean {
    return this.queue.length > 0 || this.processing > 0;
  }
}

export async function scanAndIndex(): Promise<void> {
  logger.info('Starting scan and index operation');

  try {
    // Step 1: Fetch recent history
    const historyItems = await getRecentHistory(48);
    
    // Step 2: Merge into database
    await mergeIntoRecords(historyItems);

    // Step 3: Process queued pages
    const queuedPages = await listByStatus('queued', BATCH_SIZE);
    logger.info(`Found ${queuedPages.length} queued pages to process`);

    if (queuedPages.length === 0) {
      logger.info('No pages to process');
      return;
    }

    // Step 4: Process pages with concurrency limit
    const queue = new ProcessingQueue();
    queuedPages.forEach((page) => queue.add(page));

    const workers = Array.from({ length: MAX_CONCURRENT }, () =>
      processWorker(queue)
    );

    await Promise.all(workers);
    logger.info('Scan and index operation completed');
  } catch (error) {
    logger.error('Scan and index operation failed', error);
    throw error;
  }
}

async function processWorker(queue: ProcessingQueue): Promise<void> {
  while (queue.hasWork) {
    const record = await queue.getNext();
    if (!record) break;

    queue.startProcessing();
    try {
      const processed = await processPage(record);
      await putPage(processed);
      logger.info(`Successfully processed: ${processed.title}`);
    } catch (error) {
      logger.error(`Failed to process page: ${record.url}`, error);
      // Mark as failed
      record.status = 'failed';
      await putPage(record);
    } finally {
      queue.finishProcessing();
    }
  }
}

export async function processPage(record: PageRecord): Promise<PageRecord> {
  try {
    // Step 1: Extract content
    const { title, text } = await extractPageContent(record.url);
    
    if (!text || text.length < 100) {
      throw new Error('Insufficient content extracted');
    }

    // Step 2: Summarize
    logger.debug(`Summarizing: ${title}`);
    const summary = await summarize(text);

    // Step 3: Create memory card
    logger.debug(`Creating memory card: ${title}`);
    const memoryCard = await rewriteToMemoryCard(summary);

    // Step 4: Detect language
    const lang = await detectLanguage(text);

    // Step 5: Extract tags from memory card
    const tags = extractTags(memoryCard);

    // Update record
    const updated: PageRecord = {
      ...record,
      title: title || record.title,
      summary,
      memoryCard,
      lang,
      tags,
      status: 'summarized',
    };

    return updated;
  } catch (error) {
    logger.error(`Processing failed for ${record.url}`, error);
    throw error;
  }
}

export async function extractPageContent(
  url: string
): Promise<{ title: string; text: string }> {
  try {
    // Try to extract from content script
    const tabs = await chrome.tabs.query({ url });
    
    if (tabs.length > 0 && tabs[0].id) {
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'EXTRACT_READABLE',
        });
        
        if (response?.success && response.data) {
          return {
            title: response.data.title,
            text: response.data.text,
          };
        }
      } catch (error) {
        logger.debug('Content script extraction failed, trying fetch', error);
      }
    }

    // Fallback: fetch the page
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Chrome-Extension' },
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP ${fetchResponse.status}`);
    }

    const html = await fetchResponse.text();
    const text = stripHtmlTags(html).slice(0, 200000);
    const title = extractTitleFromHtml(html);

    return { title, text };
  } catch (error) {
    logger.warn(`Failed to extract content from ${url}`, error);
    throw error;
  }
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitleFromHtml(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : 'Untitled';
}

