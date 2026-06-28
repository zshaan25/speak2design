import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, LayoutGrid, ShoppingBag, LogOut, Info, Search, Bell, Star, Trash2, Users, Crown, Sun, Moon, Clock, FileText, Archive, Check, ShoppingCart, Upload, CheckCircle2 } from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';
import { useTheme } from '../theme/ThemeContext';
import { useLang } from '../i18n/LanguageContext';
import { Logo } from '../design/Logo';

interface LayoutProps {
  children?: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  user: { name: string; avatar: string; tier?: string };
}

const LogoMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative flex items-center justify-center rounded-xl anim-gradient ${className}`}
    style={{ background: 'linear-gradient(120deg,#10b981,#14b8a6,#06b6d4)' }}>
    <Mic className="text-white w-5 h-5" />
  </div>
);

export const Sidebar: React.FC<{ currentPage: string; onNavigate: (page: string) => void; activeView?: string }> = ({ currentPage, onNavigate, activeView = 'all' }) => {
  const { t } = useLang();
  const mainItems = [
    { id: 'dashboard', label: t('myProjects'), icon: LayoutGrid, view: 'all' },
    { id: 'recent', label: t('recent'), icon: Clock, view: 'recent' },
    { id: 'workspace', label: t('workspace'), icon: Mic },
    { id: 'marketplace', label: t('marketplace'), icon: ShoppingBag },
  ];
  const secondaryItems = [
    { id: 'favorites', label: t('favorites'), icon: Star, view: 'favorites' },
    { id: 'drafts', label: t('drafts'), icon: FileText, view: 'drafts' },
    { id: 'shared', label: t('shared'), icon: Users, view: 'shared' },
    { id: 'archived', label: t('archived'), icon: Archive, view: 'archived' },
    { id: 'trash', label: t('trash'), icon: Trash2, view: 'trash' },
  ];

  // A view item is active only on the dashboard with the matching filter.
  const isActive = (item: { id: string; view?: string }) =>
    item.view ? currentPage === 'dashboard' && activeView === item.view : currentPage === item.id;

  const renderItem = (item: any, bold = true) => {
    const active = isActive(item);
    return (
      <motion.button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        whileHover={{ x: 3 }}
        className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${bold ? 'font-bold' : 'font-medium'} ${
          active ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/5'
        }`}
      >
        {active && (
          <span className="absolute inset-0 rounded-xl gradient-border glow-indigo"
            style={{ background: 'linear-gradient(120deg, rgba(99,102,241,.25), rgba(6,182,212,.18))' }} />
        )}
        <item.icon className={`relative z-10 w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-brand-cyan' : ''}`} />
        <span className="relative z-10">{item.label}</span>
      </motion.button>
    );
  };

  return (
    <aside className="w-64 glass border-r border-white/10 flex flex-col fixed left-0 top-16 bottom-0 z-40">
      <div className="flex-1 p-4 space-y-7 overflow-y-auto">
        <div>
          <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3 ml-4">{t('mainNavigation')}</p>
          <nav className="space-y-1.5">{mainItems.map((item) => renderItem(item, true))}</nav>
        </div>

        <div>
          <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3 ml-4">{t('workspaceSection')}</p>
          <nav className="space-y-1">{secondaryItems.map((item) => renderItem(item, false))}</nav>
        </div>

        <div className="px-1">
          <div className="relative overflow-hidden rounded-2xl p-4 gradient-border glow-indigo"
            style={{ background: 'linear-gradient(150deg, rgba(99,102,241,.3), rgba(139,92,246,.18), rgba(6,182,212,.18))' }}>
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-violet/40 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-bold text-brand-cyan mb-1 flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> {t('proPlan')}</p>
              <p className="text-sm font-bold text-white mb-3">{t('unlockUnlimited')}</p>
              <button onClick={() => onNavigate('settings')}
                className="w-full bg-white text-[#0b1120] py-2 rounded-xl text-xs font-bold hover:bg-white/90 transition-colors">
                {t('upgradeNow')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <button onClick={() => onNavigate('logout')}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
          <LogOut className="w-5 h-5" /> <span>{t('signOut')}</span>
        </button>
      </div>
    </aside>
  );
};

