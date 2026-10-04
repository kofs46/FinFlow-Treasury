import React, { useState } from 'react';
import { useLang } from '../../context/LangContext';
import { 
  MessageCircle, 
  Send, 
  Mail, 
  Gamepad2, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function Footer() {
  const { t, lang } = useLang();
  const [copiedText, setCopiedText] = useState('');

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const contacts = [
    {
      name: "WhatsApp",
      handle: "+8801621110120",
      icon: MessageCircle,
      href: "https://wa.me/8801621110120",
      color: "from-emerald-500 to-teal-600",
      bgHover: "hover:bg-emerald-50 hover:border-emerald-200"
    },
    {
      name: "Telegram",
      handle: "+8801621110120",
      icon: Send,
      href: "https://t.me/+8801621110120",
      color: "from-sky-500 to-blue-600",
      bgHover: "hover:bg-sky-50 hover:border-sky-200"
    },
    {
      name: "Discord",
      handle: "_kofs_",
      icon: Gamepad2,
      isCopyOnly: true,
      color: "from-indigo-500 to-violet-600",
      bgHover: "hover:bg-indigo-50 hover:border-indigo-200"
    },
    {
      name: "Email",
      handle: "omrfys@gmail.com",
      icon: Mail,
      href: "mailto:omrfys@gmail.com",
      color: "from-rose-500 to-pink-600",
      bgHover: "hover:bg-rose-50 hover:border-rose-200"
    }
  ];

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-md pt-8 pb-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Architect Branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">{t('craftedBy')}</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/60 font-black text-indigo-700 text-sm tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              KOFS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            © {new Date().getFullYear()} {t('appTitle')}. {t('rightsReserved')}
          </p>
        </div>

        {/* Contact Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {contacts.map((c) => {
            const Icon = c.icon;
            const isCopied = copiedText === c.name;

            if (c.isCopyOnly) {
              return (
                <button
                  key={c.name}
                  onClick={() => handleCopy(c.handle, c.name)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 ${c.bgHover} group`}
                  title="Click to copy Discord tag"
                >
                  <div className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${c.color} text-white flex items-center justify-center shadow-xs`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span>{c.name}:</span>
                  <span className="font-mono text-slate-900 group-hover:text-indigo-600">{c.handle}</span>
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />}
                </button>
              );
            }

            return (
              <a
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 ${c.bgHover} group`}
              >
                <div className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${c.color} text-white flex items-center justify-center shadow-xs`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span>{c.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition" />
              </a>
            );
          })}
        </div>

      </div>
    </footer>
  );
}