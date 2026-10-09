import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { 
  X, 
  User, 
  Camera, 
  Phone, 
  MapPin, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, profile, fetchProfile } = useAuth();
  const { lang } = useLang();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFullName(profile?.full_name || '');
      setPhone(profile?.phone || '');
      setAddress(profile?.address || '');
      setAvatarUrl(profile?.avatar_url || '');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি ফাইল দিন।' : 'Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(lang === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।' : 'Image size cannot exceed 5MB.');
      return;
    }

    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicData.publicUrl);
      setSuccessMessage(lang === 'bn' ? 'ছবি নির্বাচন সম্পন্ন! পরিবর্তন সংরক্ষণে সেভ বাটনে চাপুন।' : 'Photo uploaded! Click Save Changes to confirm.');
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMessage(err.message || 'Error uploading photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      if (fetchProfile) {
        await fetchProfile(user.id);
      }

      setSuccessMessage(lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <h3 className="text-lg font-black text-slate-950">
            {lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'User Profile'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'আপনার তথ্য ও প্রোফাইল ছবি আপডেট করুন' : 'Manage your identity and details'}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-[#E11D48] p-0.5 shadow-md overflow-hidden bg-rose-50 flex items-center justify-center">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full" 
                  onError={() => setAvatarUrl('')}
                />
              ) : (
                <User className="w-10 h-10 text-rose-300" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
              title={lang === 'bn' ? 'ছবি পরিবর্তন' : 'Change Avatar'}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />
          <span className="text-[11px] font-semibold text-slate-400 mt-2">
            {uploading ? (lang === 'bn' ? 'ছবি আপলোড হচ্ছে...' : 'Uploading...') : (lang === 'bn' ? 'ছবি পরিবর্তন করতে ক্যামেরা আইকনে চাপুন' : 'Click camera to change photo')}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveProfile} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Omar Faruk"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'ইমেইল (অপরিবর্তনযোগ্য)' : 'Email'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'ফোন নম্বর' : 'Phone'}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXXXXXXXX"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {lang === 'bn' ? 'ঠিকানা' : 'Address'}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Dhaka, Bangladesh"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-[#F3D7D9] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/25 transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {saving
                  ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}