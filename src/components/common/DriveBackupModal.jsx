import React, { useState, useEffect } from 'react';
import { 
  silentSyncToDrive, 
  fetchDriveBackup 
} from '../../services/googleDriveSilentSync';
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HardDrive, 
  DownloadCloud,
  LogOut
} from 'lucide-react';

// Apnar Real Google Client ID
const GOOGLE_CLIENT_ID = '308051597995-l8busgt4m3t0dto1tft1648tiu6d63gg.apps.googleusercontent.com';

export default function DriveBackupModal({ 
  isOpen, 
  onClose, 
  currentTreasuryData, 
  onRestoreCompleted 
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('gdrive_user_email') || '');
  const [lastSync, setLastSync] = useState(localStorage.getItem('gdrive_last_sync') || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const [backupFrequency, setBackupFrequency] = useState(() => {
    return localStorage.getItem('gdrive_sync_freq') || '3';
  });

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('gdrive_access_token');
      setIsConnected(!!token);
      setUserEmail(localStorage.getItem('gdrive_user_email') || '');
      setLastSync(localStorage.getItem('gdrive_last_sync') || null);
      setStatusMsg('');
    }
  }, [isOpen]);

  const handleFrequencyChange = (e) => {
    const val = e.target.value;
    setBackupFrequency(val);
    localStorage.setItem('gdrive_sync_freq', val);
  };

  // Direct Google OAuth Login & Drive Authorization
  const handleLinkGoogleDrive = () => {
    if (!window.google || !window.google.accounts) {
      setIsError(true);
      setStatusMsg('Google API load hoyni. Doyakore internet connection check korun.');
      return;
    }

    setIsProcessing(true);
    setStatusMsg('Google authorization popup open hocche...');
    setIsError(false);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setIsProcessing(false);
            setIsError(true);
            setStatusMsg(`Google login cancel ba error: ${tokenResponse.error}`);
            return;
          }

          if (tokenResponse && tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            localStorage.setItem('gdrive_access_token', token);
            localStorage.setItem('gdrive_connected', 'true');

            // Fetch Connected Gmail Address
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const userInfo = await userInfoRes.json();
              if (userInfo && userInfo.email) {
                setUserEmail(userInfo.email);
                localStorage.setItem('gdrive_user_email', userInfo.email);
              }
            } catch (e) {
              console.log('User info fetch skipped');
            }

            setIsConnected(true);
            setIsProcessing(false);
            setStatusMsg('Google Drive shofolbhabe link hoyeche!');

            // Prothom auto backup run kora
            handleManualBackup(token);
          }
        },
      });

      // Google Account Select Popup Trigger
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setIsProcessing(false);
      setIsError(true);
      setStatusMsg(`Login error: ${err.message}`);
    }
  };

  // Manual Backup Trigger
  const handleManualBackup = async () => {
    setIsProcessing(true);
    setStatusMsg('Google Drive-e data sync hocche...');
    setIsError(false);

    const res = await silentSyncToDrive(currentTreasuryData);
    setIsProcessing(false);

    if (res.success) {
      setLastSync(res.timestamp);
      setStatusMsg('Data shofolbhabe Google Drive-e backup hoyeche!');
    } else {
      setIsError(true);
      if (res.reason === 'TOKEN_EXPIRED') {
        setStatusMsg('Drive session expired. Doyakore punoray link korun.');
        handleDisconnect();
      } else {
        setStatusMsg('Backup fail hoyeche. Internet connection check korun.');
      }
    }
  };

  // Restore from Drive
  const handleRestoreBackup = async () => {
    if (!window.confirm('Google Drive theke backup restore korte chan? Current data sync hoye jabe.')) return;

    setIsProcessing(true);
    setStatusMsg('Google Drive theke backup file ana hocche...');
    setIsError(false);

    const result = await fetchDriveBackup();
    setIsProcessing(false);

    if (result && result.backupContent?.payload) {
      if (onRestoreCompleted) {
        onRestoreCompleted(result.backupContent.payload);
      }
      setStatusMsg('Data shofolbhabe Google Drive theke restore hoyeche!');
    } else {
      setIsError(true);
      setStatusMsg('Google Drive-e kono backup file pawa jayni.');
    }
  };

  // Disconnect Drive
  const handleDisconnect = () => {
    localStorage.removeItem('gdrive_access_token');
    localStorage.removeItem('gdrive_connected');
    localStorage.removeItem('gdrive_user_email');
    localStorage.removeItem('gdrive_last_sync');
    setIsConnected(false);
    setUserEmail('');
    setLastSync(null);
    setStatusMsg('Google account disconnected.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white border border-[#F3D7D9] rounded-3xl p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Google Drive Auto-Backup</h3>
            <p className="text-xs text-slate-500">Silent cloud sync & 1-tap data recovery</p>
          </div>
        </div>

        {/* Drive Status Panel */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>Drive Link Status:</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
            </span>
          </div>

          {isConnected && userEmail && (
            <div className="text-xs text-slate-600 pt-1 flex items-center justify-between border-t border-slate-200/60">
              <span>Account:</span>
              <strong className="font-mono text-emerald-700">{userEmail}</strong>
            </div>
          )}

          <div className="text-xs text-slate-500 pt-1 flex items-center justify-between">
            <span>Last Cloud Backup:</span>
            <strong className="font-mono text-slate-800">
              {lastSync ? new Date(lastSync).toLocaleString('en-GB') : 'Never'}
            </strong>
          </div>
        </div>

        {/* Sync Frequency Dropdown */}
        <div className="mt-4">
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
            Auto-Sync Frequency
          </label>
          <select
            value={backupFrequency}
            onChange={handleFrequencyChange}
            className="w-full px-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="1">Daily (Every 24 Hours)</option>
            <option value="3">Every 3 Days (Recommended)</option>
            <option value="7">Weekly (Every 7 Days)</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            FinFlow will automatically check and refresh your backup file when due.
          </p>
        </div>

        {/* Status Alert */}
        {statusMsg && (
          <div className={`mt-3 p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
            isError ? 'bg-rose-50 border border-rose-200 text-[#E11D48]' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}>
            {isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {!isConnected ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleLinkGoogleDrive}
              className="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>{isProcessing ? 'Connecting...' : 'Link Google Drive Account'}</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleManualBackup()}
                  className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Backup Now</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleRestoreBackup}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Restore Data</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full py-1.5 text-[11px] font-bold text-slate-400 hover:text-[#E11D48] transition cursor-pointer flex items-center justify-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Disconnect Google Account</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}