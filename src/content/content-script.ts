import { Readability } from '@mozilla/readability';
import { ExtractReadableMessage, ExtractResponseMessage } from '@/types/messages';

// Listen for content extraction requests
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_READABLE') {
    handleExtractReadable(message as ExtractReadableMessage, sendResponse);
    return true; // Keep channel open for async response
  }
  return false;
});

function handleExtractReadable(
  _message: ExtractReadableMessage,
  sendResponse: (response: ExtractResponseMessage) => void
) {
  try {
    // Clone the document for Readability
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (article && article.textContent) {
      // Success with Readability
      sendResponse({
        type: 'EXTRACT_RESPONSE',
        success: true,
        data: {
          title: article.title || document.title,
          text: article.textContent.slice(0, 200000),
          excerpt: article.excerpt || '',
        },
      });
    } else {
      // Fallback to simple extraction
      sendResponse({
        type: 'EXTRACT_RESPONSE',
        success: true,
        data: {
          title: document.title,
          text: extractSimpleText(),
        },
      });
    }
  } catch (error) {
    // Error handling - use simple fallback
    console.warn('Readability failed, using simple extraction', error);
    sendResponse({
      type: 'EXTRACT_RESPONSE',
      success: true,
      data: {
        title: document.title,
        text: extractSimpleText(),
      },
    });
  }
}

function extractSimpleText(): string {
  // Simple text extraction fallback
  const body = document.body;
  if (!body) return '';

  // Remove script and style elements
  const clone = body.cloneNode(true) as HTMLElement;
  const scripts = clone.querySelectorAll('script, style, noscript');
  scripts.forEach((el) => el.remove());

  // Get text content
  const text = clone.innerText || clone.textContent || '';
  return text.slice(0, 200000);
}

