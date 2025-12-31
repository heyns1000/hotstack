import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useCurrency } from '@/react-app/hooks/useCurrency';

interface CartItem {
  id: number;
  item_type: string;
  item_id: string;
  item_name: string;
  item_description: string;
  price: number;
  currency: string;
  quantity: number;
  metadata: any;
}

interface AIRecommendation {
  itemName: string;
  itemType: string;
  itemId: string;
  reasoning: string;
  confidence: number;
  estimatedValue: number;
  synergy: string;
}

interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
}

export default function ShoppingCart() {
  const { currency, formatPrice } = useCurrency();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('fruitful_session_id');
    if (!sid) {
      sid = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('fruitful_session_id', sid);
    }
    return sid;
  });
  const [notification, setNotification] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCart();
    loadRecommendations();
    loadHeatmap();
    trackPageView();
  }, []);

  useEffect(() => {
    // Track mouse movements for heatmap
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() < 0.1) { // Sample 10% of movements
        trackInteraction('mouse_move', 'cart', 'page', {
          x: e.clientX,
          y: e.clientY
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  const trackPageView = async () => {
    await trackInteraction('page_view', 'cart', 'cart_page');
  };

  const trackInteraction = async (type: string, page: string, element: string, coordinates?: { x: number; y: number }) => {
    try {
      await fetch('/api/cart/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          interactionType: type,
          page,
          element,
          coordinates,
          metadata: { timestamp: Date.now() }
        })
      });
    } catch (error) {
      console.error('Track error:', error);
    }
  };

  const loadCart = async () => {
    try {
      const response = await fetch(`/api/cart/items?sessionId=${sessionId}`);
      const data = await response.json();
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Load cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/cart/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          context: 'cart_view'
        })
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Load recommendations error:', error);
    }
  };

  const loadHeatmap = async () => {
    try {
      const response = await fetch('/api/cart/heatmap?page=cart&hours=24');
      const data = await response.json();
      
      // Process heatmap data
      const points: HeatmapPoint[] = [];
      data.heatmap?.forEach((item: any) => {
        if (item.coordinates) {
          points.push({
            x: item.coordinates.x,
            y: item.coordinates.y,
            intensity: item.count
          });
        }
      });
      setHeatmapData(points);
    } catch (error) {
      console.error('Load heatmap error:', error);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      await loadCart();
      trackInteraction('update_quantity', 'cart', `item_${itemId}`);
      showNotification('✓ Cart updated');
    } catch (error) {
      console.error('Update quantity error:', error);
      showNotification('❌ Failed to update');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE'
      });
      await loadCart();
      trackInteraction('remove_item', 'cart', `item_${itemId}`);
      showNotification('✓ Item removed');
    } catch (error) {
      console.error('Remove item error:', error);
      showNotification('❌ Failed to remove');
    }
  };

  const addRecommendationToCart = async (rec: AIRecommendation) => {
    try {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          itemType: rec.itemType,
          itemId: rec.itemId,
          itemName: rec.itemName,
          itemDescription: rec.reasoning,
          price: rec.estimatedValue,
          currency,
          quantity: 1,
          metadata: { source: 'ai_recommendation', confidence: rec.confidence }
        })
      });
      await loadCart();
      trackInteraction('add_recommendation', 'cart', rec.itemName);
      showNotification(`✨ ${rec.itemName} added to cart!`);
    } catch (error) {
      console.error('Add recommendation error:', error);
      showNotification('❌ Failed to add');
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showNotification('⚠️ Cart is empty');
      return;
    }

    setCheckoutLoading(true);
    trackInteraction('checkout_initiated', 'cart', 'checkout_button');

    try {
      // In production, integrate with PayPal SDK here
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          paymentProvider: 'paypal',
          currency
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`🎉 Order ${data.orderNumber} confirmed!`);
        await loadCart();
        await loadRecommendations();
        
        // Simulate PayPal redirect (in production, use actual PayPal SDK)
        setTimeout(() => {
          showNotification('✅ Payment successful - Order completed!');
        }, 2000);
      } else {
        showNotification('❌ Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showNotification('❌ Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getItemIcon = (type: string) => {
    if (type === 'sector') return '🌐';
    if (type === 'brand') return '🏢';
    if (type === 'subnode') return '🧩';
    if (type === 'protocol') return '⚡';
    return '📦';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🛒</div>
          <div className="text-white text-xl font-bold">Loading cart...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={pageRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 relative overflow-hidden"
    >
      {/* Heatmap Overlay */}
      {showHeatmap && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <svg className="w-full h-full">
            {heatmapData.map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r={Math.min(50, point.intensity * 5)}
                fill="rgba(255, 0, 0, 0.3)"
                className="animate-pulse"
              />
            ))}
          </svg>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-white/20 backdrop-blur-md animate-slide-in">
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-4xl">🛒</span>
              <div>
                <h1 className="text-2xl font-black text-white">Shopping Cart</h1>
                <p className="text-xs text-gray-400">AI-Powered Recommendations</p>
              </div>
            </Link>
            <div className="flex gap-4">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  showHeatmap 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🔥 Heatmap
              </button>
              <Link to="/hotstack" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
                HotStack
              </Link>
              <Link to="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-3xl font-black text-blue-400">{cartItems.length}</div>
            <div className="text-white font-semibold">Items</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-2xl font-black text-green-400">{formatPrice(calculateTotal())}</div>
            <div className="text-white font-semibold">Total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-2 animate-pulse">✨</div>
            <div className="text-3xl font-black text-purple-400">{recommendations.length}</div>
            <div className="text-white font-semibold">AI Picks</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-black text-red-400">{heatmapData.length}</div>
            <div className="text-white font-semibold">Hotspots</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <span>🛒</span> Your Cart
              </h2>

              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛍️</div>
                  <p className="text-gray-300 text-xl mb-4">Your cart is empty</p>
                  <Link
                    to="/hotstack"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Browse HotStack
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-black/30 rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{getItemIcon(item.item_type)}</div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white mb-1">{item.item_name}</h3>
                          {item.item_description && (
                            <p className="text-sm text-gray-400 mb-3">{item.item_description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 mb-3">
                            <span className="text-xs px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full font-semibold">
                              {item.item_type}
                            </span>
                            <span className="text-2xl font-bold text-green-400">
                              {formatPrice(item.price)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2">
                              <button
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold transition-all"
                              >
                                −
                              </button>
                              <span className="text-white font-bold px-3">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold transition-all"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg font-semibold transition-all"
                            >
                              🗑️ Remove
                            </button>

                            <div className="ml-auto text-right">
                              <div className="text-sm text-gray-400">Subtotal</div>
                              <div className="text-xl font-bold text-white">
                                {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-500/40">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <span className="animate-pulse">✨</span> Interstellar AI Picks
                    <span className="text-sm text-purple-300 font-normal">Powered by Gemini</span>
                  </h2>
                  <button
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                  >
                    {showRecommendations ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showRecommendations && (
                  <div className="space-y-4">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-black/30 rounded-xl p-6 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                              {getItemIcon(rec.itemType)} {rec.itemName}
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                rec.confidence >= 80 ? 'bg-green-500/30 text-green-300' :
                                rec.confidence >= 60 ? 'bg-yellow-500/30 text-yellow-300' :
                                'bg-red-500/30 text-red-300'
                              }`}>
                                {rec.confidence}% match
                              </span>
                            </h3>
                            <p className="text-sm text-gray-300 mb-3">{rec.reasoning}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>💎 Value: {formatPrice(rec.estimatedValue)}</span>
                              <span>•</span>
                              <span>🔗 {rec.synergy}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => addRecommendationToCart(rec)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                          >
                            ➕ Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout Summary */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 sticky top-24">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <span>💳</span> Checkout
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-white">
                  <span>Subtotal:</span>
                  <span className="font-bold">{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Tax (included):</span>
                  <span>{formatPrice(calculateTotal() * 0.1)}</span>
                </div>
                <div className="border-t border-white/20 pt-4 flex justify-between text-white text-xl font-black">
                  <span>Total:</span>
                  <span className="text-green-400">{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || checkoutLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all shadow-2xl hover:shadow-3xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {checkoutLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>💳</span>
                    Checkout with PayPal
                  </>
                )}
              </button>

              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <div className="text-xs text-blue-300 text-center mb-2 font-semibold">
                  🔒 Secure Checkout
                </div>
                <div className="text-xs text-gray-400 text-center">
                  PayPal • SSL Encrypted • PCI Compliant
                </div>
              </div>

              <div className="mt-6 text-xs text-gray-500 text-center">
                <p>By proceeding, you agree to our Terms of Service</p>
                <p className="mt-1">and Privacy Policy</p>
              </div>
            </div>

            {/* Heatmap Info */}
            {showHeatmap && (
              <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 backdrop-blur-md rounded-2xl p-6 border-2 border-red-500/40">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  🔥 User Activity Heatmap
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Showing {heatmapData.length} interaction hotspots from the last 24 hours
                </p>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full opacity-30"></div>
                    <span>High activity zones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full opacity-50"></div>
                    <span>Click concentrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full opacity-70"></div>
                    <span>Popular elements</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
