import React, { useState } from 'react';
import { ShoppingBag, Star, Eye, Check, Zap, ShieldCheck, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, calculateDiscount, generateOrderNumber } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { createLemonCheckout, redirectToLemonCheckout, getSuccessRedirectUrl, savePendingOrder } from '../lib/lemonSqueezy';
import { RedirectingOverlay } from './RedirectingOverlay';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { addToCart } = useCart();
  const { user, userProfile } = useAuth();
  const [isAdded, setIsAdded] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const discountPercent =
    product.discountPercent || calculateDiscount(product.price, product.salePrice);
  const effectivePrice = product.salePrice ?? product.price;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleDirectBuy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || isLoadingCheckout) return;

    setIsLoadingCheckout(true);
    setCheckoutError(null);

    const orderNumber = generateOrderNumber();
    const orderPayload = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      userId: user?.uid || userProfile?.uid || 'guest_user',
      userEmail: userProfile?.email || user?.email || 'musteri@deparstore.me',
      items: [
        {
          id: product.id,
          title: product.title,
          price: effectivePrice,
          quantity: 1,
          image: product.images?.[0] || '',
          specs: product.specs || [],
        },
      ],
      subtotal: effectivePrice,
      shippingFee: 0,
      discountAmount: 0,
      total: effectivePrice,
      shippingAddress: {
        fullName: userProfile?.displayName || 'Müşteri',
        email: userProfile?.email || user?.email || '',
        phone: userProfile?.phone || '',
        addressDetail: 'Dijital Teslimat',
        city: 'Dijital',
      },
      payment: {
        cardHolder: userProfile?.displayName || 'Lemon Squeezy Ödeme',
        method: 'lemon_squeezy',
        paidAt: new Date().toISOString(),
      },
      status: 'İnceleniyor',
      createdAt: new Date().toISOString(),
    };

    // Sipariş, ödeme GERÇEKTEN tamamlanmadan Firestore'a yazılmaz.
    // Aksi halde ödeme sayfasından vazgeçilen/iptal edilen denemeler de
    // sipariş geçmişinde görünürdü. Taslak, ödeme başarıyla bitip
    // kullanıcı geri yönlendirildiğinde yazılmak üzere yerelde saklanır.
    savePendingOrder(orderNumber, orderPayload);

    const res = await createLemonCheckout({
      productId: product.id,
      title: product.title,
      price: effectivePrice,
      orderId: orderNumber,
      customerEmail: user?.email,
      customerName: userProfile?.displayName,
      redirectUrl: getSuccessRedirectUrl(orderNumber),
    });

    if (res.success && res.url) {
      setIsLoadingCheckout(false);
      redirectToLemonCheckout(res.url);
    } else {
      setIsLoadingCheckout(false);
      // Surface the real error instead of silently swallowing it -
      // previously this just reopened the details modal with no explanation.
      setCheckoutError(res.error || 'Ödeme bağlantısı oluşturulamadı. Lütfen tekrar deneyin.');
      setTimeout(() => setCheckoutError(null), 5000);
    }
  };

  const mainImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group bg-white rounded-xl border border-zinc-200/80 hover:border-zinc-400 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer relative"
    >
      <RedirectingOverlay show={isLoadingCheckout} />
      {/* Top Image Container */}
      <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-zinc-950/90 border border-zinc-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 backdrop-blur-xs">
            <span>-%{discountPercent}</span>
          </div>
        )}

        {/* Custom Digital Badge / Platform */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1">
          {product.badge ? (
            <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
              {product.badge}
            </span>
          ) : isOutOfStock ? (
            <span className="bg-zinc-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
              Tükendi
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
              Son {product.stock} Adet
            </span>
          ) : product.isNew ? (
            <span className="bg-zinc-100 text-zinc-900 border border-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
              Yeni
            </span>
          ) : null}

          {product.platform && (
            <span className="bg-black/60 text-zinc-200 text-[9px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs border border-white/10">
              {product.platform}
            </span>
          )}
        </div>

        {/* Product Image */}
        <img
          src={mainImage}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="bg-white text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border border-zinc-200">
            <Eye className="w-3.5 h-3.5" />
            İncele
          </span>
          <span
            onClick={handleDirectBuy}
            className="bg-[#121212] hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
          >
            {isLoadingCheckout ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            )}
            Hemen Al
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        
        <div className="space-y-1.5">
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px] truncate max-w-[170px]">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-zinc-800 font-semibold text-xs shrink-0">
              <Star className="w-3 h-3 fill-zinc-900 text-zinc-900" />
              <span>{product.rating ? product.rating.toFixed(1) : '4.9'}</span>
              {product.reviewCount && (
                <span className="text-zinc-400 text-[10px]">({product.reviewCount})</span>
              )}
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 line-clamp-2 leading-snug group-hover:text-zinc-600 transition-colors">
            {product.title}
          </h3>

          {/* Technical Specs Preview Chips */}
          {product.specs && product.specs.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {product.specs.slice(0, 2).map((spec, idx) => (
                <span
                  key={idx}
                  className="bg-zinc-100 text-zinc-700 text-[10px] font-medium px-1.5 py-0.5 rounded truncate max-w-[140px]"
                >
                  {spec.key}: {spec.value}
                </span>
              ))}
            </div>
          )}

          {/* Delivery Indicator */}
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{product.deliveryTime || 'Anında Dijital Teslimat'}</span>
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div>
            {/* Strikethrough Old Price */}
            {product.salePrice && product.salePrice < product.price && (
              <div className="text-[11px] text-zinc-400 line-through font-normal leading-none mb-0.5">
                {formatPrice(product.price)}
              </div>
            )}
            {/* Bold Current Price */}
            <div className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight">
              {formatPrice(effectivePrice)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Add To Cart Button */}
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`p-2 rounded-lg font-semibold transition flex items-center justify-center cursor-pointer ${
                isOutOfStock
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  : isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
              }`}
              title="Sepete Ekle"
            >
              {isAdded ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Direct Lemon Squeezy / Buy Button */}
            <button
              onClick={handleDirectBuy}
              disabled={isOutOfStock || isLoadingCheckout}
              className="px-2.5 py-2 bg-[#121212] hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Lemon Squeezy ile Satın Al"
            >
              {isLoadingCheckout ? (
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              ) : (
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              )}
              <span className="hidden sm:inline">
                {isLoadingCheckout ? 'Hazırlanıyor...' : 'Satın Al'}
              </span>
            </button>
          </div>

          {checkoutError && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2 text-[11px] leading-snug text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5"
            >
              {checkoutError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

