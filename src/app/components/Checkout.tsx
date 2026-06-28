import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Wallet, Smartphone, ShieldCheck, CheckCircle, ChevronLeft, Star, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';
const STRIPE_PK = (import.meta as any).env?.VITE_STRIPE_PK || '';

interface CheckoutProps {
  template?: any;
  /** When set, checkout runs in multi-item cart mode. */
  cart?: any[];
  onConfirm: () => void;
  onBack: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ template, cart, onConfirm, onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'easypaisa' | 'jazzcash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const isCart = Array.isArray(cart) && cart.length > 0;
  const items = isCart ? cart! : (template ? [template] : []);
  const templateId = template?._id || template?.id;
  const cartTotal = items.reduce((s, t) => s + (t?.price || 0), 0);
  const isFree = isCart ? cartTotal === 0 : (!template?.price || template.price === 0);

  const handleConfirm = async () => {
    setIsProcessing(true);
    const token = localStorage.getItem('speak2design_token');

    try {
      // Cart mode — simulate the chosen payment, then bulk-add to the library.
      if (isCart) {
        if (paymentMethod !== 'card' || !isFree) await new Promise(r => setTimeout(r, 1300));
        const res = await fetch(`${API_BASE}/api/marketplace/cart/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ templateIds: items.map(t => t._id || t.id) }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message || 'Order complete — added to your library!');
          onConfirm();
        } else {
          toast.error(data.message || 'Checkout failed.');
        }
        setIsProcessing(false);
        return;
      }

      // Free template — call purchase endpoint directly.
      if (isFree) {
        const res = await fetch(`${API_BASE}/api/marketplace/purchase/${templateId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentMethod }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Template added to your library!');
          onConfirm();
        } else {
          toast.error(data.message || 'Purchase failed.');
        }
        setIsProcessing(false);
        return;
      }

      // No real template ID (demo card) → simulate.
      if (!templateId) {
        await new Promise(r => setTimeout(r, 1200));
        toast.success('Purchase confirmed (demo)!');
        onConfirm();
        setIsProcessing(false);
        return;
      }

      // Mobile wallet → simulate.
      if (paymentMethod !== 'card') {
        await new Promise(r => setTimeout(r, 1500));
        const res = await fetch(`${API_BASE}/api/marketplace/purchase/${templateId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentMethod }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`${paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} payment confirmed!`);
          onConfirm();
        } else {
          toast.error(data.message || 'Purchase failed.');
        }
        setIsProcessing(false);
        return;
      }

      // Card + Stripe → create Checkout Session and redirect.
      const res = await fetch(`${API_BASE}/api/marketplace/checkout/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Could not start checkout.');
        setIsProcessing(false);
        return;
      }

      if (data.simulated) {
        // No Stripe key — backend returned simulated flag.
        toast.success('Purchase confirmed (simulated)!');
        onConfirm();
        setIsProcessing(false);
        return;
      }

      if (data.url) {
        // Redirect to Stripe-hosted Checkout page.
        window.location.href = data.url;
        // Don't reset isProcessing — page is navigating away.
        return;
      }

      toast.error('No checkout URL returned from server.');
      setIsProcessing(false);
    } catch {
      toast.error('Could not connect to server. Please check your connection.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-white">Checkout</h1>
        {STRIPE_PK && paymentMethod === 'card' && !isFree && (
          <span className="ml-2 px-3 py-1 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
            Stripe Checkout
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Payment Method */}
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-strong gradient-border rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              {isFree ? 'Confirm Free Template' : 'Choose Payment Method'}
            </h2>

            {isFree ? (
              <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-green-500 bg-green-50/50">
                <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-green-900">This template is free!</p>
                  <p className="text-sm text-green-700">Click Confirm below to add it to your library.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { id: 'card', label: 'Credit / Debit Card', sublabel: STRIPE_PK ? 'You will be redirected to Stripe to complete payment' : 'Simulated — no real charge', icon: CreditCard },
                  { id: 'easypaisa', label: 'EasyPaisa', sublabel: 'Simulated mobile wallet', icon: Wallet },
                  { id: 'jazzcash', label: 'JazzCash', sublabel: 'Simulated mobile wallet', icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-brand-violet/60 bg-brand-indigo/15 shadow-md glow-indigo'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === method.id ? 'bg-gradient-to-br from-brand-indigo to-brand-violet text-white' : 'bg-white/10 text-white/50'}`}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${paymentMethod === method.id ? 'text-brand-cyan' : 'text-white/70'}`}>{method.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{method.sublabel}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === method.id ? 'border-brand-violet bg-brand-violet' : 'border-white/20'}`}>
                      {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isFree && paymentMethod === 'card' && STRIPE_PK && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 rounded-2xl bg-brand-indigo/10 border border-brand-violet/25">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-4 h-4 text-brand-cyan mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-brand-cyan/90">
                    You'll be redirected to Stripe's secure payment page to complete your purchase. After payment, you'll return to Speak2Design automatically.
                  </p>
                </div>
              </motion.div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <div className="space-y-8">
          <div className="glass-strong gradient-border rounded-3xl p-8 sticky top-24">
            <h2 className="text-xl font-bold mb-6 text-white">Order Summary</h2>

            <div className="flex flex-col gap-4 mb-8 pb-8 border-b border-white/10">
              {isCart ? (
                <>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{items.length} item{items.length > 1 ? 's' : ''}</p>
                  {items.map((it) => (
                    <div key={it._id || it.id} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={it.imageUrl || '/previews/generic.svg'} alt={it.title}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/previews/generic.svg'; }}
                          className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm leading-tight truncate">{it.title}</h4>
                      </div>
                      <span className="text-sm font-bold text-white flex-shrink-0">{(it.price || 0) === 0 ? 'Free' : `Rs ${(it.price || 0).toLocaleString()}`}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-inner bg-gray-100 flex-shrink-0">
                      <img
                        src={template?.imageUrl || '/previews/generic.svg'}
                        alt={`${template?.title || 'Template'} preview`}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/previews/generic.svg'; }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-tight mb-1">{template?.title || 'Template'}</h4>
                      <p className="text-sm text-white/50">by {template?.author || template?.authorName || 'Creator'}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span className="text-xs font-bold text-white/60">{template?.rating || '4.8'}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {['Fully Responsive Design', 'React Components', 'Tailwind CSS', 'Commercial License'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-white/60">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm text-white/50">
                <span>Subtotal:</span>
                <span className="font-bold text-white">
                  {isFree ? 'Free' : `Rs ${cartTotal.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-white/50">
                <span>Tax (0%):</span>
                <span className="font-bold text-white">Rs 0</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="font-bold text-white">Total:</span>
                <div className="text-right">
                  {isFree ? (
                    <p className="text-2xl font-black text-green-600">Free</p>
                  ) : (
                    <>
                      <p className="text-2xl font-black text-gradient">Rs {cartTotal.toLocaleString()}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                        ~ ${(cartTotal / 280).toFixed(0)} USD
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleConfirm}
              className="group relative w-full overflow-hidden text-white font-bold py-4 rounded-2xl shadow-[0_0_45px_-10px_rgba(99,102,241,.8)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <span className="absolute inset-0 anim-gradient" style={{ background: 'linear-gradient(120deg,#6366f1,#8b5cf6,#06b6d4)' }} />
              <span className="relative z-10 flex items-center justify-center gap-2">
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {!isFree && paymentMethod === 'card' && STRIPE_PK ? (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      Proceed to Stripe
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {isFree ? 'Add to Library' : 'Confirm Purchase'}
                    </>
                  )}
                </>
              )}
              </span>
            </button>
            <p className="text-center text-[10px] text-white/40 font-bold uppercase tracking-widest mt-4">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
