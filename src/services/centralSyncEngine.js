// src/services/centralSyncEngine.js
import { supabase } from '../supabaseClient';
import { getLocalTreasuryData, saveLocalTreasuryData } from './localStore';
import { silentSyncToDrive, loadBackupFromDrive } from './googleDriveSilentSync';

let debounceTimer = null;

/**
 * 1. AUTO-RESTORE ON LOGIN (Zero-Click)
 * User login korar sathe sathe eti call hobe ebong latest cloud data screen-e load korbe.
 */
export const autoFetchOnLogin = async (userId) => {
  if (!userId) return null;

  try {
    console.log('[CentralSync] Checking cloud data for user...', userId);

    // Primary: Supabase User Cloud Backup
    const { data: cloudRow, error } = await supabase
      .from('user_backups')
      .select('payload, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && cloudRow?.payload) {
      const payload = cloudRow.payload;
      if (Array.isArray(payload.accounts) || Array.isArray(payload.transactions)) {
        saveLocalTreasuryData(payload);
        window.dispatchEvent(new CustomEvent('finflow_data_synced', { detail: payload }));
        return payload;
      }
    }

    // Secondary Fallback: Google Drive
    const driveResult = await loadBackupFromDrive();
    if (driveResult && driveResult.success && driveResult.data) {
      saveLocalTreasuryData(driveResult.data);
      // Supabase-eo sync kore rakhi jate next time Google Drive charao direct load hoy
      await supabase.from('user_backups').upsert({
        user_id: userId,
        payload: driveResult.data,
        updated_at: new Date().toISOString()
      });
      window.dispatchEvent(new CustomEvent('finflow_data_synced', { detail: driveResult.data }));
      return driveResult.data;
    }
  } catch (err) {
    console.warn('[CentralSync] Auto-fetch notice:', err.message);
  }
  return null;
};

/**
 * 2. AUTO-BACKUP ON ANY DATA CHANGE (Zero-Click)
 * User kono kaj korar sathe sathe instant cloud-e save hobe.
 */
export const autoBackupOnChange = (userId, customDelay = 1000) => {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    try {
      const currentData = getLocalTreasuryData();
      if (!currentData) return;

      console.log('[CentralSync] Auto-saving changes to cloud...');

      // 1. Silent sync to Google Drive
      silentSyncToDrive(currentData).catch(() => {});

      // 2. Persistent Cloud Save to Supabase (Guarantees multi-device login auto-fetch)
      if (userId && supabase) {
        await supabase.from('user_backups').upsert({
          user_id: userId,
          payload: currentData,
          updated_at: new Date().toISOString()
        });
      }
      console.log('[CentralSync] Cloud auto-save finished successfully!');
    } catch (err) {
      console.warn('[CentralSync] Background sync skipped:', err.message);
    }
  }, customDelay);
};