import React, { useState, useEffect } from 'react';
import { FiUser, FiLock, FiCheckCircle, FiAlertCircle, FiSave, FiKey, FiEye, FiEyeOff, FiHome } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUserProfile, isAdmin, systemDairyName, updateSystemDairyName } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [userCode, setUserCode] = useState(user?.userCode || (user?.role === 'admin' ? 'ADM-001' : 'FARM-001'));
  const [phone, setPhone] = useState(user?.phone || '');
  const [dairyName, setDairyName] = useState(systemDairyName || user?.dairyName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    fetchLatestProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setUserCode(user.userCode || (user.role === 'admin' ? 'ADM-001' : 'FARM-001'));
      setPhone(user.phone || '');
      setDairyName(systemDairyName || user.dairyName || '');
    }
  }, [user, systemDairyName]);

  const fetchLatestProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        updateUserProfile(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch latest profile:', error);
    }
  };



  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);
    try {
      const payload = { name, phone };
      if (isAdmin) {
        payload.username = username;
        payload.userCode = userCode;
        payload.dairyName = dairyName;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        updateUserProfile(res.data.data);
        if (isAdmin && dairyName) {
          updateSystemDairyName(dairyName);
        }
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile.'
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.post('/auth/change-password', { newPassword });
      if (res.data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password.'
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-indigo-600/30">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-main">{user?.name}</h1>
            <p className="text-xs sm:text-sm text-text-sub">@{user?.username} &bull; <span className="uppercase font-semibold text-primary">{user?.role}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono font-bold shadow-2xs">
            #{user?.userCode || (user?.role === 'admin' ? 'ADM-001' : 'FARM-001')}
          </span>
        </div>
      </div>

      {/* 1. Edit Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FiUser className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-text-main">Personal Information</h2>
        </div>

        {profileMessage && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            profileMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {profileMessage.type === 'success' ? <FiCheckCircle className="w-4 h-4 text-emerald-600" /> : <FiAlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">
              Username {isAdmin ? '(Editable by Admin)' : '(Read Only)'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isAdmin}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                isAdmin
                  ? 'bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40'
                  : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">
              {isAdmin ? 'Admin Code' : 'Farmer Code'} {isAdmin ? '(Editable by Admin)' : '(Read Only)'}
            </label>
            <input
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              disabled={!isAdmin}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold uppercase transition-all ${
                isAdmin
                  ? 'bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40'
                  : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">
              Dairy Name {isAdmin ? '(Editable by Admin)' : '(Read Only - Set by Admin)'}
            </label>
            <input
              type="text"
              value={dairyName}
              onChange={(e) => setDairyName(e.target.value)}
              disabled={!isAdmin}
              placeholder="e.g. Aavin Dairy, Heritage Dairy"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                isAdmin
                  ? 'bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40'
                  : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={profileSaving}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2"
          >
            <FiSave className="w-4 h-4" />
            <span>{profileSaving ? 'Saving...' : 'Update Profile'}</span>
          </button>
        </div>
      </form>

      {/* 2. Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FiKey className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-text-main">Change Password</h2>
        </div>

        {passwordMessage && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            passwordMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {passwordMessage.type === 'success' ? <FiCheckCircle className="w-4 h-4 text-emerald-600" /> : <FiAlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">New Password *</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Confirm New Password *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2"
          >
            <FiLock className="w-4 h-4" />
            <span>{passwordSaving ? 'Updating Password...' : 'Change Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
