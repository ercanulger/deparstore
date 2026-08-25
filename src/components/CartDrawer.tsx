import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  Check,
  Truck,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    totalSavings,
    shippingFee,
    discountAmount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
    if (res.success) {
      setCouponInput('');
    }
  };

  const freeShippingProgress = Math.min(100, (subtotal / 500) * 100);
  const remainingForFreeShipping = Math.max(0, 500 - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      
      {/* Drawer Panel */}
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-zinc-200/80 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-zinc-900" />
            <h2 className="font-bold text-sm text-zinc-900">Alışveriş Sepeti</h2>
            <span className="text-[11px] bg-zinc-100 font-semibold px-2 py-0.5 rounded-full text-zinc-700">
              {items.length} Çeşit
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-zinc-50/80 px-5 py-3 border-b border-zinc-200/80">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="flex items-center gap-1.5 text-zinc-700 text-[11px]">
              <Truck className="w-3.5 h-3.5 text-zinc-500" />
              {remainingForFreeShipping > 0 ? (
                <span>
                  <strong>{formatPrice(remainingForFreeShipping)}</strong> daha ekleyin, kargo <strong>Ücretsiz</strong> olsun!
                </span>
              ) : (
                <span className="text-zinc-900 font-bold flex items-center gap-1">
                  Ücretsiz Kargo Kazandınız!
                </span>
              )}
            </span>
            <span className="text-[10px] text-zinc-500 font-semibold">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                freeShippingProgress >= 100 ? 'bg-zinc-900' : 'bg-zinc-700'
              }`}
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-zinc-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-zinc-400">
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-800 text-sm">Sepetiniz Boş</h3>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Mağazamızdaki seçkin ürünleri keşfedip sepetinize ekleyebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-4 py-2 bg-[#121212] text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer shadow-xs"
              >
                Alışverişe Başla
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => {
              const effectivePrice = product.salePrice ?? product.price;
              const img =
                product.images && product.images.length > 0
                  ? product.images[0]
                  : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

              return (
                <div key={product.id} className="pt-3 flex gap-3 items-center group">
                  {/* Thumbnail */}
                  <img
                    src={img}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-cover bg-zinc-50 border border-zinc-200 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-zinc-900 line-clamp-1 group-hover:text-zinc-600 transition">
                      {product.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-xs text-zinc-950">
                        {formatPrice(effectivePrice)}
                      </span>
                      {product.salePrice && product.salePrice < product.price && (
                        <span className="text-[10px] text-zinc-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Quantity & Remove controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50 p-0.5">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:bg-white transition cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-zinc-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={product.stock ? quantity >= product.stock : false}
                          className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:bg-white transition cursor-pointer disabled:opacity-30"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="text-zinc-400 hover:text-rose-600 p-1 transition cursor-pointer"
                        title="Ürünü sepetten sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Coupon, Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-zinc-200/80 bg-zinc-50/80 space-y-3">
            
            {/* Coupon Code Section */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-zinc-100 border border-zinc-300 rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-900 font-semibold">
                    <Tag className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      {appliedCoupon.code} (%{appliedCoupon.value} İndirim)
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-zinc-600 hover:text-zinc-900 text-xs font-semibold underline cursor-pointer"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="İndirim Kodu (INDIRIM20)"
                    className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 uppercase font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#121212] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Uygula
                  </button>
                </form>
              )}

              {couponFeedback && (
                <p
                  className={`text-[11px] mt-1 font-medium ${
                    couponFeedback.success ? 'text-zinc-700' : 'text-rose-600'
                  }`}
                >
                  {couponFeedback.message}
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-200">
              <div className="flex justify-between">
                <span>Ara Toplam</span>
                <span className="font-semibold text-zinc-900">{formatPrice(subtotal)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-zinc-700 font-semibold">
                  <span>Ürün İndirimleri</span>
                  <span>-{formatPrice(totalSavings)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-zinc-700 font-semibold">
                  <span>Kupon İndirimi ({appliedCoupon?.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Kargo Bedeli</span>
                <span className="font-semibold text-zinc-900">
                  {shippingFee === 0 ? (
                    <strong className="text-zinc-900">ÜCRETSİZ</strong>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-xs font-bold text-zinc-900 pt-2 border-t border-zinc-200">
                <span>Ödenecek Tutar</span>
                <span className="text-base text-zinc-950 font-black">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
              className="w-full py-3 bg-[#121212] hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Güvenli Ödemeye Geç</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
