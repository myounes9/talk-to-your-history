import { SearchQuery, PageRecord, SearchResult, ExpandedQuery, TimeWindow, HistorySearchResult } from '@/types/models';
import { logger } from '@/utils/log';

// Chrome Built-in AI APIs via Origin Trial
declare global {
  namespace chrome {
    namespace aiOriginTrial {
      const languageModel: {
        capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create: (options?: {
          systemPrompt?: string;
          expectedInputs?: Array<{ type: 'text' | 'audio' | 'image'; languages?: string[] }>;
          temperature?: number;
          topK?: number;
        }) => Promise<AILanguageModel>;
        availability: (options?: {
          expectedInputs?: Array<{ type: 'text' | 'audio' | 'image'; languages?: string[] }>;
        }) => Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
      };
      const summarizer: {
        capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create: (options?: any) => Promise<AISummarizer>;
      };
      const rewriter: {
        capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create: (options?: { sharedContext?: string }) => Promise<AIRewriter>;
      };
      const translator: {
        canDetect: () => Promise<'readily' | 'after-download' | 'no'>;
        createDetector: () => Promise<LanguageDetector>;
      };
    }
  }

  interface AILanguageModel {
    prompt: (input: string | Array<{
      role: 'user' | 'assistant' | 'system';
      content: string | Array<{
        type: 'text' | 'audio' | 'image';
        value: string | Blob | BufferSource;
      }>;
    }>) => Promise<string>;
    destroy: () => void;
  }

  interface AISummarizer {
    summarize: (input: string) => Promise<string>;
    destroy: () => void;
  }

  interface AIRewriter {
    rewrite: (input: string, options?: { context?: string }) => Promise<string>;
    destroy: () => void;
  }

  interface LanguageDetector {
    detect: (input: string) => Promise<Array<{ detectedLanguage: string; confidence: number }>>;
  }
}

const MAX_RETRIES = 5; // Increased for better AI reliability
const RETRY_DELAY = 1500; // Increased retry delay
const TIMEOUT_MS = 20000; // Increased timeout for thorough AI processing

// Semaphore for rate limiting concurrent AI operations
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve?.();
    } else {
      this.permits++;
    }
  }
}

const aiSemaphore = new Semaphore(3); // Max 3 concurrent AI operations

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), ms)
  );
  return Promise.race([promise, timeout]);
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      logger.warn(`Retry ${i + 1}/${retries} after error:`, error);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
  throw new Error('Operation failed after retries');
}

export async function checkAIAvailability() {
  const availability = {
    languageModel: 'no' as 'readily' | 'after-download' | 'no',
    summarizer: 'no' as 'readily' | 'after-download' | 'no',
    rewriter: 'no' as 'readily' | 'after-download' | 'no',
    translator: 'no' as 'readily' | 'after-download' | 'no',
  };

  // Use chrome.aiOriginTrial for extensions with origin trial tokens
  const aiAPI = chrome.aiOriginTrial;

  try {
    if (aiAPI?.languageModel) {
      const caps = await aiAPI.languageModel.capabilities();
      availability.languageModel = caps.available;
    }
  } catch (e) {
    logger.debug('Language Model not available', e);
  }

  try {
    if (aiAPI?.summarizer) {
      const caps = await aiAPI.summarizer.capabilities();
      availability.summarizer = caps.available;
    }
  } catch (e) {
    logger.debug('Summarizer not available', e);
  }

  try {
    if (aiAPI?.rewriter) {
      const caps = await aiAPI.rewriter.capabilities();
      availability.rewriter = caps.available;
    }
  } catch (e) {
    logger.debug('Rewriter not available', e);
  }

  try {
    if (aiAPI?.translator) {
      const canDetect = await aiAPI.translator.canDetect();
      availability.translator = canDetect;
    }
  } catch (e) {
    logger.debug('Translator not available', e);
  }

  logger.info('AI Availability:', availability);
  return availability;
}

/**
 * Check if audio transcription is available using the Prompt API
 */
export async function checkAudioTranscriptionAvailability(): Promise<boolean> {
  try {
    const aiAPI = chrome.aiOriginTrial;
    if (!aiAPI?.languageModel) {
      return false;
    }
    
    const availability = await aiAPI.languageModel.availability({
      expectedInputs: [{ type: "audio" }]
    });
    
    const isAvailable = availability === "available" || availability === "downloadable" || availability === "downloading";
    logger.info('Audio transcription availability:', availability, '→', isAvailable);
    return isAvailable;
  } catch (e) {
    logger.debug('Audio transcription not available', e);
    return false;
  }
}

