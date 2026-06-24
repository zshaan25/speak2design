import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingCart, Star, Globe, Upload, Tag, DollarSign, ArrowLeft, Loader2, Package, Crown, Lock } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

// Category → curated UI preview image (served from /public/previews).
const CATEGORY_PREVIEW: Record<string, string> = {
  Dashboards: '/previews/dashboard.svg',
  'Landing Pages': '/previews/saas.svg',
  Blogs: '/previews/blog.svg',
  'UI Kits': '/previews/mobile.svg',
  Portfolio: '/previews/portfolio.svg',
};
const previewSrc = (t: any): string =>
  t?.imageUrl || CATEGORY_PREVIEW[t?.category] || '/previews/generic.svg';

interface MarketplaceProps {
  onCheckout: (template: any) => void;
  onBack: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onCheckout, onBack }) => {
  const [view, setView] = useState<'buy' | 'sell'>('buy');
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: '', description: '', price: '2500', language: 'English', tags: '', imageUrl: '' });
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const loadTier = async () => {
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.user) setUserTier(data.user.tier || 'free');
    } catch { /* non-fatal */ }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/auth/upgrade`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setUserTier('premium'); toast.success('Upgraded to Premium! You can now publish templates.'); }
      else toast.error(data.message || 'Upgrade failed.');
    } catch { toast.error('Connection error during upgrade.'); }
    finally { setIsUpgrading(false); }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTemplates(data.templates);
    } catch { console.error('Failed to fetch templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); loadTier(); }, []);

  const formatPrice = (price: number) => {
    if (currency === 'USD') return `$${(price / 280).toFixed(2)}`;
    return `Rs${price.toLocaleString()}`;
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.author || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishForm.title || !publishForm.description || !publishForm.price) {
      toast.error('Please fill all required fields.');
      return;
    }
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: publishForm.title,
          description: publishForm.description,
          price: Number(publishForm.price),
          language: publishForm.language,
          imageUrl: publishForm.imageUrl.trim(),
          tags: publishForm.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Template published!');
        setPublishForm({ title: '', description: '', price: '2500', language: 'English', tags: '', imageUrl: '' });
        setView('buy');
        fetchTemplates();
      } else if (res.status === 403 && data.premiumRequired) {
        setUserTier('free');
        toast.error(data.message || 'Publishing is a Premium feature.');
      } else {
        toast.error(data.message || 'Publish failed.');
      }
    } catch { toast.error('Could not connect to server.'); }
    finally { setIsPublishing(false); }
  };

  return (
    <div className="pt-24 pb-12 px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Marketplace</h1>
            <p className="text-gray-500 text-sm mt-1">{loading ? 'Loading...' : `${templates.length} templates available`}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-gray-100 p-1.5 rounded-2xl">
          {(['buy', 'sell'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                view === v ? 'bg-white text-[#0052CC] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {v === 'buy' ? 'Buy Templates' : 'Sell Your Design'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PKR">PKR</option>
            <option value="USD">USD</option>
          </select>
          <button className="relative p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {view === 'buy' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search templates in English or Urdu..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#0052CC] outline-none shadow-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
              <Filter className="w-5 h-5" />
              More Filters
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                  <div className="h-56 bg-gray-200" />
                  <div className="p-8 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-10 bg-gray-100 rounded-2xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No matching templates' : 'No templates yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try a different search term.' : 'Be the first to publish a template!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemplates.map((tpl) => (
                <motion.div
                  key={tpl._id || tpl.id}
                  whileHover={{ y: -6 }}
                  className="group bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden"
                >
                  <div className="h-56 relative overflow-hidden bg-gray-100">
                    <img
                      src={previewSrc(tpl)}
                      alt={`${tpl.title} preview`}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/previews/generic.svg'; }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-gray-800 text-[10px] font-bold uppercase tracking-wider border border-white/60 shadow-sm">
                      <Globe className="w-3 h-3" />
                      {tpl.language || tpl.lang || 'English'}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#0052CC] transition-colors">{tpl.title}</h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold">{tpl.rating || '4.8'}</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 font-medium">by {tpl.author || tpl.authorName || 'Creator'}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-gray-900">{formatPrice(tpl.price)}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tpl.sales || 0} sales</p>
                      </div>
                      <button
                        onClick={() => onCheckout(tpl)}
                        className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0047b3] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : userTier !== 'premium' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Publishing is a Premium feature</h2>
            <p className="text-gray-500 mb-8 font-medium">
              Free accounts can browse and buy templates. Upgrade to Premium to publish your own designs and earn from the marketplace.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:opacity-90 transition-all disabled:opacity-60"
            >
              {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
              {isUpgrading ? 'Upgrading…' : 'Upgrade to Premium'}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 p-10">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Publish Your Design to Marketplace</h2>
            <p className="text-gray-500 mb-8 font-medium">Reach thousands of designers and earn from your creations.</p>

            <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Template Name *</label>
                  <input
                    type="text"
                    value={publishForm.title}
                    onChange={e => setPublishForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Modern E-commerce Template"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#0052CC] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Description *</label>
                  <textarea
                    rows={4}
                    value={publishForm.description}
                    onChange={e => setPublishForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe your template..."
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#0052CC] transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Price (PKR) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={publishForm.price}
                        onChange={e => setPublishForm(f => ({ ...f, price: e.target.value }))}
                        className="w-full pl-10 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#0052CC]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Language</label>
                    <select
                      value={publishForm.language}
                      onChange={e => setPublishForm(f => ({ ...f, language: e.target.value }))}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#0052CC] font-bold"
                    >
                      <option>English</option>
                      <option>Urdu</option>
                      <option>Bilingual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Preview Image</label>
                  <div className="w-full h-48 rounded-[32px] overflow-hidden bg-gray-50 border border-gray-100 mb-3">
                    <img
                      src={publishForm.imageUrl.trim() || '/previews/generic.svg'}
                      alt="Template preview"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/previews/generic.svg'; }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative">
                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={publishForm.imageUrl}
                      onChange={e => setPublishForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="Paste preview image URL (optional)"
                      className="w-full pl-10 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#0052CC] text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 ml-1">Leave blank to use a default preview based on category.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={publishForm.tags}
                    onChange={e => setPublishForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="e.g., Dashboard, Modern, Clean"
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="col-span-full">
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="w-full bg-[#0052CC] hover:bg-[#0047b3] disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
                  ) : (
                    <><Upload className="w-5 h-5" /> Publish to Marketplace</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
};
