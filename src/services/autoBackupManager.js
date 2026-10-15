// src/services/autoBackupManager.js
import { silentSyncToDrive, getValidDriveToken } from './googleDriveSilentSync';
import { getLocalTreasuryData } from './localStore';

let autoSyncTimeout = null;
let frequencyCheckInterval = null;

/**
 * 1. Immediate / Debounced Sync (Event-based)
 */
export const triggerAutoBackup = (customDelayMs = 1500) => {
  const isConnected = localStorage.getItem('gdrive_connected') === 'true';
  const token = getValidDriveToken();

  if (!isConnected || !token) return;

  if (autoSyncTimeout) {
    clearTimeout(autoSyncTimeout);
  }

  autoSyncTimeout = setTimeout(async () => {
    try {
      const data = getLocalTreasuryData();
      if (!data) return;

      console.log('[FinFlow Auto-Backup] Performing silent event-driven sync...');
      await silentSyncToDrive(data);
    } catch (err) {
      console.warn('[FinFlow Auto-Backup] Sync skipped:', err.message);
    }
  }, customDelayMs);
};

/**
 * 2. User-Selected Frequency Engine (24 Hours / 3 Days / 7 Days)
 * Checks interval condition and auto-saves if due
 */
export const checkAndRunFrequencyBackup = async () => {
  const isConnected = localStorage.getItem('gdrive_connected') === 'true';
  const token = getValidDriveToken();

  if (!isConnected || !token) return;

  // User-er dewa frequency: '1' (24 Hours), '3' (3 Days), '7' (Weekly)
  const freqDays = parseFloat(localStorage.getItem('gdrive_sync_freq') || '1');
  const lastSyncStr = localStorage.getItem('gdrive_last_sync');

  let isDue = false;

  if (!lastSyncStr) {
    // Kono backup aage na thakle first time immediate due
    isDue = true;
  } else {
    const lastSyncTime = new Date(lastSyncStr).getTime();
    const currentTime = new Date().getTime();
    const elapsedDays = (currentTime - lastSyncTime) / (1000 * 60 * 60 * 24);

    if (elapsedDays >= freqDays) {
      isDue = true;
    }
  }

  if (isDue) {
    console.log(`[FinFlow Frequency Engine] Interval condition met (${freqDays} days). Executing auto backup...`);
    try {
      const data = getLocalTreasuryData();
      if (data) {
        const res = await silentSyncToDrive(data);
        if (res && res.success) {
          console.log('[FinFlow Frequency Engine] Frequency cloud backup finished successfully!');
        }
      }
    } catch (err) {
      console.error('[FinFlow Frequency Engine] Backup execution failed:', err);
    }
  }
};

/**
 * 3. Start Interval Worker (Runs on app start & polls every 15 minutes)
 */
export const startFrequencyBackupWorker = () => {
  if (frequencyCheckInterval) {
    clearInterval(frequencyCheckInterval);
  }

  // App shuru hotei check korbe
  checkAndRunFrequencyBackup();

  // Protiti 15 minute por por background-e verify korbe interval complete hoyeche kina
  frequencyCheckInterval = setInterval(() => {
    checkAndRunFrequencyBackup();
  }, 15 * 60 * 1000);
};