export async function summarize(text: string): Promise<string> {
  await aiSemaphore.acquire();
  try {
    return await retryOperation(async () => {
      const aiAPI = chrome.aiOriginTrial;
      if (!aiAPI?.languageModel) {
        throw new Error('Language Model API not available');
      }

      const session = await aiAPI.languageModel.create({
        systemPrompt: `You are a neutral summarizer. Summarize the following webpage content.
Keep product names and unique nouns. Target 500-1000 characters. Output plain text only, no markdown.`,
      }) as AILanguageModel;

      try {
        const truncatedText = text.slice(0, 4000); // API input limit
        const result = await withTimeout(session.prompt(truncatedText), TIMEOUT_MS);
        return result as string;
      } finally {
        session.destroy();
      }
    });
  } finally {
    aiSemaphore.release();
  }
}

export async function rewriteToMemoryCard(summary: string): Promise<string> {
  await aiSemaphore.acquire();
  try {
    return await retryOperation(async () => {
      const aiAPI = chrome.aiOriginTrial;
      if (!aiAPI?.rewriter) {
        throw new Error('Rewriter API not available');
      }

      const rewriter = await aiAPI.rewriter.create({
        sharedContext: 'Create a one-sentence gist followed by 3-5 tags in brackets. Keep proper nouns.',
      }) as AIRewriter;

      try {
        const result = await withTimeout(
          rewriter.rewrite(summary, {
            context: "Example format: 'ContentCal helps teams plan social content. [SaaS][content-planning][calendar]'",
          }),
          TIMEOUT_MS
        );
        return result as string;
      } finally {
        rewriter.destroy();
      }
    });
  } finally {
    aiSemaphore.release();
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    const aiAPI = chrome.aiOriginTrial;
    if (!aiAPI?.translator) {
      return 'en';
    }

    const detector = await aiAPI.translator.createDetector() as LanguageDetector;
    const results = await withTimeout(detector.detect(text.slice(0, 1000)), TIMEOUT_MS) as Array<{ detectedLanguage: string; confidence: number }>;
    return results[0]?.detectedLanguage || 'en';
  } catch (error) {
    logger.warn('Language detection failed, defaulting to en', error);
    return 'en';
  }
}

export async function interpretQuery(query: string): Promise<SearchQuery> {
  await aiSemaphore.acquire();
  try {
    return await retryOperation(async () => {
      const aiAPI = chrome.aiOriginTrial;
      if (!aiAPI?.languageModel) {
        throw new Error('Language Model API not available');
      }

      const session = await aiAPI.languageModel.create({
        systemPrompt: `You are a search query interpreter. Extract time references and keywords from natural language queries.

Time references: "yesterday" = yesterday, "today" = today, "last week" = week, "2 days ago" = today, "this month" = month
If no time reference, use "all".

Return ONLY valid JSON with no markdown or explanations.
Format: {"timeWindow": "today|yesterday|week|two_weeks|month|all", "keywords": ["word1", "word2"], "searchTerms": ["phrase 1", "phrase 2"]}`,
      }) as AILanguageModel;

      try {
        const prompt = `User query: "${query}"\n\nExtract time window, individual keywords, and search phrases. Return only JSON.`;
        const result = await withTimeout(session.prompt(prompt), TIMEOUT_MS) as string;
        
        // Clean up potential markdown formatting
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        
        return {
          text: query,
          timeWindow: parsed.timeWindow || 'all',
          mustKeywords: parsed.keywords || parsed.mustKeywords || [],
          shouldKeywords: parsed.searchTerms || parsed.shouldKeywords || [],
          topicTags: parsed.topicTags || [],
        };
      } finally {
        session.destroy();
      }
    });
  } catch (error) {
    logger.warn('Query interpretation failed, using fallback', error);
    
    // Fallback: basic keyword extraction with time detection
    const lowerQuery = query.toLowerCase();
    let timeWindow: 'today' | 'yesterday' | 'week' | 'two_weeks' | 'month' | 'all' = 'all';
    
    if (lowerQuery.includes('yesterday')) timeWindow = 'yesterday';
    else if (lowerQuery.includes('today') || lowerQuery.includes('hours ago')) timeWindow = 'today';
    else if (lowerQuery.includes('last week') || lowerQuery.includes('this week')) timeWindow = 'week';
    else if (lowerQuery.includes('last month') || lowerQuery.includes('this month')) timeWindow = 'month';
    
    const keywords = query
      .split(' ')
      .filter((w) => w.length > 3 && !['yesterday', 'today', 'last', 'week', 'month', 'looked', 'visited', 'viewed', 'website', 'site'].includes(w.toLowerCase()));
    
    return {
      text: query,
      timeWindow,
      mustKeywords: keywords,
      shouldKeywords: [],
      topicTags: [],
    };
  } finally {
    aiSemaphore.release();
  }
}

