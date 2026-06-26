import React from 'react';
import { motion } from 'motion/react';
import { Mic, LayoutGrid, ShoppingBag, LogOut, Info, Search, Bell, Star, Trash2, Users, Crown, Sun, Moon, Clock, FileText, Archive } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

interface LayoutProps {
  children?: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  user: { name: string; avatar: string; tier?: string };
}

const LogoMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative flex items-center justify-center rounded-xl anim-gradient ${className}`}
    style={{ background: 'linear-gradient(120deg,#6366f1,#8b5cf6,#06b6d4)' }}>
    <Mic className="text-white w-5 h-5" />
  </div>
);

export const Sidebar: React.FC<{ currentPage: string; onNavigate: (page: string) => void; activeView?: string }> = ({ currentPage, onNavigate, activeView = 'all' }) => {
  const mainItems = [
    { id: 'dashboard', label: 'My Projects', icon: LayoutGrid, view: 'all' },
    { id: 'recent', label: 'Recent', icon: Clock, view: 'recent' },
    { id: 'workspace', label: 'Workspace', icon: Mic },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  ];
  const secondaryItems = [
    { id: 'favorites', label: 'Favorites', icon: Star, view: 'favorites' },
    { id: 'drafts', label: 'Drafts', icon: FileText, view: 'drafts' },
    { id: 'shared', label: 'Shared with me', icon: Users, view: 'shared' },
    { id: 'archived', label: 'Archived', icon: Archive, view: 'archived' },
    { id: 'trash', label: 'Trash', icon: Trash2, view: 'trash' },
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
          <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3 ml-4">Main Navigation</p>
          <nav className="space-y-1.5">{mainItems.map((item) => renderItem(item, true))}</nav>
        </div>

        <div>
          <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3 ml-4">Workspace</p>
          <nav className="space-y-1">{secondaryItems.map((item) => renderItem(item, false))}</nav>
        </div>

        <div className="px-1">
          <div className="relative overflow-hidden rounded-2xl p-4 gradient-border glow-indigo"
            style={{ background: 'linear-gradient(150deg, rgba(99,102,241,.3), rgba(139,92,246,.18), rgba(6,182,212,.18))' }}>
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-violet/40 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-bold text-brand-cyan mb-1 flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Pro Plan</p>
              <p className="text-sm font-bold text-white mb-3">Unlock unlimited voice projects</p>
              <button onClick={() => onNavigate('settings')}
                className="w-full bg-white text-[#0b1120] py-2 rounded-xl text-xs font-bold hover:bg-white/90 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <button onClick={() => onNavigate('logout')}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
          <LogOut className="w-5 h-5" /> <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export const TopNavbar: React.FC<LayoutProps> = ({ currentPage, onNavigate, user }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 glass border-b border-white/10 px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <LogoMark className="w-9 h-9" />
          <span className="font-display font-bold text-xl text-white tracking-tight">Speak2Design</span>
        </div>
        <div className="hidden md:flex items-center glass rounded-xl px-4 py-2 w-80 focus-within:border-white/25 transition-colors">
          <Search className="w-4 h-4 text-white/40 mr-2" />
          <input type="text" placeholder="Search everything…"
            className="bg-transparent border-none text-sm text-white placeholder-white/30 outline-none w-full" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-pink rounded-full ring-2 ring-[#0b1120]" />
        </button>
        <div className="h-8 w-px bg-white/10 mx-1" />
        <button onClick={() => onNavigate('settings')}
          className={`flex items-center gap-3 pl-3 pr-1.5 py-1 rounded-full transition-all border ${
            currentPage === 'settings' ? 'border-brand-violet/40 bg-white/5' : 'border-transparent hover:bg-white/5'
          }`}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{user.name}</p>
            <p className="text-[10px] font-bold text-brand-cyan uppercase mt-0.5">{user.tier === 'premium' ? 'Premium' : 'Free Account'}</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ring-2 ring-white/10 anim-gradient"
            style={{ background: 'linear-gradient(120deg,#6366f1,#8b5cf6)' }}>
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
        style={{ background: 'linear-gradient(120deg,#6366f1,#8b5cf6,#06b6d4)' }}>
        <Info className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};
