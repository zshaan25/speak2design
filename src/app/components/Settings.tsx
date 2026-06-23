import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Bell, Shield, Palette, Languages, CreditCard,
  ChevronRight, ArrowLeft, X, Save, Loader2, Crown,
  Check, Eye, EyeOff, Globe
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

interface SettingsProps {
  onBack: () => void;
  user: { name: string; email: string; avatar: string; tier?: string; id?: string };
  onUserUpdate?: (updatedUser: any) => void;
}

// ─── Profile Edit Modal ───────────────────────────────────────────────────────
const ProfileModal: React.FC<{ user: any; onClose: () => void; onSave: (u: any) => void }> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const body: any = { name, email };
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }

      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated!');
        onSave(data.user);
        onClose();
      } else {
        toast.error(data.message || 'Update failed.');
      }
    } catch {
      toast.error('Connection error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg text-gray-900">Edit Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Change Password (optional)</p>
            <div className="space-y-3">
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password"
                  className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <button type="button" onClick={() => setShowCurrent(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 chars)"
                  className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#0052CC] text-white font-bold text-sm hover:bg-[#0047b3] disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Language Modal ───────────────────────────────────────────────────────────
const LanguageModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selected, setSelected] = useState('English');
  const languages = [
    { code: 'English', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'Urdu', label: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  ];

  const handleSave = () => {
    localStorage.setItem('speak2design_lang', selected);
    toast.success(`Default voice language set to ${selected}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg text-gray-900">Voice Language</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-500">Choose your default voice command language for the workspace.</p>
          {languages.map(lang => (
            <button key={lang.code} onClick={() => setSelected(lang.code)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selected === lang.code ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
              }`}>
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left flex-1">
                <p className="font-bold text-gray-900 text-sm">{lang.label}</p>
                <p className="text-xs text-gray-500">{lang.native}</p>
              </div>
              {selected === lang.code && <Check className="w-5 h-5 text-blue-600" />}
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t">
          <button onClick={handleSave}
            className="w-full py-3 bg-[#0052CC] text-white font-bold rounded-xl hover:bg-[#0047b3] transition-all">
            Save Preference
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Settings Screen ──────────────────────────────────────────────────────────
export const SettingsScreen: React.FC<SettingsProps> = ({ onBack, user, onUserUpdate }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(user);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (currentUser.tier === 'premium') {
      toast.info('You are already on Premium!');
      return;
    }
    setIsUpgrading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/auth/upgrade`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Upgraded to Premium! Unlimited voice commands unlocked.');
        const updated = { ...currentUser, tier: 'premium' };
        setCurrentUser(updated);
        if (onUserUpdate) onUserUpdate(data.user);
      } else {
        toast.error(data.message || 'Upgrade failed.');
      }
    } catch {
      toast.error('Connection error.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleProfileSave = (updatedUser: any) => {
    const merged = {
      ...currentUser,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar
    };
    setCurrentUser(merged);
    if (onUserUpdate) onUserUpdate(merged);
    // Update localStorage token user data
    localStorage.setItem('speak2design_user', JSON.stringify(merged));
  };

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User, desc: 'Update your name, email, and password', action: () => setActiveModal('profile') },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Configure alert preferences', action: () => toast.info('Notification settings coming soon.') },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Password and account protection', action: () => setActiveModal('profile') },
    { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Light and dark theme options', action: () => toast.info('Theme toggle coming soon.') },
    { id: 'language', label: 'Voice Language', icon: Globe, desc: 'Default voice command language (English / Urdu)', action: () => setActiveModal('language') },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard, desc: 'Manage subscription and upgrade to Premium', action: handleUpgrade },
  ];

  return (
    <div className="pt-24 pb-12 px-8 max-w-4xl mx-auto min-h-screen">

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'profile' && (
          <ProfileModal user={currentUser} onClose={() => setActiveModal(null)} onSave={handleProfileSave} />
        )}
        {activeModal === 'language' && (
          <LanguageModal onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">

        {/* User Profile Summary */}
        <div className="p-10 bg-gray-50 border-b border-gray-100 flex items-center gap-6">
          <div className="w-20 h-20 bg-[#0052CC] text-white rounded-[32px] flex items-center justify-center font-bold text-3xl shadow-lg ring-4 ring-white">
            {currentUser.avatar || currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
            <p className="text-gray-500 font-medium">{currentUser.email}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                currentUser.tier === 'premium'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {currentUser.tier === 'premium' ? '⭐ Premium' : 'Free Individual'}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-green-200">
                Verified Account
              </span>
            </div>
          </div>
          <button onClick={() => setActiveModal('profile')}
            className="ml-auto px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all text-sm">
            Edit Profile
          </button>
        </div>

        {/* Premium Upgrade Banner */}
        {currentUser.tier !== 'premium' && (
          <div className="mx-6 mt-6 p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4" />
                <span className="font-bold text-sm">Upgrade to Premium</span>
              </div>
              <p className="text-xs text-blue-100">
                Unlock unlimited voice commands, priority AI processing, and exclusive templates.
              </p>
            </div>
            <button onClick={handleUpgrade} disabled={isUpgrading}
              className="ml-6 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-70">
              {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              {isUpgrading ? 'Upgrading…' : 'Upgrade Now'}
            </button>
          </div>
        )}

        {/* Settings Sections */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={section.action}
                className="flex items-center gap-5 p-5 rounded-2xl hover:bg-gray-50 transition-all text-left group border border-transparent hover:border-gray-100"
              >
                <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-[#0052CC] group-hover:border-blue-100 group-hover:bg-blue-50 transition-all shadow-sm flex-shrink-0">
                  <section.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm">{section.label}</h3>
                  <p className="text-xs text-gray-500 truncate">{section.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Speak2Design v2.0.0</p>
          <button
            onClick={() => {
              if (confirm('Deactivate account? This action cannot be undone.')) {
                toast.error('Account deactivation requires contacting support.');
              }
            }}
            className="text-red-500 font-bold text-sm hover:underline"
          >
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  );
};
