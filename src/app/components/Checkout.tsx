import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Wallet, Smartphone, ShieldCheck, CheckCircle, ChevronLeft, Calendar, Lock, Star } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';
const STRIPE_PK = (import.meta as any).env?.VITE_STRIPE_PK || '';
// Null when no key configured → Checkout falls back to a simulated purchase.
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

interface CheckoutProps {
  template: any;
  onConfirm: () => void;
  onBack: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } },
    invalid: { color: '#dc2626' },
  },
};

const CheckoutInner: React.FC<CheckoutProps> = ({ template, onConfirm, onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'easypaisa' | 'jazzcash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const stripeCardEnabled = !!STRIPE_PK && paymentMethod === 'card';

  // Records the purchase in the buyer's library on the backend.
  const recordPurchase = async (templateId: string, token: string | null) => {
    const res = await fetch(`${API_BASE}/api/marketplace/purchase/${templateId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentMethod }),
    });
    return res.json();
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    const token = localStorage.getItem('speak2design_token');
    const templateId = template?._id || template?.id;

    try {
      if (!templateId) {
        // No backend id (demo template) — simulate.
        await new Promise(r => setTimeout(r, 1200));
        toast.success('Purchase confirmed!');
        onConfirm();
        return;
      }

      // Ask backend to start a payment. Returns either a Stripe clientSecret or simulated:true.
      const piRes = await fetch(`${API_BASE}/api/marketplace/create-payment-intent/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const pi = await piRes.json();

      // Real Stripe card flow (test mode).
      if (!pi.simulated && pi.clientSecret && stripeCardEnabled && stripe && elements) {
        const card = elements.getElement(CardElement);
        if (!card) { toast.error('Card field not ready.'); setIsProcessing(false); return; }
        const result = await stripe.confirmCardPayment(pi.clientSecret, { payment_method: { card } });
        if (result.error) {
          toast.error(result.error.message || 'Payment failed.');
          setIsProcessing(false);
          return;
        }
        if (result.paymentIntent?.status !== 'succeeded') {
          toast.error('Payment not completed.');
          setIsProcessing(false);
          return;
        }
      } else {
        // Simulated payment (no Stripe key, or wallet method).
        await new Promise(r => setTimeout(r, 1200));
      }

      const data = await recordPurchase(templateId, token);
      if (data.success) {
        toast.success(data.message || 'Purchase successful!');
        onConfirm();
      } else {
        toast.error(data.message || 'Purchase failed. Please try again.');
        setIsProcessing(false);
      }
    } catch {
      toast.error('Could not connect to server. Please check your connection.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        {STRIPE_PK && (
          <span className="ml-2 px-3 py-1 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
            Stripe Test Mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Billing Info */}
          <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Billing Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                <input type="text" defaultValue="Ahmad" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                <input type="text" defaultValue="Khan" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <input type="email" defaultValue="ahmad@example.com" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Country</label>
                <select className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold">
                  <option>Pakistan</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                </select>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Payment Method</h2>

            <div className="space-y-3 mb-8">
              {[
                { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                { id: 'easypaisa', label: 'EasyPaisa', icon: Wallet },
                { id: 'jazzcash', label: 'JazzCash', icon: Smartphone },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === method.id
                      ? 'border-[#0052CC] bg-blue-50/50 shadow-md'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === method.id ? 'bg-[#0052CC] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <span className={`font-bold ${paymentMethod === method.id ? 'text-[#0052CC]' : 'text-gray-700'}`}>{method.label}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === method.id ? 'border-[#0052CC] bg-[#0052CC]' : 'border-gray-200'}`}>
                    {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6 pt-4 border-t border-gray-100"
              >
                {stripeCardEnabled ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Card Details (Stripe)</label>
                    <div className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl">
                      <CardElement options={CARD_ELEMENT_OPTIONS} />
                    </div>
                    <p className="text-xs text-gray-400 ml-1">Test card: 4242 4242 4242 4242 · any future expiry · any CVC.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="1234 5678 9012 3456" className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#0052CC]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input type="text" placeholder="MM/YY" className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">CVV</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input type="password" placeholder="123" className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 ml-1">Demo mode — payment is simulated (no Stripe key configured).</p>
                  </>
                )}
              </motion.div>
            )}

            {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t border-gray-100"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="03xx xxxxxxx" className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic">Mobile wallet payments are simulated in this build. You will receive a push notification on your mobile device to authorize the transaction.</p>
              </motion.div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          {/* Order Summary */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h2>

            <div className="flex flex-col gap-6 mb-8 pb-8 border-b border-gray-100">
              <div className="flex gap-4">
                <div className={`w-24 h-24 ${template?.color || 'bg-blue-500'} rounded-2xl shadow-inner`} />
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight mb-1">{template?.title || 'Modern Dashboard Template'}</h4>
                  <p className="text-sm text-gray-500">by {template?.author || 'Ahmad Khan'}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-xs font-bold text-gray-600">4.8</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2">
                {[
                  'Fully Responsive Design',
                  'Dark & Light Mode',
                  'React Components',
                  'Tailwind CSS',
                  'Commercial License'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal:</span>
                <span className="font-bold text-gray-900">Rs {template?.price?.toLocaleString() || '2,500'}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax (0%):</span>
                <span className="font-bold text-gray-900">Rs 0</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-900">Total:</span>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#0052CC]">Rs {template?.price?.toLocaleString() || '2,500'}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">~ ${(template?.price / 280).toFixed(0)} USD</p>
                </div>
              </div>
            </div>

            <button
              disabled={isProcessing || (stripeCardEnabled && !stripe)}
              onClick={handleConfirm}
              className="w-full bg-[#0052CC] hover:bg-[#0047b3] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Confirm Purchase
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
              {STRIPE_PK ? 'Secure payment powered by Stripe (test mode)' : 'Secure payment powered by Stripe'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap in Stripe Elements (stripe may be null → simulated flow inside).
export const Checkout: React.FC<CheckoutProps> = (props) => (
  <Elements stripe={stripePromise}>
    <CheckoutInner {...props} />
  </Elements>
);