/**
 * Expand user query into related terms, brands, and concepts using AI
 * This enables semantic search by finding related terms that may not be in the original query
 */
export async function expandQuery(query: string): Promise<ExpandedQuery> {
  await aiSemaphore.acquire();
  try {
    return await retryOperation(async () => {
      const aiAPI = chrome.aiOriginTrial;
      if (!aiAPI?.languageModel) {
        throw new Error('Language Model API not available');
      }

      const session = await aiAPI.languageModel.create({
        systemPrompt: `You are a semantic search query expander for web browsing history. Your job is to think deeply about what the user wants and expand their query into ALL relevant terms, brands, products, and concepts.

THINK STEP BY STEP:
1. What is the user really looking for?
2. What are the popular brands/products in this category?
3. What are related terms and synonyms?
4. What websites or domains would contain this content?

EXAMPLES:

Query: "social media management platform"
Think: User wants tools to manage social media posts
Brands: Publer, Buffer, Hootsuite, Later, Sprout Social, Agorapulse, CoSchedule
Terms: scheduling, content calendar, post management, social networks, automation
Related: Twitter, Facebook, Instagram, LinkedIn, content marketing
Result: ["social media", "management", "platform", "Publer", "Buffer", "Hootsuite", "Later", "Sprout Social", "Agorapulse", "CoSchedule", "scheduling", "content calendar", "posts", "Twitter", "Facebook", "Instagram", "LinkedIn", "automation", "social networks"]

Query: "code repository hosting"
Think: User wants git hosting services
Brands: GitHub, GitLab, Bitbucket, Gitea
Terms: git, repository, source control, version control, code hosting
Related: repositories, commits, pull requests, merge
Result: ["code", "repository", "hosting", "GitHub", "GitLab", "Bitbucket", "Gitea", "git", "version control", "source control", "commits", "pull requests", "repositories", "merge"]

Query: "video streaming site"
Think: User wants video platforms
Brands: YouTube, Vimeo, Twitch, Dailymotion
Terms: video, streaming, watch, channel
Related: videos, live streaming, content creator
Result: ["video", "streaming", "site", "YouTube", "Vimeo", "Twitch", "Dailymotion", "watch", "videos", "channel", "live", "content creator"]

Be COMPREHENSIVE. Include 15-25 terms for best coverage.

Time references:
- "yesterday" = yesterday
- "today" or "few hours ago" = today
- "last week" or "this week" = week
- "last month" or "this month" = month
- No time reference = month (default to last 30 days for best results)

Return ONLY valid JSON with no markdown or explanations.
Format: {
  "timeWindow": "today|yesterday|week|two_weeks|month|all",
  "expandedTerms": ["term1", "brand1", "brand2", "concept1", ...],
  "primaryKeywords": ["main", "keywords"],
  "intent": "brief description of what user wants"
}`,
      }) as AILanguageModel;

      try {
        const prompt = `User query: "${query}"\n\nExpand this query into related terms, brands, and concepts. Extract time window. Return only JSON.`;
        const result = await withTimeout(session.prompt(prompt), TIMEOUT_MS) as string;
        
        // Clean up potential markdown formatting
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        
        return {
          originalQuery: query,
          expandedTerms: parsed.expandedTerms || [],
          primaryKeywords: parsed.primaryKeywords || [],
          timeWindow: (parsed.timeWindow || 'month') as TimeWindow,
          intent: parsed.intent,
        };
      } finally {
        session.destroy();
      }
    });
  } catch (error) {
    logger.warn('Query expansion failed, using fallback', error);
    
    // Fallback: basic keyword extraction with time detection
    const lowerQuery = query.toLowerCase();
    let timeWindow: TimeWindow = 'month'; // Default to last 30 days
    
    if (lowerQuery.includes('yesterday')) timeWindow = 'yesterday';
    else if (lowerQuery.includes('today') || lowerQuery.includes('hours ago') || lowerQuery.includes('hour ago')) timeWindow = 'today';
    else if (lowerQuery.includes('last week') || lowerQuery.includes('this week')) timeWindow = 'week';
    else if (lowerQuery.includes('last month') || lowerQuery.includes('this month')) timeWindow = 'month';
    else if (lowerQuery.includes('all time') || lowerQuery.includes('ever')) timeWindow = 'all';
    
    // Extract keywords (filter out common words)
    const stopWords = ['yesterday', 'today', 'last', 'week', 'month', 'looked', 'visited', 'viewed', 'website', 'site', 'find', 'show', 'search', 'for', 'the', 'and', 'or'];
    const keywords = query
      .split(' ')
      .filter((w) => w.length > 2 && !stopWords.includes(w.toLowerCase()));
    
    return {
      originalQuery: query,
      expandedTerms: keywords,
      primaryKeywords: keywords,
      timeWindow,
      intent: query,
    };
  } finally {
    aiSemaphore.release();
  }
}

