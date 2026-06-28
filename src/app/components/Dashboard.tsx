import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Clock, Globe, Trash2, CheckCircle2, FolderOpen, Mic, LayoutTemplate, ShoppingBag, Star, RotateCcw, Sparkles, Wand2, X, ArrowRight, Archive, Upload, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '../design/GlassCard';
import { GradientButton } from '../design/GradientButton';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

interface DashboardProps {
  onNewProject: (prompt?: string) => void;
  onSelectProject: (id: string) => void;
  showSuccess?: boolean;
  filter?: string;
  onNavigate?: (page: string) => void;
}

// #17: guided "create a website" onboarding modal.
const CreateWebsiteModal: React.FC<{ onClose: () => void; onNewProject: (prompt?: string) => void; onBrowse: () => void }> = ({ onClose, onNewProject, onBrowse }) => {
  const [prompt, setPrompt] = useState('');
  const EXAMPLES = ['An e-commerce store for sneakers', 'A SaaS landing page with pricing', 'A personal portfolio with projects', 'A restaurant website with menu'];
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="glass-strong gradient-border rounded-3xl w-full max-w-2xl text-white overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="font-display text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-amber" /> Create a Website</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-white/60"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Option 1 — AI */}
          <div>
            <p className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Wand2 className="w-4 h-4 text-brand-violet" /> Describe it — AI builds it</p>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2}
              placeholder="e.g. A modern e-commerce website for handmade jewellery…"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-violet/60 resize-none text-sm" />
            <div className="flex flex-wrap gap-2 mt-2">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)}
                  className="text-[11px] px-2.5 py-1 rounded-full glass text-white/60 hover:text-white hover:border-white/25 transition-all">{ex}</button>
              ))}
            </div>
            <GradientButton tone="green" full onClick={() => { onClose(); onNewProject(prompt); }} disabled={!prompt.trim()} className="mt-3">
              <Wand2 className="w-4 h-4" /> Generate with AI <ArrowRight className="w-4 h-4" />
            </GradientButton>
          </div>
          <div className="flex items-center gap-3 text-white/30 text-xs"><div className="flex-1 border-t border-white/10" /> or <div className="flex-1 border-t border-white/10" /></div>
          {/* Options 2 + 3 */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { onClose(); onBrowse(); }}
              className="glass rounded-xl p-4 text-left hover:border-white/25 transition-all group">
              <LayoutTemplate className="w-6 h-6 text-brand-cyan mb-2" />
              <p className="font-bold text-sm text-white">Start from a template</p>
              <p className="text-xs text-white/45">Browse the marketplace</p>
            </button>
            <button onClick={() => { onClose(); onNewProject(); }}
              className="glass rounded-xl p-4 text-left hover:border-white/25 transition-all group">
              <Plus className="w-6 h-6 text-brand-teal mb-2" />
              <p className="font-bold text-sm text-white">Blank canvas</p>
              <p className="text-xs text-white/45">Build from scratch</p>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const VIEW_TITLES: Record<string, { title: string; sub: string }> = {
  all:       { title: 'My Projects',     sub: 'All your designs' },
  recent:    { title: 'Recent',          sub: 'Recently updated' },
  favorites: { title: 'Favorites',       sub: 'Starred projects' },
  drafts:    { title: 'Drafts',          sub: 'Empty / unfinished projects' },
  shared:    { title: 'Shared with me',  sub: 'Publicly shared designs' },
  archived:  { title: 'Archived',        sub: 'Archived projects' },
  trash:     { title: 'Trash',           sub: 'Deleted projects — restore or remove forever' },
};

const PROJECT_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-pink-500 to-rose-500',
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-orange-400 to-pink-500',
  'from-blue-600 to-indigo-800',
  'from-violet-500 to-purple-600',
  'from-amber-400 to-orange-500',
];

