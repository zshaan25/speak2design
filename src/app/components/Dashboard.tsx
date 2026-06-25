import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Clock, Globe, Trash2, CheckCircle2, FolderOpen, Mic, LayoutTemplate, ShoppingBag } from 'lucide-react';
import { GlassCard } from '../design/GlassCard';
import { GradientButton } from '../design/GradientButton';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

interface DashboardProps {
  onNewProject: () => void;
  onSelectProject: (id: string) => void;
  showSuccess?: boolean;
}

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

export const Dashboard: React.FC<DashboardProps> = ({ onNewProject, onSelectProject, showSuccess }) => {
  const [visibleSuccess, setVisibleSuccess] = useState(showSuccess);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'All' | 'English' | 'Urdu'>('All');

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
      if (data.success) {
        // recentDesigns is the last 5; fall back to fetching all projects for display.
        setStats(data.stats);
        // Fetch full project list for grid (dashboard returns only last 5).
        const projRes = await fetch(`${API_BASE}/api/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const projData = await projRes.json();
        if (projData.success) setProjects(projData.projects);
      } else {
        // Fallback: plain projects fetch.
        const projRes = await fetch(`${API_BASE}/api/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const projData = await projRes.json();
        if (projData.success) setProjects(projData.projects);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setProjects(prev => prev.filter(p => p._id !== id));
    } catch { console.error('Delete failed'); }
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
          <h1 className="font-display text-3xl font-bold text-white">My Projects</h1>
          <p className="text-white/45 mt-1">{loading ? 'Loading…' : `${projects.length} project${projects.length !== 1 ? 's' : ''} total`}</p>
        </div>
        <GradientButton onClick={onNewProject}><Plus className="w-5 h-5" /> New Project</GradientButton>
      </div>

      {/* Stats bar — populated from /api/dashboard */}
      {stats && (
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
            <GradientButton onClick={onNewProject}><Plus className="w-5 h-5" /> Create First Project</GradientButton>
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
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={(e) => handleDelete(e, project._id)}
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
