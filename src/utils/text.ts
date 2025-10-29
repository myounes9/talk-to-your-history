import DOMPurify from 'dompurify';

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function highlightKeywords(text: string, keywords: string[]): string {
  if (!keywords || keywords.length === 0) return text;

  let highlighted = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark', 'strong', 'em', 'br'],
    ALLOWED_ATTR: [],
  });
}

export function extractTags(memoryCard: string): string[] {
  const tagRegex = /\[([^\]]+)\]/g;
  const tags: string[] = [];
  let match;

  while ((match = tagRegex.exec(memoryCard)) !== null) {
    tags.push(match[1]);
  }

  return tags;
}

export function cleanTextContent(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\r\n\t]/g, ' ') // Remove line breaks and tabs
    .trim();
}

