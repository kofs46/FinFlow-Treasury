import React, { useState } from 'react';
import { Cloud, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { silentSyncToDrive } from '../../services/googleDriveSilentSync';

const GOOGLE_CLIENT_ID = '308051597995-l8busgt4m3t0dto1tft1648tiu6d63gg.apps.googleusercontent.com';

export default function MandatoryDriveModal({ onConnected, initialData }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleLinkGoogleDrive = () => {
    if (!window.google || !window.google.accounts) {
      setIsError(true);
      setStatusMsg('Google API failed to initialize. Please check your internet connection.');
      return;
    }

    setIsProcessing(true);
    setStatusMsg('Opening Google Authorization prompt...');
    setIsError(false);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setIsProcessing(false);
            setIsError(true);
            setStatusMsg(`Authorization cancelled or failed: ${tokenResponse.error}`);
            return;
          }

          if (tokenResponse && tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            localStorage.setItem('gdrive_access_token', token);
            localStorage.setItem('gdrive_connected', 'true');
            localStorage.setItem('gdrive_sync_freq', '3');

            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const userInfo = await userInfoRes.json();
              if (userInfo?.email) {
                localStorage.setItem('gdrive_user_email', userInfo.email);
              }
            } catch (e) {
              console.warn('User info skipped');
            }

            if (initialData) {
              await silentSyncToDrive(initialData);
            }

            setIsProcessing(false);
            onConnected();
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setIsProcessing(false);
      setIsError(true);
      setStatusMsg(`Connection error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-white border border-[#F3D7D9] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#E11D48] shadow-sm">
          <Cloud className="w-8 h-8 animate-bounce" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-rose-50 text-[#E11D48] border border-rose-200 text-[10px] font-black uppercase tracking-wider">
            Mandatory Setup
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Connect Your Google Drive
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            FinFlow requires a linked Google Drive account for <strong>automated silent cloud backups</strong>. Your treasury data stays confidential and synced directly to your personal Drive.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automated zero-click background backups</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Seamless 1-tap data restoration on new devices</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-[#E11D48] shrink-0" />
            <span>End-to-end client-side data isolation</span>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
            isError ? 'bg-rose-50 text-[#E11D48] border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{statusMsg}</span>
          </div>
        )}

        <button
          type="button"
          disabled={isProcessing}
          onClick={handleLinkGoogleDrive}
          className="w-full py-3.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-950/15 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          <span>{isProcessing ? 'Connecting...' : 'Link Google Drive & Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}