export async function rankCandidates(
  query: string,
  candidates: PageRecord[]
): Promise<SearchResult[]> {
  if (candidates.length === 0) return [];

  await aiSemaphore.acquire();
  try {
    return await retryOperation(async () => {
      const aiAPI = chrome.aiOriginTrial;
      if (!aiAPI?.languageModel) {
        throw new Error('Language Model API not available');
      }

      const session = await aiAPI.languageModel.create({
        systemPrompt: `Rank pages by relevance to the user's query.
Return ONLY a JSON array with no markdown or explanations.
Format: [{"index": 0, "rank": 1, "matchReason": "brief reason"}]
Index is the page's position in the input list. Rank is 1 for best match.`,
      }) as AILanguageModel;

      try {
        const pageList = candidates
          .map((c, i) => `${i}. ${c.title} - ${c.memoryCard || c.summary?.slice(0, 200) || ''}`)
          .join('\n');

        const prompt = `Query: "${query}"\n\nPages:\n${pageList}\n\nRank by relevance. Return only JSON array.`;
        const result = await withTimeout(session.prompt(prompt), TIMEOUT_MS) as string;
        
        // Clean up potential markdown formatting
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const ranked = JSON.parse(cleaned);

        return ranked.map((r: any) => ({
          ...candidates[r.index],
          rank: r.rank,
          matchReason: r.matchReason || 'Relevant match',
        }));
      } finally {
        session.destroy();
      }
    });
  } catch (error) {
    logger.warn('Ranking failed, using simple fallback', error);
    // Fallback: return candidates with basic scoring
    return candidates.map((c, i) => ({
      ...c,
      rank: i + 1,
      matchReason: 'Match found',
    }));
  } finally {
    aiSemaphore.release();
  }
}

/**
 * Semantically rank history items by relevance to user query
 * Uses AI to understand meaning rather than just keyword matches
 * Supports batch processing for large candidate sets
 */
export async function rankCandidatesSemanticaly(
  originalQuery: string,
  expandedTerms: string[],
  candidates: HistorySearchResult[]
): Promise<SearchResult[]> {
  if (candidates.length === 0) return [];

  // If too many candidates (>100), rank in batches to handle token limits
  if (candidates.length > 100) {
    logger.info(`Large candidate set (${candidates.length}), ranking in batches...`);
    return await rankInBatches(originalQuery, expandedTerms, candidates);
  }

  return await rankBatch(originalQuery, expandedTerms, candidates, 0);
}

/**
 * Rank candidates in batches for large result sets
 */
async function rankInBatches(
  originalQuery: string,
  expandedTerms: string[],
  candidates: HistorySearchResult[]
): Promise<SearchResult[]> {
  const batchSize = 100;
  const allRanked: SearchResult[] = [];

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    logger.debug(`Ranking batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(candidates.length / batchSize)}`);
    const batchResults = await rankBatch(originalQuery, expandedTerms, batch, i);
    allRanked.push(...batchResults);
  }

  // Sort all results by rank
  return allRanked.sort((a, b) => a.rank - b.rank);
}

/**
 * Rank a single batch of candidates with AI
 */
