import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Clock, Globe, Trash2, CheckCircle2, FolderOpen, Loader2 } from 'lucide-react';

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
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setProjects(data.projects);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
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
            className="mb-8 bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-green-900">Purchase Confirmed!</h4>
                <p className="text-sm text-green-700">The template has been added to your projects.</p>
              </div>
            </div>
            <button onClick={() => setVisibleSuccess(false)} className="text-green-900/50 hover:text-green-900 p-2">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-500 mt-1">{loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''} total`}</p>
        </div>
        <button onClick={onNewProject}
          className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0047b3] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-95">
          <Plus className="w-5 h-5" /> New Project
        </button>
      </div>

      <div className="flex gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0052CC] outline-none" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2">
          {(['All', 'English', 'Urdu'] as const).map(lang => (
            <button key={lang} onClick={() => setLangFilter(lang)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                langFilter === lang ? 'bg-[#0052CC] text-white' : 'text-gray-500 hover:text-gray-900'
              }`}>{lang}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchQuery ? 'No matching projects' : 'No projects yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Try a different search term.' : 'Create your first voice-powered design project.'}
          </p>
          {!searchQuery && (
            <button onClick={onNewProject}
              className="flex items-center gap-2 bg-[#0052CC] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0047b3] transition-all">
              <Plus className="w-5 h-5" /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, idx) => (
            <motion.div key={project._id} whileHover={{ y: -4 }}
              className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer"
              onClick={() => onSelectProject(project._id)}>
              <div className={`h-48 bg-gradient-to-br ${PROJECT_COLORS[idx % PROJECT_COLORS.length]} relative p-4`}>
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30">
                  <Globe className="w-3.5 h-3.5" />
                  {project.language || 'English'}
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleDelete(e, project._id)}
                    className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-red-500/40 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Mini UI-design preview (wireframe reflecting the project's components) */}
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                  <div className="w-full max-w-[190px] bg-white/95 rounded-lg shadow-xl overflow-hidden">
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
                <h3 className="font-bold text-lg text-gray-900 mb-4 truncate">{project.title}</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Modified {getTimeAgo(project.updatedAt)}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    {(project.canvasState || []).length} component{(project.canvasState || []).length !== 1 ? 's' : ''} on canvas
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