// ─── Notification bell with live dropdown ─────────────────────────────────────
interface Notif { _id: string; type: string; title: string; message: string; read: boolean; createdAt: string; }

const NOTIF_ICON: Record<string, React.ReactNode> = {
  publish:  <Upload className="w-3.5 h-3.5 text-brand-violet" />,
  sale:     <ShoppingBag className="w-3.5 h-3.5 text-brand-amber" />,
  purchase: <ShoppingCart className="w-3.5 h-3.5 text-brand-cyan" />,
  success:  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  info:     <Bell className="w-3.5 h-3.5 text-white/60" />,
};

const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem('speak2design_token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setItems(data.notifications); setUnread(data.unread); }
    } catch { /* non-fatal */ }
  }, []);

  // Initial load + light polling so new activity surfaces without a refresh.
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  // Close on outside click.
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) { await load(); }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('speak2design_token');
      await fetch(`${API_BASE}/api/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      setItems(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* non-fatal */ }
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle}
        className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-colors relative">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-brand-pink text-[9px] font-black text-white ring-2 ring-[#0b1120]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="absolute right-0 mt-2 w-80 glass-strong border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="font-bold text-white text-sm">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11px] font-bold text-brand-cyan hover:text-white flex items-center gap-1 transition-colors">
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-10 text-center text-white/40 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No notifications yet.
                </div>
              ) : (
                items.map(n => (
                  <div key={n._id} className={`flex gap-3 px-4 py-3 border-b border-white/5 transition-colors ${n.read ? 'opacity-60' : 'bg-white/[0.03]'}`}>
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {NOTIF_ICON[n.type] || NOTIF_ICON.info}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white leading-snug">{n.title}</p>
                      {n.message && <p className="text-[11px] text-white/75 leading-snug mt-0.5 break-words">{n.message}</p>}
                      <p className="text-[10px] text-white/45 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-pink flex-shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TopNavbar: React.FC<LayoutProps> = ({ currentPage, onNavigate, user }) => {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLang();
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 glass border-b border-white/10 px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <Logo className="w-9 h-9" />
          <span className="font-display font-bold text-xl text-white tracking-tight">Speak2Design</span>
        </div>
        <div className="hidden md:flex items-center glass rounded-xl px-4 py-2 w-80 focus-within:border-white/25 transition-colors">
          <Search className="w-4 h-4 text-white/40 mr-2" />
          <input type="text" placeholder={t('searchEverything')}
            className="bg-transparent border-none text-sm text-white placeholder-white/30 outline-none w-full" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggleLang} title="Switch language / زبان تبدیل کریں"
          className="px-2.5 py-1.5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          {lang === 'en' ? 'EN' : 'اردو'}
        </button>
        <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <NotificationBell />
        <div className="h-8 w-px bg-white/10 mx-1" />
        <button onClick={() => onNavigate('settings')}
          className={`flex items-center gap-3 pl-3 pr-1.5 py-1 rounded-full transition-all border ${
            currentPage === 'settings' ? 'border-brand-violet/40 bg-white/5' : 'border-transparent hover:bg-white/5'
          }`}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{user.name}</p>
            <p className="text-[10px] font-bold text-brand-cyan uppercase mt-0.5">{user.tier === 'premium' ? t('premium') : t('freeAccount')}</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ring-2 ring-white/10 anim-gradient"
            style={{ background: 'linear-gradient(120deg,#10b981,#14b8a6)' }}>
            {user.avatar}
          </div>
        </button>
      </div>
    </nav>
  );
};

export const Annotation: React.FC<{ title: string; text: string }> = ({ title, text }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <div className="absolute bottom-full right-0 mb-4 w-64 glass-strong text-white p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0 duration-200">
        <h4 className="font-bold text-sm mb-1 text-brand-cyan flex items-center gap-2"><Info className="w-4 h-4" /> {title}</h4>
        <p className="text-xs text-white/60 leading-relaxed">{text}</p>
      </div>
      <button className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg glow-indigo transition-transform hover:scale-110 anim-gradient"
        style={{ background: 'linear-gradient(120deg,#10b981,#14b8a6,#06b6d4)' }}>
        <Info className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};
