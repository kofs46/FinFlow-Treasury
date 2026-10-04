import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../supabaseClient';
import { 
  X, 
  Camera, 
  Save, 
  Phone, 
  MapPin, 
  User, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, profile, fetchProfile } = useAuth();
  const { lang } = useLang();

  // Profile Info States
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  // Password Change States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // General States
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  // Avatar Upload
  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error) {
      alert('Avatar upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Save Profile Info
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      phone: phone,
      address: address,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    });

    if (!error) {
      setStatusMsg(lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!');
      await fetchProfile(user.id);
      setTimeout(() => {
        setStatusMsg('');
      }, 2000);
    } else {
      alert('Update failed: ' + error.message);
    }
    setSaving(false);
  };

  // Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');

    if (newPassword.length < 6) {
      setPasswordError(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(lang === 'bn' ? 'পাসওয়ার্ড দুটি মেলেনি।' : 'Passwords do not match.');
      return;
    }

    setPasswordUpdating(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMsg(lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    }
    setPasswordUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-slate-900 mb-1">
          {lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          {lang === 'bn' ? 'আপনার ব্যক্তিগত তথ্য ও সিকিউরিটি পরিচালনা করুন' : 'Manage your identity, email & security credentials'}
        </p>

        {statusMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* 1. Identity & Avatar */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-indigo-600 shadow-md bg-slate-50 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white cursor-pointer shadow-md transition transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {uploading ? (lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...') : (lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Click camera to change photo')}
            </p>
          </div>

          {/* Email (Readonly Badge) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Registered Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Monirul Islam"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                placeholder="+8801XXXXXXXXX"
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'bn' ? 'ঠিকানা' : 'Address'}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={address}
                placeholder="Dhaka, Bangladesh"
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'তথ্য সংরক্ষণ করুন' : 'Save Details')}</span>
          </button>
        </form>

        {/* 2. Security: Change Password Card */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                {lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'নতুন পাসওয়ার্ড সেট করে সুরক্ষিত রাখুন' : 'Set a new secure password for your account'}
              </p>
            </div>
          </div>

          {passwordMsg && (
            <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{passwordMsg}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordUpdating}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow transition disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{passwordUpdating ? (lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...') : (lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}