// #6: quick-start templates surfaced on the projects page. "Use Template" seeds an
// AI prompt so the page is generated immediately; "Preview" opens the marketplace.
const STARTER_TEMPLATES = [
  { name: 'Login Page',   category: 'Auth',      prompt: 'Create a modern centered login page with email and password fields and a sign-in button', tint: 'from-blue-500 to-indigo-600' },
  { name: 'Signup Page',  category: 'Auth',      prompt: 'Create a clean signup page with name, email, password fields and a create-account button', tint: 'from-violet-500 to-purple-600' },
  { name: 'Landing Page', category: 'Marketing', prompt: 'Create a SaaS landing page with a hero section, features grid, pricing and a footer', tint: 'from-cyan-400 to-blue-500' },
  { name: 'Dashboard',    category: 'App',       prompt: 'Create an analytics dashboard with a sidebar, stat cards and a data table', tint: 'from-emerald-400 to-teal-500' },
  { name: 'Portfolio',    category: 'Personal',  prompt: 'Create a personal portfolio with a hero intro, projects grid and a contact section', tint: 'from-orange-400 to-pink-500' },
  { name: 'E-commerce',   category: 'Store',     prompt: 'Create an e-commerce store homepage with a navbar, product grid and a featured banner', tint: 'from-pink-500 to-rose-500' },
  { name: 'Blog',         category: 'Content',   prompt: 'Create a blog homepage with a header, featured article and a list of post cards', tint: 'from-amber-400 to-orange-500' },
  { name: 'Admin Panel',  category: 'App',       prompt: 'Create an admin panel with a sidebar navigation, top bar and a management table', tint: 'from-blue-600 to-indigo-800' },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNewProject, onSelectProject, showSuccess, filter = 'all', onNavigate }) => {
  const view = VIEW_TITLES[filter] || VIEW_TITLES.all;
  const isTrash = filter === 'trash';
  const isArchivedView = filter === 'archived';
  const [visibleSuccess, setVisibleSuccess] = useState(showSuccess);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'All' | 'English' | 'Urdu'>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  // Publish-a-project-to-marketplace modal
  const [publishTarget, setPublishTarget] = useState<any | null>(null);
  const [publishForm, setPublishForm] = useState({ title: '', description: '', price: '0', language: 'English' });
  const [publishing, setPublishing] = useState(false);

  const openPublish = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setPublishForm({ title: project.title || 'My Template', description: '', price: '0', language: project.language || 'English' });
    setPublishTarget(project);
  };

  const handlePublishProject = async () => {
    if (!publishTarget) return;
    if (!publishForm.title.trim() || !publishForm.description.trim()) { toast.error('Add a title and description.'); return; }
    setPublishing(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          designId: publishTarget._id,
          title: publishForm.title.trim(),
          description: publishForm.description.trim(),
          price: Number(publishForm.price) || 0,
          language: publishForm.language,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Published to the marketplace!');
        setPublishTarget(null);
      } else if (res.status === 403 && data.premiumRequired) {
        toast.error('Publishing is a Premium feature.');
        setPublishTarget(null);
        onNavigate?.('settings');
      } else {
        toast.error(data.message || 'Publish failed.');
      }
    } catch { toast.error('Could not reach the server.'); }
    finally { setPublishing(false); }
  };

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setVisibleSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      // Use the aggregated dashboard endpoint for richer stats.
      const res = await fetch(`${API_BASE}/api/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
      const projRes = await fetch(`${API_BASE}/api/projects?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const projData = await projRes.json();
      if (projData.success) setProjects(projData.projects);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); /* eslint-disable-next-line */ }, [filter]);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('speak2design_token')}` });

  // Delete = move to Trash (or permanently delete when already in Trash).
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const permanent = isTrash;
    if (!confirm(permanent ? 'Permanently delete this project? This cannot be undone.' : 'Move this project to Trash?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}${permanent ? '?permanent=true' : ''}`, {
        method: 'DELETE', headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) setProjects(prev => prev.filter(p => p._id !== id));
    } catch { console.error('Delete failed'); }
  };

  // Permanently purge every trashed project.
  const handleEmptyTrash = async () => {
    if (projects.length === 0) return;
    if (!confirm(`Permanently delete all ${projects.length} project(s) in Trash? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/projects/trash/empty`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json().catch(() => ({ success: false }));
      if (res.ok && data.success) {
        setProjects([]);
        toast.success(`Trash emptied — ${data.deletedCount ?? 0} project(s) deleted.`);
      } else {
        toast.error(data.message || 'Could not empty trash.');
      }
    } catch {
      toast.error('Could not reach the server to empty trash.');
    }
  };

  const handleRestore = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}/restore`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (data.success) setProjects(prev => prev.filter(p => p._id !== id));
    } catch { console.error('Restore failed'); }
  };

  // Archive / unarchive. Refetch after so the card lands in (or leaves) the
  // current view per the server-side filter.
  const handleToggleArchive = async (e: React.MouseEvent, id: string, current: boolean) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}/archive`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ isArchived: !current })
      });
      const data = await res.json();
      if (data.success) setProjects(prev => prev.filter(p => p._id !== id));
    } catch { console.error('Archive toggle failed'); }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string, current: boolean) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}/favorite`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ isFavorite: !current })
      });
      const data = await res.json();
      if (data.success) {
        // In the Favorites view, un-starring removes the card; elsewhere update in place.
        setProjects(prev => filter === 'favorites' && !data.isFavorite
          ? prev.filter(p => p._id !== id)
          : prev.map(p => p._id === id ? { ...p, isFavorite: data.isFavorite } : p));
      }
    } catch { console.error('Favorite toggle failed'); }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = langFilter === 'All' || p.language === langFilter;
    return matchesSearch && matchesLang;
  });

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (mins > 0) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="pt-24 pb-12 px-8 max-w-7xl mx-auto">
      <AnimatePresence>
        {showCreate && (
          <CreateWebsiteModal
            onClose={() => setShowCreate(false)}
            onNewProject={onNewProject}
            onBrowse={() => (onNavigate ? onNavigate('marketplace') : undefined)}
          />
        )}
      </AnimatePresence>

      {/* Publish project → marketplace modal */}
      <AnimatePresence>
        {publishTarget && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="glass-strong gradient-border rounded-3xl w-full max-w-lg text-white overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="font-display text-lg font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-brand-violet" /> Publish to Marketplace</h3>
                <button onClick={() => setPublishTarget(null)} className="p-2 hover:bg-white/10 rounded-xl text-white/60"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-white/50">Publishing your design "{publishTarget.title}" lists it on the marketplace for others. Premium accounts only.</p>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Title</label>
                  <input value={publishForm.title} onChange={e => setPublishForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-violet/60" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Description</label>
                  <textarea rows={3} value={publishForm.description} onChange={e => setPublishForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What's this template for?"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-violet/60 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Price (PKR)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input type="number" min="0" value={publishForm.price} onChange={e => setPublishForm(f => ({ ...f, price: e.target.value }))}
                        className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-brand-violet/60" />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">0 = free</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Language</label>
                    <select value={publishForm.language} onChange={e => setPublishForm(f => ({ ...f, language: e.target.value }))}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-brand-violet/60 [&>option]:text-gray-900">
                      <option>English</option><option>Urdu</option><option>Bilingual</option>
                    </select>
                  </div>
                </div>
                <GradientButton tone="green" full onClick={handlePublishProject} disabled={publishing}>
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {publishing ? 'Publishing…' : 'Publish'}
                </GradientButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {visibleSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mb-8 glass border border-emerald-400/20 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/90 rounded-full flex items-center justify-center text-white">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-300">Purchase Confirmed!</h4>
                <p className="text-sm text-emerald-200/70">The template has been added to your library.</p>
              </div>
            </div>
            <button onClick={() => setVisibleSuccess(false)} className="text-white/40 hover:text-white p-2 text-sm font-bold">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{view.title}</h1>
          <p className="text-white/45 mt-1">{loading ? 'Loading…' : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'} · ${view.sub}`}</p>
        </div>
        {isTrash ? (
          <button
            onClick={handleEmptyTrash}
            disabled={projects.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-5 h-5" /> Empty Trash
          </button>
        ) : (
          <GradientButton tone="green" onClick={() => setShowCreate(true)}><Plus className="w-5 h-5" /> New Project</GradientButton>
        )}
      </div>

      {/* Stats bar — populated from /api/dashboard */}
      {stats && filter === 'all' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FolderOpen, label: 'Total Designs', value: stats.totalDesigns ?? projects.length, tint: 'from-brand-indigo to-brand-violet' },
            { icon: LayoutTemplate, label: 'Published Templates', value: stats.publishedTemplates ?? 0, tint: 'from-brand-violet to-brand-pink' },
            { icon: ShoppingBag, label: 'Purchased', value: stats.purchasedTemplates ?? 0, tint: 'from-brand-cyan to-brand-teal' },
            {
              icon: Mic,
              label: 'Voice Commands Today',
              tint: 'from-brand-amber to-brand-pink',
              value: stats.voiceQuota === 'unlimited'
                ? '∞'
                : `${stats.voiceQuota?.used ?? 0} / ${stats.voiceQuota?.limit ?? 10}`
            },
          ].map(({ icon: Icon, label, value, tint }) => (
            <GlassCard key={label} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${tint}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-medium">{label}</p>
                <p className="text-lg font-black text-white">{value}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Quick actions (#18) */}
      {filter === 'all' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'New Voice Project', icon: Mic, onClick: () => onNewProject(), tint: 'from-brand-indigo to-brand-violet' },
            { label: 'Browse Marketplace', icon: ShoppingBag, onClick: () => onNavigate?.('marketplace'), tint: 'from-brand-cyan to-brand-teal' },
            { label: 'Upgrade to Premium', icon: LayoutTemplate, onClick: () => onNavigate?.('settings'), tint: 'from-brand-amber to-brand-pink' },
          ].map(qa => (
            <button key={qa.label} onClick={qa.onClick}
              className="group flex items-center gap-3 glass rounded-2xl p-4 hover:border-white/25 transition-all text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${qa.tint} flex-shrink-0`}>
                <qa.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{qa.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* #6: Start with a Template */}
      {filter === 'all' && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-brand-cyan" />
              <h2 className="font-display text-lg font-bold text-white">Start with a Template</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                placeholder="Search templates…"
                className="w-56 pl-9 pr-3 py-2 glass rounded-xl text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-brand-cyan/50 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {STARTER_TEMPLATES
              .filter(tpl =>
                tpl.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                tpl.category.toLowerCase().includes(templateSearch.toLowerCase()))
              .map(tpl => (
                <GlassCard key={tpl.name} hover className="group overflow-hidden flex flex-col">
                  {/* Wireframe thumbnail */}
                  <div className={`h-28 bg-gradient-to-br ${tpl.tint} relative flex items-center justify-center p-4`}>
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/25 backdrop-blur-md rounded-full text-white text-[10px] font-bold border border-white/20">
                      {tpl.category}
                    </span>
                    <div className="w-full max-w-[120px] bg-white/95 rounded-md shadow-lg overflow-hidden transition-transform duration-500 group-hover:scale-105">
                      <div className="h-2.5 bg-gray-100 flex items-center gap-0.5 px-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-300" />
                        <span className="w-1 h-1 rounded-full bg-amber-300" />
                        <span className="w-1 h-1 rounded-full bg-green-300" />
                      </div>
                      <div className="p-1.5 space-y-1">
                        <div className="h-3 rounded bg-gray-300" />
                        <div className="h-2 rounded bg-gray-200 w-4/5" />
                        <div className="h-2 rounded bg-gray-200 w-3/5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="font-bold text-sm text-white truncate">{tpl.name}</p>
                    <div className="flex gap-1.5 mt-auto">
                      <button onClick={() => onNavigate?.('marketplace')}
                        title="Preview in marketplace"
                        className="flex-1 py-1.5 text-xs font-bold glass rounded-lg text-white/70 hover:text-white hover:border-white/25 transition-all">
                        Preview
                      </button>
                      <button onClick={() => onNewProject(tpl.prompt)}
                        title="Generate this template now"
                        className="flex-1 py-1.5 text-xs font-bold rounded-lg text-white transition-all"
                        style={{ background: 'linear-gradient(120deg,#6366f1,#8b5cf6,#06b6d4)' }}>
                        Use
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects…" className="w-full pl-12 pr-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-brand-violet/60 focus:border-transparent outline-none" />
        </div>
        <div className="flex items-center gap-1 glass rounded-xl px-2">
          {(['All', 'English', 'Urdu'] as const).map(lang => (
            <button key={lang} onClick={() => setLangFilter(lang)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                langFilter === lang ? 'text-white bg-white/10' : 'text-white/45 hover:text-white'
              }`}>{lang}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass rounded-3xl overflow-hidden animate-pulse">
              <div className="h-48 bg-white/5" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mb-6 glow-indigo">
            <FolderOpen className="w-10 h-10 text-brand-violet" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-2">
            {searchQuery ? 'No matching projects' : 'No projects yet'}
          </h3>
          <p className="text-white/45 mb-6">
            {searchQuery ? 'Try a different search term.' : 'Create your first voice-powered design project.'}
          </p>
          {!searchQuery && (
            <GradientButton tone="green" onClick={() => setShowCreate(true)}><Plus className="w-5 h-5" /> Create First Project</GradientButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, idx) => (
            <GlassCard key={project._id} hover gradientBorder onClick={() => onSelectProject(project._id)}
              className="group overflow-hidden">
              <div className={`h-48 bg-gradient-to-br ${PROJECT_COLORS[idx % PROJECT_COLORS.length]} relative p-4`}>
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-black/25 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20 z-10">
                  <Globe className="w-3.5 h-3.5" />
                  {project.language || 'English'}
                </div>
                {/* Favorite toggle (not in trash) */}
                {!isTrash && (
                  <button onClick={(e) => handleToggleFavorite(e, project._id, !!project.isFavorite)}
                    title={project.isFavorite ? 'Unfavorite' : 'Add to favorites'}
                    className="absolute top-4 left-4 z-10 p-2 bg-black/25 backdrop-blur-md rounded-lg text-white hover:bg-black/40 transition-colors">
                    <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                )}
                <div className="absolute bottom-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {isTrash && (
                    <button onClick={(e) => handleRestore(e, project._id)} title="Restore"
                      className="p-2 bg-black/25 backdrop-blur-md rounded-lg text-white hover:bg-emerald-500/60 transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {/* Publish to marketplace — only for non-empty projects, not in Trash */}
                  {!isTrash && (project.canvasState || []).length > 0 && (
                    <button onClick={(e) => openPublish(e, project)} title="Publish to marketplace"
                      className="p-2 bg-black/25 backdrop-blur-md rounded-lg text-white hover:bg-violet-500/60 transition-colors">
                      <Upload className="w-4 h-4" />
                    </button>
                  )}
                  {/* Archive (or unarchive in the Archived view) — not shown in Trash */}
                  {!isTrash && (
                    <button onClick={(e) => handleToggleArchive(e, project._id, !!project.isArchived)}
                      title={isArchivedView ? 'Unarchive' : 'Archive'}
                      className="p-2 bg-black/25 backdrop-blur-md rounded-lg text-white hover:bg-amber-500/60 transition-colors">
                      {isArchivedView ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={(e) => handleDelete(e, project._id)} title={isTrash ? 'Delete forever' : 'Move to Trash'}
                    className="p-2 bg-black/25 backdrop-blur-md rounded-lg text-white hover:bg-rose-500/60 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Mini UI-design preview (wireframe reflecting the project's components) */}
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                  <div className="w-full max-w-[190px] bg-white/95 rounded-lg shadow-2xl overflow-hidden transition-transform duration-500 group-hover:scale-105">
                    <div className="h-4 bg-gray-100 flex items-center gap-1 px-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                    </div>
                    <div className="p-2.5 space-y-1.5">
                      <div className="h-5 rounded bg-gray-300" />
                      {Array.from({ length: Math.max(2, Math.min(4, (project.canvasState || []).length)) }).map((_, i) => (
                        <div key={i} className="h-3 rounded bg-gray-200" style={{ width: `${90 - i * 12}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display font-bold text-lg text-white mb-4 truncate group-hover:text-brand-cyan transition-colors">{project.title}</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-white/45">
                    <Clock className="w-3.5 h-3.5" />
                    Modified {getTimeAgo(project.updatedAt)}
                  </div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    {(project.canvasState || []).length} component{(project.canvasState || []).length !== 1 ? 's' : ''} on canvas
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
