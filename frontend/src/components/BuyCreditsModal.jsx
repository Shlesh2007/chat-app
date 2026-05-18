import { useState } from 'react';
import { X, Zap, CheckCircle } from 'lucide-react';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';
import api from '../lib/api.js';

const PACKS = [
  { id: 'starter', credits: 100,  price: 500,  label: 'Starter',  popular: false },
  { id: 'popular', credits: 500,  price: 1000, label: 'Popular',  popular: true  },
  { id: 'pro',     credits: 1200, price: 2000, label: 'Pro',      popular: false },
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
          name: 'Chat-App',
          description: `${pack.credits} Credits`,
          order_id: order.orderId,
          prefill: { email: user?.email, name: user?.username },
          theme: { color: '#16a34a' },
          handler: async (response) => {
            try {
              const { data } = await api.post('/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                pack: pack.id,
              });
              updateUser({ credits: data.credits });
              setSuccess(`${data.added} credits added! You now have ${data.credits} credits.`);
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            <h2 className="text-white font-bold text-lg">Buy Credits</h2>
          </div>
          <button onClick={() => setShowBuyCredits(false)} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Current balance: <span className="text-white font-medium">{user?.credits ?? 0} credits</span>
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle size={48} className="text-green-400" />
            <p className="text-green-300 font-medium text-center">{success}</p>
            <button
              onClick={() => setShowBuyCredits(false)}
              className="mt-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-2.5 rounded-xl transition"
            >
              Start Chatting
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {PACKS.map((pack) => (
                <div key={pack.id}
                  className={`relative border rounded-xl p-4 flex items-center justify-between ${
                    pack.popular ? 'border-green-600 bg-green-900/20' : 'border-gray-600 bg-gray-700/30'
                  }`}>
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-4 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      POPULAR
                    </span>
                  )}
                  <div>
                    <p className="text-white font-semibold">{pack.label}</p>
                    <p className="text-gray-400 text-sm">
                      <span className="text-yellow-400 font-medium">⚡ {pack.credits} credits</span>
                      <span className="text-gray-500 ml-2">· ₹{(pack.credits / pack.price * 100).toFixed(1)} per 100</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleBuy(pack)}
                    disabled={!!loading}
                    className={`shrink-0 font-semibold px-4 py-2 rounded-lg transition text-sm ${
                      pack.popular
                        ? 'bg-green-600 hover:bg-green-500 text-white disabled:opacity-50'
                        : 'bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50'
                    }`}
                  >
                    {loading === pack.id ? 'Opening...' : `₹${pack.price}`}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secured by Razorpay · UPI, Paytm, QR, Cards & Net Banking accepted
            </p>
          </>
        )}
      </div>
    </div>
  );
}
