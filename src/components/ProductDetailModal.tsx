import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Info,
  Tag,
  MessageCircle,
  ExternalLink,
  Lock,
  Sparkles,
  Plus,
  Minus,
  Check
} from 'lucide-react';
import { Product } from '../types';
import { formatPrice, calculateDiscount } from '../lib/utils';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onDirectCheckout: (product: Product, quantity: number) => void;
  whatsappNumber?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onDirectCheckout,
  whatsappNumber = '905010000000',
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'];

  const discountPercent =
    product.discountPercent || calculateDiscount(product.price, product.salePrice);
  const effectivePrice = product.salePrice ?? product.price;
  const savings =
    product.salePrice && product.salePrice < product.price
      ? product.price - product.salePrice
      : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleLemonSqueezyCheckout = () => {
    if (isOutOfStock) return;
    if (product.paymentUrl) {
      window.open(product.paymentUrl, '_blank', 'noopener,noreferrer');
    } else {
      addToCart(product, quantity);
      onDirectCheckout(product, quantity);
      onClose();
    }
  };

  const handleWhatsAppOrder = () => {
    const text = `Merhaba DeparStore, "${product.title}" (${formatPrice(effectivePrice)}) ürününüzü satın almak istiyorum. Ödeme ve anında teslimat detaylarını iletebilir misiniz?`;
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      
      {/* Modal Container */}
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-zinc-200 relative animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-zinc-100/90 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 rounded-full transition cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 p-5 sm:p-8">
          
          {/* Left Column: Image Gallery & Digital Badges */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl bg-zinc-900 overflow-hidden border border-zinc-800">
              {discountPercent > 0 && (
                <div className="absolute top-3 left-3 z-10 bg-zinc-950/90 border border-zinc-700 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs backdrop-blur-xs">
                  -%{discountPercent} İNDİRİM
                </div>
              )}

              {product.badge && (
                <div className="absolute top-3 right-3 z-10 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                  {product.badge}
                </div>
              )}

              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Thumbnail selector if multiple images */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border transition cursor-pointer shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-zinc-950 ring-1 ring-zinc-950'
                        : 'border-zinc-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 grid grid-cols-3 gap-2 text-center text-xs text-zinc-600">
              <div className="flex flex-col items-center gap-1">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-[11px] text-zinc-900">Anında Teslim</span>
                <span className="text-[10px] text-zinc-400">Otomatik & Hızlı</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-[11px] text-zinc-900">Tam Garanti</span>
                <span className="text-[10px] text-zinc-400">Değişim / Telafi</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-[11px] text-zinc-900">256-Bit SSL</span>
                <span className="text-[10px] text-zinc-400">Lemon Squeezy</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="flex flex-col justify-between space-y-5">
            
            <div className="space-y-4">
              
              {/* Category, Platform & Rating */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-md">
                    {product.category}
                  </span>
                  {product.platform && (
                    <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {product.platform}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-zinc-900 font-semibold text-xs">
                  <Star className="w-3.5 h-3.5 fill-zinc-900 text-zinc-900" />
                  <span>{product.rating ? product.rating.toFixed(1) : '4.9'}</span>
                  <span className="text-zinc-400 text-[11px]">
                    ({product.reviewCount || 48} değerlendirme)
                  </span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight tracking-tight">
                {product.title}
              </h2>

              {/* Price & Savings Calculation */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                    {formatPrice(effectivePrice)}
                  </span>
                  {product.salePrice && product.salePrice < product.price && (
                    <span className="text-sm text-zinc-400 line-through font-normal">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>

                {savings > 0 && (
                  <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bu dijital üründe {formatPrice(savings)} indirim kazandınız</span>
                  </div>
                )}
              </div>

              {/* Stock & Delivery Status */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {product.deliveryTime || 'Ödeme Sonrası Anında Otomatik Teslim'}
                </span>

                {isOutOfStock ? (
                  <span className="text-zinc-500 font-semibold bg-zinc-100 px-2.5 py-1 rounded-md">
                    Tükendi
                  </span>
                ) : (
                  <span className="text-zinc-700 font-medium bg-zinc-100 px-2.5 py-1 rounded-md">
                    Stokta ({product.stock} Adet)
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal">
                {product.description}
              </div>

              {/* Technical Specifications (Teknik Özellikler) */}
              {product.specs && product.specs.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-zinc-500" />
                    Ürün & Kurulum Detayları
                  </h4>
                  <div className="bg-zinc-50 rounded-xl border border-zinc-200 overflow-hidden divide-y divide-zinc-200 text-xs">
                    {product.specs.map((spec, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-2 p-2.5 hover:bg-zinc-100/70 transition-colors"
                      >
                        <span className="font-medium text-zinc-500">{spec.key}</span>
                        <span className="font-semibold text-zinc-900 text-right">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Lemon Squeezy, WhatsApp & Cart */}
            <div className="space-y-2.5 pt-4 border-t border-zinc-200">
              {/* Primary Lemon Squeezy Direct Buy Button */}
              <button
                onClick={handleLemonSqueezyCheckout}
                disabled={isOutOfStock}
                className="w-full py-3 px-4 bg-[#121212] hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer group active:scale-98"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Lemon Squeezy ile Güvenli Satın Al ({formatPrice(effectivePrice * quantity)})</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
              </button>

              {/* Secondary Actions Grid: WhatsApp & Sepete Ekle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* WhatsApp Quick Order */}
                <button
                  onClick={handleWhatsAppOrder}
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp ile Sipariş Ver</span>
                </button>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                    isOutOfStock
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      : isAdded
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sepete Eklendi</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-700" />
                      <span>Sepete Ekle</span>
                    </>
                  )}
                </button>
              </div>

              {/* Payment Assurance Note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 pt-1">
                <Lock className="w-3 h-3 text-zinc-400" />
                <span>Lemon Squeezy 256-Bit SSL Şifreleme & Anında Lisans / Kod Teslimatı</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

