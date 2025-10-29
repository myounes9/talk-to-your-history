import { logger } from '@/utils/log';
import { scanAndIndex } from './indexer';
import { checkAIAvailability } from './ai';

const ALARM_NAME = 'scanHistory';
const SCAN_INTERVAL = 15; // minutes

export function initScheduler(): void {
  logger.info('Initializing scheduler');

  // Create alarm for periodic scanning
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: SCAN_INTERVAL,
    delayInMinutes: 1, // Start first scan after 1 minute
  });

  // Listen for alarm
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
      runScan();
    }
  });

  logger.info(`Scheduler initialized with ${SCAN_INTERVAL} minute interval`);
}

export async function runScan(): Promise<void> {
  // Check if indexing is enabled in settings
  const settings = await chrome.storage.sync.get('settings');
  const indexingEnabled = settings.settings?.indexingEnabled ?? true;

  if (!indexingEnabled) {
    throw new Error('Indexing is disabled. Please enable it in settings.');
  }

  // Pre-flight check: Verify AI is ready
  const aiStatus = await checkAIAvailability();
  if (aiStatus.languageModel !== 'readily') {
    throw new Error(
      'Chrome AI is not ready. Enable flags at chrome://flags and wait for model download.'
    );
  }

  logger.info('Running scan with AI ready');
  await scanAndIndex(); // Let errors bubble up - DON'T catch here!
  
  // Update last scan time
  await chrome.storage.sync.set({
    lastScanTime: Date.now(),
  });
  
  logger.info('Scan completed successfully');
}

export function scheduleNextScan(): void {
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: SCAN_INTERVAL,
  });
  logger.info('Next scan scheduled');
}

