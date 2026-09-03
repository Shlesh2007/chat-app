import React, { useState } from 'react';
import { X, Zap, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';
import api from '../lib/api.js';

const PACKS = [
  { id: 'starter', credits: 100,  price: 10,  label: 'Starter',  popular: false, desc: 'Quick boost for daily tasks' },
  { id: 'popular', credits: 500,  price: 50,  label: 'Popular',  popular: true,  desc: 'Best value for power users'  },
  { id: 'pro',     credits: 1200, price: 100, label: 'Pro Pack', popular: false, desc: 'Maximum credits & fast speed' },
];

export default function BuyCreditsModal() {
  const { setShowBuyCredits } = useChatStore();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handleBuy = async (pack) => {
    setLoading(pack.id);
    setError('');
    try {
      // Create order
      const { data: order } = await api.post('/payment/order', { pack: pack.id });

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      // Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Chat-App AI Pro',
          description: `${pack.credits} AI Credits Pack`,
          order_id: order.orderId,
          prefill: { email: user?.email, name: user?.username },
          theme: { color: '#6366f1' },
          handler: async (response) => {
            try {
              const { data } = await api.post('/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                pack: pack.id,
              });
              updateUser({ credits: data.credits });
              setSuccess(`⚡ ${data.added} credits added! Your total balance is now ${data.credits} credits.`);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        });
        rzp.open();
      });
    } catch (err) {
      if (err.message !== 'Payment cancelled') {
        setError(err.response?.data?.error || err.message || 'Payment failed');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
      <div className="glass-card rounded-3xl w-full max-w-md p-6 border border-slate-700/80 shadow-2xl relative overflow-hidden">

        {/* Ambient Top Background Orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Zap size={20} className="text-white fill-white/20" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold theme-text-heading text-lg leading-tight">Top Up Credits</h2>
              <p className="text-[11px] theme-text-muted">Instant AI processing & image generation</p>
            </div>
          </div>
          <button
            onClick={() => setShowBuyCredits(false)}
            className="theme-text-muted hover:theme-text-heading p-1.5 rounded-xl hover:glass-card-hover transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="mt-4 mb-6 p-3 rounded-2xl glass-input flex items-center justify-between border border-opacity-20 relative z-10">
          <span className="text-xs theme-text-muted font-medium">Current Balance:</span>
          <div className="flex items-center gap-1.5">
            <Zap size={15} className="text-amber-400 fill-amber-400/30" />
            <span className="font-extrabold theme-text-heading text-sm">{user?.credits ?? 0} Credits</span>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center relative z-10 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl">
              <CheckCircle size={36} />
            </div>
            <div>
              <h3 className="text-base font-bold theme-text-heading mb-1">Payment Successful!</h3>
              <p className="text-xs theme-text-muted max-w-xs">{success}</p>
            </div>
            <button
              onClick={() => setShowBuyCredits(false)}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-2xl shadow-lg transition duration-200 mt-2"
            >
              Back to Chatting
            </button>
          </div>
        ) : (
          <div className="relative z-10 space-y-3.5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            {PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-2xl p-4 transition-all duration-300 flex items-center justify-between border ${
                  pack.popular
                    ? 'bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-950/40'
                    : 'glass-card hover:glass-card-hover border-slate-700/60'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles size={10} />
                    BEST VALUE
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold theme-text-heading text-sm">{pack.label}</span>
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      ⚡ {pack.credits} Credits
                    </span>
                  </div>
                  <p className="text-[11px] theme-text-muted">{pack.desc}</p>
                </div>

                <button
                  onClick={() => handleBuy(pack)}
                  disabled={!!loading}
                  className={`shrink-0 font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-md ${
                    pack.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50'
                      : 'glass-input hover:bg-indigo-600 hover:text-white theme-text-heading border-slate-700 disabled:opacity-50'
                  }`}
                >
                  {loading === pack.id ? 'Opening...' : `₹${pack.price}`}
                </button>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] theme-text-muted opacity-80 text-center">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Secured by Razorpay · UPI, Paytm, QR, Cards & Net Banking</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
