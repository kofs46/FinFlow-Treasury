import React, { useState } from 'react';
import { useLang } from '../../context/LangContext';
import { 
  X, 
  MessageCircle, 
  Send, 
  Mail, 
  Gamepad2, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
  const { lang } = useLang();
  const [copiedText, setCopiedText] = useState('');

  if (!isOpen) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const contactList = [
    {
      name: "WhatsApp",
      handle: "+8801621110120",
      desc: lang === 'bn' ? 'সরাসরি চ্যাট ও সাপোর্ট' : 'Direct Instant Messaging',
      icon: MessageCircle,
      href: "https://wa.me/8801621110120",
      color: "from-emerald-500 to-teal-600",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      name: "Telegram",
      handle: "+8801621110120",
      desc: lang === 'bn' ? 'দ্রুত মেসেজিং ও আপডেট' : 'Encrypted Direct Channel',
      icon: Send,
      href: "https://t.me/+8801621110120",
      color: "from-sky-500 to-blue-600",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200"
    },
    {
      name: "Discord",
      handle: "_kofs_",
      desc: lang === 'bn' ? 'কমিউনিটি ও ভয়েস চ্যাট' : 'Developer Handle',
      icon: Gamepad2,
      isCopyOnly: true,
      color: "from-indigo-500 to-violet-600",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    {
      name: "Email",
      handle: "omrfys@gmail.com",
      desc: lang === 'bn' ? 'অফিসিয়াল ইনকোয়ারি' : 'Official Correspondence',
      icon: Mail,
      href: "mailto:omrfys@gmail.com",
      color: "from-rose-500 to-pink-600",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'bn' ? 'যোগাযোগ করুন' : 'Contact Architect'}
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200">
                KOFS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn' ? 'সিস্টেম আর্কিটেক্ট ও টেকনিক্যাল সাপোর্ট' : 'Direct access to system developer'}
            </p>
          </div>
        </div>

        {/* Contact Links */}
        <div className="mt-6 space-y-3">
          {contactList.map((c) => {
            const Icon = c.icon;
            const isCopied = copiedText === c.name;

            if (c.isCopyOnly) {
              return (
                <button
                  key={c.name}
                  onClick={() => handleCopy(c.handle, c.name)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 transition group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${c.color} text-white flex items-center justify-center shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                        <span>{c.name}</span>
                        <span className="text-xs font-mono font-normal text-slate-500">({c.handle})</span>
                      </p>
                      <p className="text-[11px] text-slate-400">{c.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                    {isCopied ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Check className="w-4 h-4" />
                        {lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600">
                        <Copy className="w-4 h-4" />
                        {lang === 'bn' ? 'কপি' : 'Copy'}
                      </span>
                    )}
                  </div>
                </button>
              );
            }

            return (
              <a
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${c.color} text-white flex items-center justify-center shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{c.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="mt-5 p-3 rounded-2xl bg-slate-100/70 border border-slate-200/80 flex items-center gap-2.5 text-[11px] text-slate-600 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            {lang === 'bn' ? 'যেকোনো কারিগরি সহায়তা বা আপডেটের জন্য সবসময় প্রস্তুত।' : 'Active support for financial queries & updates.'}
          </span>
        </div>
      </div>
    </div>
  );
}