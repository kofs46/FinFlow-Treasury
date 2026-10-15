// src/services/googleDriveSilentSync.js

const BACKUP_FILE_NAME = 'finflow_treasury_backup.json';
const GOOGLE_CLIENT_ID = '308051597995-l8busgt4m3t0dto1tft1648tiu6d63gg.apps.googleusercontent.com';

export const getValidDriveToken = () => {
  return localStorage.getItem('gdrive_access_token');
};

/**
 * Silent Google OAuth Token Refresher
 * Expired hole user-er prompt chara background token fetch korbe
 */
export const silentlyRequestNewToken = () => {
  return new Promise((resolve) => {
    if (!window.google || !window.google.accounts) {
      resolve(null);
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        callback: (resp) => {
          if (resp && resp.access_token) {
            localStorage.setItem('gdrive_access_token', resp.access_token);
            localStorage.setItem('gdrive_connected', 'true');
            resolve(resp.access_token);
          } else {
            resolve(null);
          }
        },
      });
      // Silent prompt (No popup interruption if already signed in Google account)
      tokenClient.requestAccessToken({ prompt: '' });
    } catch {
      resolve(null);
    }
  });
};

/**
 * 1. Automatic Zero-Click Background Fetch from Google Drive (WhatsApp Style)
 */
export const loadBackupFromDrive = async () => {
  let token = getValidDriveToken();

  if (!token) {
    token = await silentlyRequestNewToken();
  }

  if (!token) {
    return { success: false, reason: 'NO_TOKEN' };
  }

  try {
    const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
    let searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&spaces=drive`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // 401 Unauthorized hole token refresh kore abar try korbe
    if (searchRes.status === 401) {
      token = await silentlyRequestNewToken();
      if (!token) return { success: false, reason: 'TOKEN_EXPIRED' };

      searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&spaces=drive`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }

    if (!searchRes.ok) throw new Error(`Drive search failed: ${searchRes.status}`);

    const searchData = await searchRes.json();
    if (!searchData.files || searchData.files.length === 0) {
      return { success: false, reason: 'NO_BACKUP_FOUND' };
    }

    const targetFile = searchData.files[0];
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${targetFile.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.status}`);

    const backupJson = await fileRes.json();

    if (backupJson && (Array.isArray(backupJson.accounts) || Array.isArray(backupJson.transactions))) {
      // Local database update
      localStorage.setItem('finflow_local_treasury_v1', JSON.stringify(backupJson));
      localStorage.setItem('gdrive_last_sync', targetFile.modifiedTime || new Date().toISOString());
      localStorage.setItem('gdrive_connected', 'true');

      // WhatsApp Style Global event trigger for immediate UI update
      window.dispatchEvent(new CustomEvent('finflow_data_synced', { detail: backupJson }));

      return {
        success: true,
        data: backupJson,
        modifiedTime: targetFile.modifiedTime,
      };
    }

    return { success: false, reason: 'CORRUPTED_PAYLOAD' };
  } catch (err) {
    console.error('[FinFlow Drive Auto-Fetch] Error:', err);
    return { success: false, error: err.message };
  }
};

export const fetchDriveBackup = loadBackupFromDrive;

/**
 * 2. Silent Auto-Save to Google Drive
 */
export const silentSyncToDrive = async (treasuryData) => {
  let token = getValidDriveToken();
  if (!token) {
    token = await silentlyRequestNewToken();
  }
  if (!token || !treasuryData) return { success: false, reason: 'NO_TOKEN_OR_DATA' };

  try {
    const payloadString = JSON.stringify({
      ...treasuryData,
      syncedAt: new Date().toISOString(),
    });

    const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
    let searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)&spaces=drive`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.status === 401) {
      token = await silentlyRequestNewToken();
      if (!token) return { success: false, reason: 'TOKEN_EXPIRED' };

      searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)&spaces=drive`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }

    const searchData = await searchRes.json();
    const existingFile = searchData.files && searchData.files[0];

    if (existingFile) {
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: payloadString,
        }
      );
    } else {
      const metadata = { name: BACKUP_FILE_NAME, mimeType: 'application/json' };
      const boundary = '-------FinFlowBoundary' + Math.random().toString(36).substring(2);
      const multipartRequestBody =
        `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        payloadString +
        `\r\n--${boundary}--`;

      await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );
    }

    localStorage.setItem('gdrive_last_sync', new Date().toISOString());
    localStorage.setItem('gdrive_connected', 'true');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};