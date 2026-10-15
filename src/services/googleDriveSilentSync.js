// Google Drive Silent Cloud Sync Service

// Jodi apnar nijer Client ID thake tahole ekhane boshate paren, othoba user-ke input dite bolbe
export const getGoogleClientId = () => {
  return localStorage.getItem("gdrive_client_id") || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
};

export const setGoogleClientId = (clientId) => {
  localStorage.setItem("gdrive_client_id", clientId.trim());
};

const SCOPES = "https://www.googleapis.com/auth/drive.file";
const BACKUP_FILENAME = "finflow_treasury_backup.json";

// Google Identity Services (GIS) Token Client toiri kora
export const initSilentTokenClient = (onSuccess, onError) => {
  if (typeof window === "undefined" || !window.google || !window.google.accounts) {
    console.error("Google Identity Services script not loaded in index.html");
    return null;
  }

  const clientId = getGoogleClientId();

  try {
    return window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          console.error("Google Auth Error:", tokenResponse);
          if (onError) onError(tokenResponse.error_description || tokenResponse.error);
          return;
        }

        if (tokenResponse && tokenResponse.access_token) {
          localStorage.setItem("gdrive_access_token", tokenResponse.access_token);
          localStorage.setItem("gdrive_connected", "true");
          // Token expiry tracking (GIS token default expires in 3599 seconds)
          const expireTime = Date.now() + (Number(tokenResponse.expires_in) || 3600) * 1000;
          localStorage.setItem("gdrive_token_expires_at", String(expireTime));

          if (onSuccess) onSuccess(tokenResponse.access_token);
        }
      },
    });
  } catch (err) {
    console.error("Failed to initialize Google Token Client:", err);
    if (onError) onError(err.message);
    return null;
  }
};

// Check if drive backup file exists
export const getDriveBackupFileId = async (accessToken) => {
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&fields=files(id, name, modifiedTime)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0];
    }
    return null;
  } catch (err) {
    console.error("Error finding Google Drive backup:", err);
    return null;
  }
};

// Silent Sync (Backup to Drive)
export const silentSyncToDrive = async (payloadData) => {
  const token = localStorage.getItem("gdrive_access_token");
  if (!token) return { success: false, reason: "NOT_CONNECTED" };

  // Expiry check
  const expiresAt = Number(localStorage.getItem("gdrive_token_expires_at") || "0");
  if (expiresAt && Date.now() > expiresAt) {
    localStorage.removeItem("gdrive_access_token");
    localStorage.setItem("gdrive_connected", "false");
    return { success: false, reason: "TOKEN_EXPIRED" };
  }

  try {
    const existingFile = await getDriveBackupFileId(token);

    const backupBody = {
      appName: "FinFlow Treasury",
      version: "2.0",
      lastBackupTime: new Date().toISOString(),
      payload: payloadData,
    };

    if (existingFile) {
      // Update existing file
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backupBody),
        }
      );

      if (updateRes.ok) {
        const now = new Date().toISOString();
        localStorage.setItem("gdrive_last_sync", now);
        return { success: true, timestamp: now };
      }
    } else {
      // Create new file
      const metadata = {
        name: BACKUP_FILENAME,
        mimeType: "application/json",
      };

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", new Blob([JSON.stringify(backupBody)], { type: "application/json" }));

      const createRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      if (createRes.ok) {
        const now = new Date().toISOString();
        localStorage.setItem("gdrive_last_sync", now);
        return { success: true, timestamp: now };
      }
    }

    return { success: false, reason: "UPLOAD_FAILED" };
  } catch (err) {
    console.error("Silent Sync failed:", err);
    return { success: false, reason: err.message };
  }
};

// Drive theke backup data download kora (Restore)
export const fetchDriveBackup = async () => {
  const token = localStorage.getItem("gdrive_access_token");
  if (!token) return null;

  try {
    const existingFile = await getDriveBackupFileId(token);
    if (!existingFile) return null;

    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (fileRes.ok) {
      const data = await fileRes.json();
      return { fileMeta: existingFile, backupContent: data };
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch backup:", err);
    return null;
  }
};