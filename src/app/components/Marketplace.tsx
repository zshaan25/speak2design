import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingCart, Star, Globe, Upload, Tag, DollarSign, ArrowLeft, Loader2, Package, Crown, Lock, Trash2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

import { GlassCard } from '../design/GlassCard';
import { GradientButton } from '../design/GradientButton';

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
  onCheckoutCart?: (cart: any[]) => void;
  onBack: () => void;
  onOpenProject?: (projectId: string) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onCheckout, onCheckoutCart, onBack, onOpenProject }) => {
  const [view, setView] = useState<'buy' | 'library' | 'sell'>('buy');
  const [library, setLibrary] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: '', description: '', price: '2500', language: 'English', tags: '', imageUrl: '' });
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [myTemplates, setMyTemplates] = useState<any[]>([]);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);

  // ── Cart (persisted in localStorage) ───────────────────────────────────────
  const [cart, setCart] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('speak2design_cart') || '[]'); } catch { return []; }
  });
  const [showCart, setShowCart] = useState(false);
  useEffect(() => { try { localStorage.setItem('speak2design_cart', JSON.stringify(cart)); } catch { /* ignore */ } }, [cart]);

  const cartId = (t: any) => t._id || t.id;
  const inCart = (t: any) => cart.some(c => cartId(c) === cartId(t));
  const addToCart = (t: any) => {
    if (inCart(t)) { toast.info('Already in cart.'); return; }
    setCart(prev => [...prev, { _id: cartId(t), title: t.title, price: t.price || 0, imageUrl: t.imageUrl }]);
    toast.success(`"${t.title}" added to cart.`);
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => cartId(c) !== id));
  const cartTotal = cart.reduce((s, c) => s + (c.price || 0), 0);

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
      const co = await fetch(`${API_BASE}/api/auth/upgrade/checkout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const coData = await co.json();
      if (coData.url) { window.location.href = coData.url; return; }
      if (coData.alreadyPremium) { setUserTier('premium'); return; }
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

  const fetchMyTemplates = async () => {
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Filter for seller's own templates — backend returns sellerId on each template.
        // We check via the dashboard endpoint for the user ID.
        const profileRes = await fetch(`${API_BASE}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const profileData = await profileRes.json();
        const userId = profileData?.user?._id;
        if (userId) {
          setMyTemplates(data.templates.filter((t: any) => t.sellerId === userId || t.seller === userId));
        }
      }
    } catch { /* non-fatal */ }
  };

  const handleUnpublish = async (templateId: string) => {
    if (!confirm('Unpublish this template? It will be removed from the marketplace.')) return;
    setUnpublishingId(templateId);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace/unpublish/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Template unpublished.');
        setMyTemplates(prev => prev.filter(t => (t._id || t.id) !== templateId));
        fetchTemplates();
      } else {
        toast.error(data.message || 'Unpublish failed.');
      }
    } catch { toast.error('Connection error.'); }
    finally { setUnpublishingId(null); }
  };

  const fetchLibrary = async () => {
    setLibraryLoading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace/library`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLibrary(data.templates);
    } catch { /* non-fatal */ }
    finally { setLibraryLoading(false); }
  };

  useEffect(() => { fetchTemplates(); loadTier(); fetchMyTemplates(); fetchLibrary(); }, []);
  // Refresh the library whenever the user switches to that tab.
  useEffect(() => { if (view === 'library') fetchLibrary(); }, [view]);

  const [usingId, setUsingId] = useState<string | null>(null);
  // Open a template as an editable project (#14).
  const handleUseTemplate = async (tpl: any) => {
    const id = tpl._id || tpl.id;
    setUsingId(id);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/marketplace/${id}/use`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.project?._id) { onOpenProject?.(data.project._id); }
      else if (data.premiumRequired) { toast.error(data.message || 'Premium template — upgrade to edit.'); }
      else { toast.error(data.message || 'Could not open template.'); }
    } catch { toast.error('Connection error.'); }
    finally { setUsingId(null); }
  };

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

  const CartDrawer = () => (
    <AnimatePresence>
      {showCart && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full max-w-md h-full glass-strong border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-cyan" /> Cart ({cart.length})
              </h3>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/10 rounded-xl text-white/60">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-white/40">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Your cart is empty.</p>
                </div>
              ) : cart.map(item => (
                <div key={item._id} className="flex items-center gap-3 p-3 glass rounded-2xl">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                    <img src={item.imageUrl || '/previews/generic.svg'} alt={item.title}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/previews/generic.svg'; }}
                      className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.title}</p>
                    <p className="text-xs text-white/50">{formatPrice(item.price || 0)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="p-2 text-white/40 hover:text-rose-400 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-white">
                  <span className="text-sm text-white/60">Total</span>
                  <span className="text-xl font-black">{formatPrice(cartTotal)}</span>
                </div>
                <GradientButton full onClick={() => { setShowCart(false); onCheckoutCart?.(cart); }}>
                  <ShoppingCart className="w-4 h-4" /> Proceed to Checkout
                </GradientButton>
                <p className="text-[11px] text-white/35 text-center">Review payment & confirm on the next step.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="pt-24 pb-12 px-8 max-w-7xl mx-auto min-h-screen">
      <CartDrawer />
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Template Marketplace</h1>
            <p className="text-white/45 text-sm mt-1">{loading ? 'Loading…' : `${templates.length} templates available`}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 glass p-1.5 rounded-2xl">
          {(['buy', 'library', 'sell'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                view === v ? 'text-white bg-white/10 glow-indigo' : 'text-white/45 hover:text-white'
              }`}>
              {v === 'buy' ? 'Buy Templates' : v === 'library' ? 'My Library' : 'Sell Your Design'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="glass rounded-xl px-4 py-2.5 font-bold text-sm text-white outline-none focus:ring-2 focus:ring-brand-violet/60 [&>option]:text-gray-900"
          >
            <option value="PKR">PKR</option>
            <option value="USD">USD</option>
          </select>
          <button onClick={() => setShowCart(true)}
            title="View cart"
            className="relative p-3 glass rounded-xl text-white/70 hover:text-white hover:border-white/25 transition-all">
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand-pink text-[10px] font-black text-white ring-2 ring-[#0b1120]">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {view === 'buy' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search templates in English or Urdu…"
                className="w-full pl-12 pr-4 py-3.5 glass rounded-2xl text-white placeholder-white/30 focus:ring-2 focus:ring-brand-violet/60 outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3.5 glass rounded-2xl font-bold text-white/80 hover:text-white hover:border-white/25 transition-all">
              <Filter className="w-5 h-5" />
              More Filters
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="glass rounded-[32px] overflow-hidden animate-pulse">
                  <div className="h-56 bg-white/5" />
                  <div className="p-8 space-y-3">
                    <div className="h-6 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                    <div className="h-10 bg-white/5 rounded-2xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mb-6 glow-indigo">
                <Package className="w-10 h-10 text-brand-violet" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                {searchQuery ? 'No matching templates' : 'No templates yet'}
              </h3>
              <p className="text-white/45">
                {searchQuery ? 'Try a different search term.' : 'Be the first to publish a template!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemplates.map((tpl) => (
                <GlassCard key={tpl._id || tpl.id} hover gradientBorder className="group overflow-hidden rounded-[32px]">
                  <div className="h-56 relative overflow-hidden bg-white/5">
                    <img
                      src={previewSrc(tpl)}
                      alt={`${tpl.title} preview`}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/previews/generic.svg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                      <Globe className="w-3 h-3" />
                      {tpl.language || tpl.lang || 'English'}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-display font-bold text-xl text-white group-hover:text-brand-cyan transition-colors">{tpl.title}</h3>
                      <div className="flex items-center gap-1 text-brand-amber">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold">{tpl.rating || '4.8'}</span>
                      </div>
                    </div>
                    <p className="text-white/45 text-sm mb-6 font-medium">by {tpl.author || tpl.authorName || 'Creator'}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-white">{formatPrice(tpl.price)}</p>
                        <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest">{tpl.sales || 0} sales</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(!tpl.price || tpl.price === 0) ? (
                          <>
                            <button onClick={() => addToCart(tpl)}
                              title={inCart(tpl) ? 'In cart' : 'Add to cart'}
                              className={`p-2.5 glass rounded-xl transition-all ${inCart(tpl) ? 'text-brand-pink' : 'text-white/80 hover:text-white hover:border-white/25'}`}>
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                            <GradientButton onClick={() => handleUseTemplate(tpl)} disabled={usingId === (tpl._id || tpl.id)} className="!px-5 !py-2.5">
                              {usingId === (tpl._id || tpl.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />} Use
                            </GradientButton>
                          </>
                        ) : (
                          <>
                            <button onClick={() => addToCart(tpl)}
                              title={inCart(tpl) ? 'In cart' : 'Add to cart'}
                              className={`p-2.5 glass rounded-xl transition-all ${inCart(tpl) ? 'text-brand-pink' : 'text-white/80 hover:text-white hover:border-white/25'}`}>
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                            <GradientButton onClick={() => onCheckout(tpl)} className="!px-5 !py-2.5">
                              Buy
                            </GradientButton>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      ) : view === 'library' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {libraryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3].map(i => <div key={i} className="glass rounded-[32px] h-80 animate-pulse" />)}
            </div>
          ) : library.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mb-6 glow-indigo">
                <Package className="w-10 h-10 text-brand-cyan" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Your library is empty</h3>
              <p className="text-white/45 mb-6">Templates you buy or add appear here, ready to open and edit.</p>
              <GradientButton onClick={() => setView('buy')}><ShoppingCart className="w-5 h-5" /> Browse Templates</GradientButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {library.map(tpl => (
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
                    <GradientButton full onClick={() => handleUseTemplate(tpl)} disabled={usingId === (tpl._id || tpl.id)}>
                      {usingId === (tpl._id || tpl.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />} Open & Edit
                    </GradientButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      ) : userTier !== 'premium' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <GlassCard gradientBorder className="p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-indigo to-brand-violet rounded-3xl flex items-center justify-center mb-6 glow-indigo">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Publishing is a Premium feature</h2>
            <p className="text-white/50 mb-8 font-medium">
              Free accounts can browse and buy templates. Upgrade to Premium to publish your own designs and earn from the marketplace.
            </p>
            <GradientButton onClick={handleUpgrade} disabled={isUpgrading} className="!px-8 !py-3.5">
              {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
              {isUpgrading ? 'Upgrading…' : 'Upgrade to Premium'}
            </GradientButton>
          </GlassCard>
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

          {/* My Published Templates */}
          {myTemplates.length > 0 && (
            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 p-10 mt-8">
              <h2 className="text-xl font-black text-gray-900 mb-6">My Published Templates</h2>
              <div className="space-y-3">
                {myTemplates.map((tpl) => {
                  const id = tpl._id || tpl.id;
                  return (
                    <div key={id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={tpl.imageUrl || '/previews/generic.svg'}
                            alt={tpl.title}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/previews/generic.svg'; }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{tpl.title}</p>
                          <p className="text-sm text-gray-500">Rs {(tpl.price || 0).toLocaleString()} · {tpl.downloads || 0} downloads</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnpublish(id)}
                        disabled={unpublishingId === id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm transition-colors disabled:opacity-50"
                      >
                        {unpublishingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Unpublish
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
