import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User, Mail, Lock, Save, Camera, Trash2, AlertCircle, CheckCircle2, X, XCircle } from 'lucide-react';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB

type ToastType = 'success' | 'error';
type ToastState = { type: ToastType; message: string } | null;

const Profile: React.FC = () => {
  const [formData, setFormData] = useState({
    name: 'Mr. Doctor',
    email: 'admin@dms.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ type, message });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };
  const closeToast = () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(null);
  };

  // Create initials from name
  const initials = useMemo(() => {
    return formData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  }, [formData.name]);

  // Clean up object URL on unmount / change
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [avatarPreview]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const pickImage = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;

    // Basic validation
    if (!f.type.startsWith('image/')) {
      const msg = 'Please select a valid image file.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      const msg = 'Image is too large. Please use an image under 3MB.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    // Revoke previous preview if any
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    const url = URL.createObjectURL(f);
    setAvatarFile(f);
    setAvatarPreview(url);
    showToast('Photo selected. Don’t forget to Save Profile.');
  };

  const removeAvatar = () => {
    setError(null);
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    showToast('Photo removed.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Example payload; wire to your API
    // const body = new FormData();
    // body.append('name', formData.name);
    // body.append('email', formData.email);
    // if (formData.newPassword) body.append('newPassword', formData.newPassword);
    // if (avatarFile) body.append('avatar', avatarFile);
    // await fetch('/api/profile', { method: 'POST', body });
    // if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);

    console.log('Profile updated:', { ...formData, avatarFile });
    showToast('Profile saved successfully ', 'success');
  };

  return (
    <div className="space-y-6 relative text-gray-100">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-[60]">
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg bg-gray-900 ring-1 ring-white/5 ${
              toast.type === 'success' ? 'border-green-800' : 'border-red-800'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="text-sm text-gray-200">{toast.message}</div>
            <button
              onClick={closeToast}
              className="ml-2 p-1 rounded hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 ring-1 ring-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-100">Profile</h1>
            </div>
            <p className="text-gray-400">Manage your personal information</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Last updated</p>
            <p className="font-semibold text-gray-200">August 20, 2024</p>
            <p className="text-xs text-gray-500">2:15 PM</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 ring-1 ring-white/5">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">Doctor Profile</h2>
          </div>
          <p className="text-gray-500 mt-1">Update your basic information</p>
        </div>

        <div className="p-6">
          {/* AVATAR */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {/* Circle avatar */}
              <div className="w-28 h-28 rounded-full bg-blue-500/15 overflow-hidden flex items-center justify-center ring-1 ring-blue-500/30 shadow">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-300">
                    {initials}
                  </span>
                )}
              </div>

              {/* Change button (floating) */}
              <button
                type="button"
                onClick={pickImage}
                className="absolute -right-1 -bottom-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-600 text-white text-xs shadow hover:bg-blue-700"
              >
                <Camera className="w-3.5 h-3.5" />
                Change
              </button>
            </div>

            {/* Secondary actions */}
            <div className="mt-3 flex items-center gap-2">
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-800 text-red-300 hover:bg-red-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />

            {/* Inline error */}
            {error && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Doctor Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-700 bg-gray-950 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-700 bg-gray-950 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You'll need to log out and log back in if you change your email
              </p>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Leave blank to keep current password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-700 bg-gray-950 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to keep your current password
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              <span>Save Profile</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