async function rankBatch(
  originalQuery: string,
  expandedTerms: string[],
  candidates: HistorySearchResult[],
  indexOffset: number
): Promise<SearchResult[]> {
  await aiSemaphore.acquire();
  try {
    return await retryOperation(async () => {
      const aiAPI = chrome.aiOriginTrial;
      if (!aiAPI?.languageModel) {
        throw new Error('Language Model API not available');
      }

      const session = await aiAPI.languageModel.create({
        systemPrompt: `You are a semantic search ranker. Rank pages by semantic relevance to the user's intent, not just keyword matches.

Consider:
- Brand names and products (e.g., "Publer" is relevant to "social media platform")
- Product categories (e.g., "YouTube" is relevant to "video streaming")
- Website domains help identify purpose:
  * github.com, gitlab.com → code hosting
  * youtube.com, vimeo.com → video streaming
  * amazon.com, ebay.com → online shopping
  * twitter.com, facebook.com → social networks
  * jira.atlassian.com, trello.com → project management
- Related concepts (e.g., "scheduling" is relevant to "content management")
- User intent behind the query

STRICT CONFIDENCE SCORING:
- 0.9-1.0: Perfect match - page is exactly what user wants
- 0.7-0.9: Strong match - highly relevant to query
- 0.5-0.7: Moderate match - somewhat relevant
- Below 0.5: Weak or irrelevant - DO NOT INCLUDE

Example: Query "social media management platform"
- "Publer - Social Media Scheduling | publer.io" → confidence: 0.95 (perfect match)
- "Buffer: Social Media Dashboard | buffer.com" → confidence: 0.9 (strong match)
- "Twitter Home Timeline | twitter.com" → confidence: 0.4 (not a management tool, exclude)

Be strict. Only include results you're confident are relevant.

Return ONLY a JSON array with no markdown or explanations.
Format: [{"index": 0, "rank": 1, "matchReason": "explain semantic relevance clearly", "confidence": 0.95}]
Index is the page's position in the input list. Rank is 1 for best match.`,
      }) as AILanguageModel;

      try {
        // Enhanced page list with domain and visit context
        const pageList = candidates
          .map((c, i) => {
            try {
              const domain = new URL(c.url).hostname;
              const visitInfo = c.visitCount > 1 ? ` [${c.visitCount} visits]` : '';
              return `${i}. ${c.title} | ${domain}${visitInfo}`;
            } catch (e) {
              // Fallback for invalid URLs
              return `${i}. ${c.title}`;
            }
          })
          .join('\n');

        // Include expanded context more clearly
        const expandedContext = expandedTerms.length > 0 
          ? `\n\nSearch context (related terms found): ${expandedTerms.slice(0, 15).join(', ')}`
          : '';

        const prompt = `User is looking for: "${originalQuery}"${expandedContext}

History pages to rank:
${pageList}

Rank these pages by semantic relevance. Use domain names to understand site types. Be strict with confidence scores (minimum 0.5). Return only JSON array.`;
        
        const result = await withTimeout(session.prompt(prompt), TIMEOUT_MS) as string;
        
        // Clean up potential markdown formatting
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const ranked = JSON.parse(cleaned);

        // Convert to SearchResult format with stricter confidence threshold
        return ranked
          .filter((r: any) => r.confidence >= 0.5) // Increased from 0.3 - only high confidence
          .map((r: any) => {
            const candidate = candidates[r.index];
            return {
              id: `history-${candidate.url}`,
              url: candidate.url,
              title: candidate.title,
              firstVisit: candidate.lastVisitTime,
              lastVisit: candidate.lastVisitTime,
              visitCount: candidate.visitCount,
              status: 'summarized' as const,
              rank: (indexOffset / 100) * 1000 + r.rank, // Adjust rank for batch offset
              matchReason: r.matchReason || 'Semantically relevant',
            };
          })
          .sort((a: SearchResult, b: SearchResult) => a.rank - b.rank);
      } finally {
        session.destroy();
      }
    });
  } catch (error) {
    logger.warn('Semantic ranking failed for batch, using keyword-based fallback', error);
    
    // Fallback: keyword-based scoring
    const lowerQuery = originalQuery.toLowerCase();
    const lowerExpandedTerms = expandedTerms.map(t => t.toLowerCase());
    
    return candidates
      .map((candidate) => {
        const lowerTitle = candidate.title.toLowerCase();
        const lowerUrl = candidate.url.toLowerCase();
        
        let score = 0;
        
        // Check original query words
        lowerQuery.split(' ').forEach((word) => {
          if (word.length > 2) {
            if (lowerTitle.includes(word)) score += 10;
            if (lowerUrl.includes(word)) score += 5;
          }
        });
        
        // Check expanded terms
        lowerExpandedTerms.forEach((term) => {
          if (lowerTitle.includes(term)) score += 8;
          if (lowerUrl.includes(term)) score += 3;
        });
        
        // Recency and frequency boost
        score += candidate.relevanceScore || 0;
        
        return {
          id: `history-${candidate.url}`,
          url: candidate.url,
          title: candidate.title,
          firstVisit: candidate.lastVisitTime,
          lastVisit: candidate.lastVisitTime,
          visitCount: candidate.visitCount,
          status: 'summarized' as const,
          rank: 0, // Will be set after sorting
          matchReason: score > 15 ? 'Strong keyword match' : 'Related match',
          score,
        };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r, index) => ({
        ...r,
        rank: index + 1,
      }))
      .slice(0, 20);
  } finally {
    aiSemaphore.release();
  }
}

