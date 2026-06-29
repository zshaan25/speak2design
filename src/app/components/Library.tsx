import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Package, Edit3, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '../design/GlassCard';
import { GradientButton } from '../design/GradientButton';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

const CATEGORY_PREVIEW: Record<string, string> = {
  Dashboards: '/previews/dashboard.svg',
  'Landing Pages': '/previews/saas.svg',
  Blogs: '/previews/blog.svg',
  'UI Kits': '/previews/mobile.svg',
  Portfolio: '/previews/portfolio.svg',
};
const previewSrc = (t: any): string =>
  t?.imageUrl || CATEGORY_PREVIEW[t?.category] || '/previews/generic.svg';

interface LibraryProps {
  onOpenProject?: (projectId: string) => void;
  onBrowse?: () => void;
  onBack: () => void;
}

// Standalone "My Library" page — templates the user owns, opened as editable projects.
export const Library: React.FC<LibraryProps> = ({ onOpenProject, onBrowse, onBack }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingId, setUsingId] = useState<string | null>(null);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace/library`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setItems(data.templates);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchLibrary(); }, []);

  const handleUse = async (tpl: any) => {
    const id = tpl._id || tpl.id;
    setUsingId(id);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace/${id}/use`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.project?._id) onOpenProject?.(data.project._id);
      else if (data.premiumRequired) toast.error(data.message || 'Premium template — upgrade to edit.');
      else toast.error(data.message || 'Could not open template.');
    } catch { toast.error('Connection error.'); }
    finally { setUsingId(null); }
  };

  return (
    <div className="pt-24 pb-12 px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold text-white">My Library</h1>
          <p className="text-white/45 text-sm mt-1">{loading ? 'Loading…' : `${items.length} owned template${items.length === 1 ? '' : 's'}`}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-[32px] h-80 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mb-6 glow-indigo">
            <Package className="w-10 h-10 text-brand-cyan" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-2">Your library is empty</h3>
          <p className="text-white/45 mb-6">Templates you buy or add appear here, ready to open and edit.</p>
          <GradientButton tone="green" onClick={onBrowse}><ShoppingCart className="w-5 h-5" /> Browse Templates</GradientButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map(tpl => (
            <GlassCard key={tpl._id || tpl.id} hover gradientBorder className="group overflow-hidden rounded-[32px]">
              <div className="h-48 relative overflow-hidden bg-white/5">
                <img src={previewSrc(tpl)} alt={tpl.title} loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/previews/generic.svg'; }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/80 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">Owned</div>
              </div>
              <div className="p-6">
                <h3 className="font-display font-bold text-lg text-white mb-1 truncate group-hover:text-brand-cyan transition-colors">{tpl.title}</h3>
                <p className="text-white/45 text-xs mb-5">Added {tpl.purchasedAt ? new Date(tpl.purchasedAt).toLocaleDateString() : 'recently'}</p>
                <GradientButton tone="green" full onClick={() => handleUse(tpl)} disabled={usingId === (tpl._id || tpl.id)}>
                  {usingId === (tpl._id || tpl.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />} Open & Edit
                </GradientButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
