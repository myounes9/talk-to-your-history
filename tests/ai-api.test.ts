import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Chrome AI APIs
const mockLanguageModel = {
  prompt: vi.fn(),
  destroy: vi.fn(),
};

const mockSummarizer = {
  summarize: vi.fn(),
  destroy: vi.fn(),
};

const mockRewriter = {
  rewrite: vi.fn(),
  destroy: vi.fn(),
};

const mockDetector = {
  detect: vi.fn(),
};

// Setup global chrome.aiOriginTrial
(global as any).chrome = {
  ...((global as any).chrome || {}),
  aiOriginTrial: {
    languageModel: {
      capabilities: vi.fn(),
      create: vi.fn(),
    },
    summarizer: {
      capabilities: vi.fn(),
      create: vi.fn(),
    },
    rewriter: {
      capabilities: vi.fn(),
      create: vi.fn(),
    },
    translator: {
      canDetect: vi.fn(),
      createDetector: vi.fn(),
    },
  },
};

describe('Chrome AI APIs Tests', () => {
  describe('Language Model API', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should check if Language Model API is available', async () => {
      chrome.aiOriginTrial.languageModel.capabilities.mockResolvedValue({
        available: 'readily',
      });

      const caps = await chrome.aiOriginTrial.languageModel.capabilities();
      
      expect(caps.available).toBe('readily');
      expect(chrome.aiOriginTrial.languageModel.capabilities).toHaveBeenCalled();
    });

    it('should create a language model session', async () => {
      chrome.aiOriginTrial.languageModel.create.mockResolvedValue(mockLanguageModel);

      const session = await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: 'Test prompt',
      });

      expect(session).toBeDefined();
      expect(chrome.aiOriginTrial.languageModel.create).toHaveBeenCalledWith({
        systemPrompt: 'Test prompt',
      });
    });

    it('should prompt the language model and get a response', async () => {
      const testResponse = 'This is a test response from the AI model';
      mockLanguageModel.prompt.mockResolvedValue(testResponse);
      chrome.aiOriginTrial.languageModel.create.mockResolvedValue(mockLanguageModel);

      const session = await chrome.aiOriginTrial.languageModel.create();
      const response = await session.prompt('Test query');

      expect(response).toBe(testResponse);
      expect(mockLanguageModel.prompt).toHaveBeenCalledWith('Test query');
    });

    it('should handle language model creation failure', async () => {
      chrome.aiOriginTrial.languageModel.create.mockRejectedValue(
        new Error('API not available')
      );

      await expect(
        chrome.aiOriginTrial.languageModel.create()
      ).rejects.toThrow('API not available');
    });

    it('should destroy language model session', async () => {
      chrome.aiOriginTrial.languageModel.create.mockResolvedValue(mockLanguageModel);

      const session = await chrome.aiOriginTrial.languageModel.create();
      session.destroy();

      expect(mockLanguageModel.destroy).toHaveBeenCalled();
    });
  });

  describe('Summarizer API', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should check if Summarizer API is available', async () => {
      chrome.aiOriginTrial.summarizer.capabilities.mockResolvedValue({
        available: 'readily',
      });

      const caps = await chrome.aiOriginTrial.summarizer.capabilities();
      
      expect(caps.available).toBe('readily');
    });

    it('should create a summarizer and summarize text', async () => {
      const testSummary = 'This is a summary of the content';
      mockSummarizer.summarize.mockResolvedValue(testSummary);
      chrome.aiOriginTrial.summarizer.create.mockResolvedValue(mockSummarizer);

      const summarizer = await chrome.aiOriginTrial.summarizer.create();
      const summary = await summarizer.summarize('Long text to summarize...');

      expect(summary).toBe(testSummary);
      expect(mockSummarizer.summarize).toHaveBeenCalled();
    });

    it('should destroy summarizer session', async () => {
      chrome.aiOriginTrial.summarizer.create.mockResolvedValue(mockSummarizer);

      const summarizer = await chrome.aiOriginTrial.summarizer.create();
      summarizer.destroy();

      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });
  });

  describe('Rewriter API', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should check if Rewriter API is available', async () => {
      chrome.aiOriginTrial.rewriter.capabilities.mockResolvedValue({
        available: 'readily',
      });

      const caps = await chrome.aiOriginTrial.rewriter.capabilities();
      
      expect(caps.available).toBe('readily');
    });

    it('should create a rewriter and rewrite text', async () => {
      const testRewrite = 'Rewritten text with [tag1][tag2]';
      mockRewriter.rewrite.mockResolvedValue(testRewrite);
      chrome.aiOriginTrial.rewriter.create.mockResolvedValue(mockRewriter);

      const rewriter = await chrome.aiOriginTrial.rewriter.create({
        sharedContext: 'Test context',
      });
      const rewritten = await rewriter.rewrite('Original text');

      expect(rewritten).toBe(testRewrite);
      expect(mockRewriter.rewrite).toHaveBeenCalledWith('Original text');
    });

    it('should destroy rewriter session', async () => {
      chrome.aiOriginTrial.rewriter.create.mockResolvedValue(mockRewriter);

      const rewriter = await chrome.aiOriginTrial.rewriter.create();
      rewriter.destroy();

      expect(mockRewriter.destroy).toHaveBeenCalled();
    });
  });

  describe('Translator API', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should check if language detection is available', async () => {
      chrome.aiOriginTrial.translator.canDetect.mockResolvedValue('readily');

      const canDetect = await chrome.aiOriginTrial.translator.canDetect();
      
      expect(canDetect).toBe('readily');
    });

    it('should create detector and detect language', async () => {
      const testDetection = [
        { detectedLanguage: 'en', confidence: 0.95 },
        { detectedLanguage: 'es', confidence: 0.05 },
      ];
      mockDetector.detect.mockResolvedValue(testDetection);
      chrome.aiOriginTrial.translator.createDetector.mockResolvedValue(mockDetector);

      const detector = await chrome.aiOriginTrial.translator.createDetector();
      const result = await detector.detect('Hello world');

      expect(result).toEqual(testDetection);
      expect(result[0].detectedLanguage).toBe('en');
      expect(result[0].confidence).toBeGreaterThan(0.9);
    });

    it('should handle detection of non-English text', async () => {
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'es', confidence: 0.98 },
      ]);
      chrome.aiOriginTrial.translator.createDetector.mockResolvedValue(mockDetector);

      const detector = await chrome.aiOriginTrial.translator.createDetector();
      const result = await detector.detect('Hola mundo');

      expect(result[0].detectedLanguage).toBe('es');
    });
  });

  describe('AI API Error Handling', () => {
    it('should handle unavailable APIs gracefully', async () => {
      chrome.aiOriginTrial.languageModel.capabilities.mockResolvedValue({
        available: 'no',
      });

      const caps = await chrome.aiOriginTrial.languageModel.capabilities();
      
      expect(caps.available).toBe('no');
    });

    it('should handle after-download state', async () => {
      chrome.aiOriginTrial.languageModel.capabilities.mockResolvedValue({
        available: 'after-download',
      });

      const caps = await chrome.aiOriginTrial.languageModel.capabilities();
      
      expect(caps.available).toBe('after-download');
    });

    it('should handle timeout scenarios', async () => {
      mockLanguageModel.prompt.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      chrome.aiOriginTrial.languageModel.create.mockResolvedValue(mockLanguageModel);

      const session = await chrome.aiOriginTrial.languageModel.create();
      
      await expect(session.prompt('test')).rejects.toThrow('Timeout');
    });
  });
});

