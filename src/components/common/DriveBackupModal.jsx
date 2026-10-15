import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRightLeft, 
  DownloadCloud, 
  UploadCloud,
  Mail,
  Clock,
  Zap,
  Repeat
} from 'lucide-react';
import { silentSyncToDrive, loadBackupFromDrive } from '../../services/googleDriveSilentSync';
import { checkAndRunFrequencyBackup } from '../../services/autoBackupManager';

const GOOGLE_CLIENT_ID = '308051597995-l8busgt4m3t0dto1tft1648tiu6d63gg.apps.googleusercontent.com';

export default function DriveBackupModal({ 
  isOpen, 
  onClose, 
  currentTreasuryData, 
  onRestoreCompleted 
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [lastSync, setLastSync] = useState('');
  const [syncFreq, setSyncFreq] = useState('1'); // '1' = 24h, '3' = 3 days, '7' = 7 days
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const email = localStorage.getItem('gdrive_user_email') || '';
      const connectedFlag = localStorage.getItem('gdrive_connected') === 'true';
      const syncTime = localStorage.getItem('gdrive_last_sync') || '';
      const savedFreq = localStorage.getItem('gdrive_sync_freq') || '1';

      const activelyConnected = connectedFlag || Boolean(email);

      setIsConnected(activelyConnected);
      setUserEmail(email);
      setLastSync(syncTime);
      setSyncFreq(savedFreq);
      setStatusMsg('');
      setIsError(false);

      if (activelyConnected) {
        localStorage.setItem('gdrive_connected', 'true');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requestGoogleToken = (onSuccess) => {
    if (!window.google || !window.google.accounts) {
      setIsError(true);
      setStatusMsg('Google API client failed to load. Check your internet connection.');
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setIsProcessing(false);
            setIsError(true);
            setStatusMsg(`Authentication failed: ${tokenResponse.error}`);
            return;
          }

          if (tokenResponse && tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            localStorage.setItem('gdrive_access_token', token);
            localStorage.setItem('gdrive_connected', 'true');

            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const info = await res.json();
              if (info?.email) {
                localStorage.setItem('gdrive_user_email', info.email);
                setUserEmail(info.email);
              }
            } catch (e) {
              console.warn('Could not fetch Google profile email');
            }

            setIsConnected(true);
            if (onSuccess) await onSuccess(token);
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: isConnected ? '' : 'select_account' });
    } catch (err) {
      setIsProcessing(false);
      setIsError(true);
      setStatusMsg(`OAuth Error: ${err.message}`);
    }
  };

  const handleConnectOrSwitch = () => {
    setIsProcessing(true);
    setStatusMsg('Connecting Google Drive...');
    setIsError(false);

    requestGoogleToken(async () => {
      if (currentTreasuryData) {
        await silentSyncToDrive(currentTreasuryData);
      }
      setIsProcessing(false);
      setStatusMsg('Google Drive connected successfully!');
      setLastSync(new Date().toISOString());
      localStorage.setItem('gdrive_connected', 'true');
    });
  };

  const handleManualBackup = () => {
    setIsProcessing(true);
    setStatusMsg('Backing up your treasury data to Google Drive...');
    setIsError(false);

    const token = localStorage.getItem('gdrive_access_token');
    if (!token) {
      requestGoogleToken(async () => {
        const res = await silentSyncToDrive(currentTreasuryData);
        setIsProcessing(false);
        if (res.success) {
          setStatusMsg('Backup successfully saved to your Google Drive!');
          setLastSync(new Date().toISOString());
        } else {
          setIsError(true);
          setStatusMsg('Backup failed: ' + (res.error || 'Unknown error'));
        }
      });
      return;
    }

    silentSyncToDrive(currentTreasuryData).then((res) => {
      setIsProcessing(false);
      if (res.success) {
        setStatusMsg('Backup successfully saved to your Google Drive!');
        setLastSync(new Date().toISOString());
      } else {
        requestGoogleToken(async () => {
          await silentSyncToDrive(currentTreasuryData);
          setStatusMsg('Backup successfully saved to your Google Drive!');
          setLastSync(new Date().toISOString());
        });
      }
    });
  };

  const handleManualRestore = () => {
    const confirmRestore = window.confirm(
      'Restoring from Google Drive will sync cloud records to your local treasury. Proceed?'
    );
    if (!confirmRestore) return;

    setIsProcessing(true);
    setStatusMsg('Searching for backup in your Google Drive...');
    setIsError(false);

    const executeRestore = async () => {
      const res = await loadBackupFromDrive();
      setIsProcessing(false);

      if (res.success) {
        setStatusMsg('Data successfully recovered from Google Drive!');
        if (onRestoreCompleted) onRestoreCompleted(res.data);
      } else {
        setIsError(true);
        setStatusMsg(
          res.reason === 'NO_BACKUP_FOUND'
            ? 'No backup file found in this Google Drive account.'
            : 'Could not restore backup: ' + (res.error || res.reason)
        );
      }
    };

    const token = localStorage.getItem('gdrive_access_token');
    if (!token) {
      requestGoogleToken(executeRestore);
    } else {
      executeRestore();
    }
  };

  const handleFreqChange = (e) => {
    const val = e.target.value;
    setSyncFreq(val);
    localStorage.setItem('gdrive_sync_freq', val);
    checkAndRunFrequencyBackup();
    
    const labelMap = {
      '1': 'Every 24 Hours',
      '3': 'Every 3 Days',
      '7': 'Weekly (Every 7 Days)'
    };
    setStatusMsg(`Auto-backup set to: ${labelMap[val] || val + ' Days'}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-white border border-[#F3D7D9] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] flex items-center justify-center shadow-xs">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Google Drive Auto-Backup
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Configurable automated interval backup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Details */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Drive Link Status:</span>
            </span>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isConnected 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-[#E11D48] border border-rose-200'
            }`}>
              {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
            <span className="font-bold text-slate-600 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Auto Cloud Sync:</span>
            </span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase text-slate-400">INACTIVE</span>
            )}
          </div>

          {userEmail && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <span className="font-bold text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Linked Account:</span>
              </span>
              <span className="font-mono font-bold text-slate-800">{userEmail}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Cloud Backup:</span>
            </span>
            <span className="font-mono font-bold text-slate-800">
              {lastSync ? new Date(lastSync).toLocaleString('en-GB') : 'No backup yet'}
            </span>
          </div>
        </div>

        {/* Dynamic Frequency Interval Selector */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#E11D48]" />
              <span>Auto-Backup Interval</span>
            </label>
            <span className="text-[10px] font-bold text-[#E11D48] bg-rose-100 px-2 py-0.5 rounded-full">
              Automated
            </span>
          </div>

          <select
            value={syncFreq}
            onChange={handleFreqChange}
            className="w-full px-3.5 py-2.5 bg-white border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48] transition cursor-pointer shadow-xs"
          >
            <option value="1">Daily (Every 24 Hours)</option>
            <option value="3">Every 3 Days (Recommended)</option>
            <option value="7">Weekly (Every 7 Days)</option>
          </select>
          <p className="text-[11px] text-slate-500 font-medium">
            System will automatically execute a silent backup to your Google Drive every <strong>{syncFreq === '1' ? '24 Hours' : syncFreq === '3' ? '3 Days' : '7 Days'}</strong> without needing manual clicks.
          </p>
        </div>

        {/* Action Status Notification */}
        {statusMsg && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            isError ? 'bg-rose-50 text-[#E11D48] border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {isConnected ? (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleManualBackup}
                  className="py-3 px-4 bg-[#E11D48] hover:bg-[#BE123C] active:scale-98 text-white rounded-2xl text-xs font-bold shadow-md shadow-rose-950/15 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isProcessing ? 'Syncing...' : 'Backup Now'}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleManualRestore}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Restore Data</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConnectOrSwitch}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-[#E11D48] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Switch / Re-link Google Account</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConnectOrSwitch}
              className="w-full py-3.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] active:scale-98 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-950/15 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>{isProcessing ? 'Connecting...' : 'Link Google Drive Account'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}