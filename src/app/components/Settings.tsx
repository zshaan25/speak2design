import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Bell, Shield, Palette, CreditCard,
  ChevronRight, ArrowLeft, X, Save, Loader2, Crown,
  Check, Eye, EyeOff, Globe, AlertTriangle, Trash2, PauseCircle,
  Sun, Moon, Type, Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../theme/ThemeContext';
import { GradientButton } from '../design/GradientButton';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

interface SettingsProps {
  onBack: () => void;
  user: { name: string; email: string; avatar: string; tier?: string; id?: string; authProvider?: string };
  onUserUpdate?: (updatedUser: any) => void;
  onSignOut?: () => void;
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
        className="glass-strong gradient-border rounded-2xl shadow-2xl text-white w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg text-white">Edit Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-violet/60 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-violet/60 text-sm" />
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Change Password (optional)</p>
            <div className="space-y-3">
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password"
                  className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-violet/60 text-sm" />
                <button type="button" onClick={() => setShowCurrent(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 chars)"
                  className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-violet/60 text-sm" />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 font-bold text-sm hover:bg-white/5">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-violet text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
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
        className="glass-strong gradient-border rounded-2xl shadow-2xl text-white w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg text-white">Voice Language</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-white/50">Choose your default voice command language for the workspace.</p>
          {languages.map(lang => (
            <button key={lang.code} onClick={() => setSelected(lang.code)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selected === lang.code ? 'border-brand-violet/60 bg-brand-indigo/15' : 'border-white/10 hover:border-white/20'
              }`}>
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left flex-1">
                <p className="font-bold text-white text-sm">{lang.label}</p>
                <p className="text-xs text-white/50">{lang.native}</p>
              </div>
              {selected === lang.code && <Check className="w-5 h-5 text-brand-cyan" />}
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t">
          <button onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-brand-indigo to-brand-violet text-white font-bold rounded-xl hover:opacity-90 transition-all">
            Save Preference
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Deactivate Modal ─────────────────────────────────────────────────────────
const DeactivateModal: React.FC<{
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isOAuth = user.authProvider === 'google' || user.authProvider === 'github';

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/auth/deactivate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: isOAuth ? undefined : password })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Account deactivated. You have been signed out.');
        setTimeout(onSuccess, 800);
      } else {
        toast.error(data.message || 'Deactivation failed.');
      }
    } catch {
      toast.error('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-strong gradient-border rounded-2xl shadow-2xl text-white w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <PauseCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-white">Deactivate Account</h3>
              <p className="text-xs text-white/50">Temporarily disable your account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> What happens when you deactivate?
            </h4>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>You will be immediately signed out</li>
              <li>Your profile and projects are hidden but <strong>not deleted</strong></li>
              <li>You can reactivate any time by logging back in</li>
            </ul>
          </div>

          {/* Password confirmation (only for local accounts) */}
          {!isOAuth && (
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                Confirm your password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {isOAuth && (
            <p className="text-sm text-white/60 bg-white/5 border border-white/10 rounded-xl p-4">
              You signed in with <strong className="capitalize">{user.authProvider}</strong>. No password is required — just confirm below to deactivate.
            </p>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 font-bold text-sm hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDeactivate}
            disabled={loading || (!isOAuth && !password.trim())}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
            Deactivate Account
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────
const DeleteModal: React.FC<{
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isOAuth = user.authProvider === 'google' || user.authProvider === 'github';

  const canSubmit = confirmation === 'DELETE' && (isOAuth || password.trim());

  const handleDelete = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: isOAuth ? undefined : password, confirmation })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Your account has been permanently deleted.');
        setTimeout(onSuccess, 800);
      } else {
        toast.error(data.message || 'Deletion failed.');
      }
    } catch {
      toast.error('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-strong gradient-border rounded-2xl shadow-2xl text-white w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-white">Delete Account</h3>
              <p className="text-xs text-white/50">This action is permanent and cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Warning box */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> You will permanently lose:
            </h4>
            <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
              <li>Your account and profile ({user.email})</li>
              <li>All your saved projects and components</li>
              <li>Any purchased marketplace templates</li>
              <li>This action <strong>cannot be reversed</strong></li>
            </ul>
          </div>

          {/* Password (local accounts only) */}
          {!isOAuth && (
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-red-400 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Type DELETE confirmation */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
              Type <span className="text-red-600 font-black">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl outline-none text-sm font-mono tracking-wider transition-colors ${
                confirmation === 'DELETE'
                  ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                  : 'border-white/10 focus:ring-2 focus:ring-gray-300'
              }`}
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 font-bold text-sm hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canSubmit || loading}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Permanently Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Modal shell ──────────────────────────────────────────────────────────────
const ModalShell: React.FC<{ title: string; icon: any; onClose: () => void; children: React.ReactNode }> = ({ title, icon: Icon, onClose, children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="glass-strong gradient-border rounded-2xl shadow-2xl w-full max-w-md text-white">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h3 className="font-display font-bold text-lg flex items-center gap-2"><Icon className="w-5 h-5 text-brand-violet" /> {title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-white/60"><X className="w-5 h-5" /></button>
      </div>
      {children}
    </motion.div>
  </div>
);

const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-brand-violet' : 'bg-white/15'}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
  </button>
);

// ─── Notifications ────────────────────────────────────────────────────────────
const NotificationsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const KEY = 'speak2design_notifs';
  const [prefs, setPrefs] = useState(() => {
    try { return { email: true, productUpdates: true, marketing: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch { return { email: true, productUpdates: true, marketing: false }; }
  });
  const toggle = (k: string) => setPrefs((p: any) => ({ ...p, [k]: !p[k] }));
  const save = () => { localStorage.setItem(KEY, JSON.stringify(prefs)); toast.success('Notification preferences saved.'); onClose(); };
  const rows = [
    { k: 'email', label: 'Email notifications', desc: 'Account and project activity' },
    { k: 'productUpdates', label: 'Product updates', desc: 'New features and improvements' },
    { k: 'marketing', label: 'Marketing emails', desc: 'Tips, offers and news' },
  ];
  return (
    <ModalShell title="Notifications" icon={Bell} onClose={onClose}>
      <div className="p-6 space-y-4">
        {rows.map(r => (
          <div key={r.k} className="flex items-center justify-between gap-4">
            <div><p className="text-sm font-bold text-white">{r.label}</p><p className="text-xs text-white/50">{r.desc}</p></div>
            <Toggle on={prefs[r.k]} onChange={() => toggle(r.k)} />
          </div>
        ))}
        <GradientButton full onClick={save}>Save Preferences</GradientButton>
      </div>
    </ModalShell>
  );
};

// ─── Appearance ───────────────────────────────────────────────────────────────
const AppearanceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const FONTS = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display', 'Nunito'];
  const [font, setFont] = useState(() => { try { return localStorage.getItem('speak2design_canvas_font') || 'Inter'; } catch { return 'Inter'; } });
  const applyFont = (f: string) => { setFont(f); localStorage.setItem('speak2design_canvas_font', f); toast.success(`Canvas font set to ${f}.`); };
  return (
    <ModalShell title="Appearance" icon={Palette} onClose={onClose}>
      <div className="p-6 space-y-5">
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Theme</p>
          <div className="grid grid-cols-2 gap-2">
            {([['dark', 'Dark', Moon], ['light', 'Light', Sun]] as const).map(([val, lbl, Icon]) => (
              <button key={val} onClick={() => setTheme(val)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                  theme === val ? 'border-brand-violet/60 bg-brand-indigo/15 text-brand-cyan' : 'border-white/10 text-white/60 hover:bg-white/5'
                }`}>
                <Icon className="w-4 h-4" /> {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Canvas Font</p>
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map(f => (
              <button key={f} onClick={() => applyFont(f)}
                className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  font === f ? 'border-brand-violet/60 bg-brand-indigo/15 text-brand-cyan' : 'border-white/10 text-white/65 hover:bg-white/5'
                }`}>{f}</button>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Billing ──────────────────────────────────────────────────────────────────
const BillingModal: React.FC<{ user: any; isUpgrading: boolean; onUpgrade: () => void; onClose: () => void }> = ({ user, isUpgrading, onUpgrade, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('speak2design_token');
        const res = await fetch(`${API_BASE}/api/marketplace/library`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (d.success) setHistory(d.templates || []);
      } catch { /* ignore */ }
    })();
  }, []);
  const isPremium = user.tier === 'premium';
  return (
    <ModalShell title="Billing & Plans" icon={CreditCard} onClose={onClose}>
      <div className="p-6 space-y-5">
        <div className="rounded-2xl p-4 gradient-border" style={{ background: 'linear-gradient(150deg, rgba(99,102,241,.25), rgba(6,182,212,.15))' }}>
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Current plan</p>
          <p className="font-display text-2xl font-bold text-white mt-1 flex items-center gap-2">
            {isPremium ? <><Crown className="w-5 h-5 text-brand-amber" /> Premium</> : 'Free'}
          </p>
          <p className="text-xs text-white/55 mt-1">{isPremium ? 'Unlimited commands, downloads & publishing.' : '10 commands / 30-day window · copy-only export.'}</p>
        </div>
        {!isPremium && (
          <GradientButton full onClick={onUpgrade} disabled={isUpgrading}>
            {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
            {isUpgrading ? 'Upgrading…' : 'Upgrade to Premium'}
          </GradientButton>
        )}
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> Payment history</p>
          {history.length === 0 ? (
            <p className="text-sm text-white/40 italic">No purchases yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {history.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-white/80 truncate">{t.title}</span>
                  <span className="text-white/50 font-mono text-xs">Rs {t.price ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Settings Screen ──────────────────────────────────────────────────────────
export const SettingsScreen: React.FC<SettingsProps> = ({ onBack, user, onUserUpdate, onSignOut }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(user);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Called after deactivate or delete — clear token + redirect to login
  const handleAccountRemoved = () => {
    localStorage.removeItem('speak2design_token');
    localStorage.removeItem('speak2design_user');
    setActiveModal(null);
    if (onSignOut) onSignOut();
  };

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
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email, product updates, marketing', action: () => setActiveModal('notifications') },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Change password, sessions', action: () => setActiveModal('profile') },
    { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme (light/dark) and canvas font', action: () => setActiveModal('appearance') },
    { id: 'language', label: 'Voice Language', icon: Globe, desc: 'Default voice command language (English / Urdu)', action: () => setActiveModal('language') },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard, desc: 'Manage subscription and upgrade to Premium', action: () => setActiveModal('billing') },
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
        {activeModal === 'notifications' && (
          <NotificationsModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'appearance' && (
          <AppearanceModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'billing' && (
          <BillingModal user={currentUser} isUpgrading={isUpgrading} onUpgrade={handleUpgrade} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'deactivate' && (
          <DeactivateModal
            user={currentUser}
            onClose={() => setActiveModal(null)}
            onSuccess={handleAccountRemoved}
          />
        )}
        {activeModal === 'delete' && (
          <DeleteModal
            user={currentUser}
            onClose={() => setActiveModal(null)}
            onSuccess={handleAccountRemoved}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="glass-strong gradient-border rounded-[40px] overflow-hidden">

        {/* User Profile Summary */}
        <div className="p-10 bg-white/5 border-b border-white/10 flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-r from-brand-indigo to-brand-violet text-white rounded-[32px] flex items-center justify-center font-bold text-3xl shadow-lg ring-4 ring-white">
            {currentUser.avatar || currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{currentUser.name}</h2>
            <p className="text-white/50 font-medium">{currentUser.email}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                currentUser.tier === 'premium'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-white/10 text-white/60 border-white/10'
              }`}>
                {currentUser.tier === 'premium' ? '⭐ Premium' : 'Free Individual'}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-green-200">
                Verified Account
              </span>
            </div>
          </div>
          <button onClick={() => setActiveModal('profile')}
            className="ml-auto px-6 py-2.5 glass rounded-xl font-bold text-white/80 hover:text-white hover:border-white/25 transition-all text-sm">
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
                className="flex items-center gap-5 p-5 rounded-2xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/10"
              >
                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-white/50 group-hover:text-brand-cyan group-hover:border-white/25 transition-all flex-shrink-0">
                  <section.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white mb-0.5 text-sm">{section.label}</h3>
                  <p className="text-xs text-white/50 truncate">{section.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mx-6 mb-6 border border-red-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-red-700 text-sm uppercase tracking-widest">Danger Zone</h3>
          </div>
          <div className="divide-y divide-red-100">
            {/* Deactivate */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <PauseCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Deactivate Account</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Temporarily disable your account. All your data is preserved and you can reactivate by logging back in.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('deactivate')}
                className="flex-shrink-0 px-4 py-2 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl font-bold text-xs transition-colors"
              >
                Deactivate
              </button>
            </div>

            {/* Delete */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Delete Account</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Permanently delete your account and all data including projects and purchased templates. This cannot be undone.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('delete')}
                className="flex-shrink-0 px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-xs transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 flex items-center justify-between">
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Speak2Design v2.0.0</p>
          <p className="text-xs text-white/40">F25-106 · University of Lahore</p>
        </div>
      </div>
    </div>
  );
};
