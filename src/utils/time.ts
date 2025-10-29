import { TimeWindow } from '@/types/models';

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export function getTimeWindowBounds(window: TimeWindow): { start: number; end: number } {
  const now = Date.now();
  const end = now;
  let start: number;

  switch (window) {
    case 'today':
      // Last 24 hours
      start = now - 24 * 60 * 60 * 1000;
      break;
    case 'yesterday':
      // 24-48 hours ago
      start = now - 48 * 60 * 60 * 1000;
      break;
    case 'week':
      start = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case 'two_weeks':
      start = now - 14 * 24 * 60 * 60 * 1000;
      break;
    case 'month':
      start = now - 30 * 24 * 60 * 60 * 1000;
      break;
    case 'all':
    default:
      start = 0;
      break;
  }

  return { start, end };
}

export function isWithinTimeWindow(timestamp: number, window: TimeWindow): boolean {
  const { start, end } = getTimeWindowBounds(window);
  return timestamp >= start && timestamp <= end;
}

