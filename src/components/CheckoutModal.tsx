import React, { useState } from 'react';
import {
  X,
  Lock,
  ArrowRight,
  ArrowLeft,
  Zap,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Order, OrderAddress } from '../types';
import { formatPrice, generateOrderNumber } from '../lib/utils';
import { createLemonCheckout, redirectToLemonCheckout, getSuccessRedirectUrl, savePendingOrder } from '../lib/lemonSqueezy';
import { RedirectingOverlay } from './RedirectingOverlay';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, userProfile } = useAuth();
  const {
    items,
    subtotal,
    shippingFee,
    discountAmount,
    total,
    clearCart,
    appliedCoupon,
  } = useCart();

  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [isLemonLoading, setIsLemonLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Address Form State
  const [address, setAddress] = useState<OrderAddress>({
    fullName: userProfile?.displayName || '',
    email: userProfile?.email || user?.email || '',
    phone: userProfile?.phone || '',
    city: userProfile?.city || 'İstanbul',
    district: userProfile?.district || 'Kadıköy',
    addressDetail: userProfile?.address || '',
    zipCode: '34710',
  });

  if (!isOpen) return null;

  const handleLemonSqueezyCheckout = async () => {
    if (items.length === 0 || isLemonLoading) return;

    setIsLemonLoading(true);
    setCheckoutError(null);

    const orderNumber = generateOrderNumber();
    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      userId: user?.uid || userProfile?.uid || 'guest_user',
      userEmail: address.email || 'musteri@deparstore.me',
      items: items.map((item) => ({
        id: item.product.id,
        title: item.product.title,
        price: item.product.salePrice ?? item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0] || '',
        specs: item.product.specs || [],
      })),
      subtotal,
      shippingFee,
      discountAmount,
      total,
      shippingAddress: address,
      payment: {
        cardHolder: address.fullName || 'Lemon Squeezy Ödeme',
        method: 'lemon_squeezy',
        paidAt: new Date().toISOString(),
      },
      status: 'İnceleniyor',
      createdAt: new Date().toISOString(),
    };

    // Sipariş, ödeme GERÇEKTEN tamamlanmadan Firestore'a yazılmaz. Aksi
    // halde ödeme sayfasından vazgeçilen/iptal edilen denemeler de
    // sipariş geçmişinde görünürdü. Taslak, ödeme başarıyla bitip
    // kullanıcı geri yönlendirildiğinde yazılmak üzere yerelde saklanır.
    savePendingOrder(orderNumber, newOrder);

    const res = await createLemonCheckout({
      productId: items[0]?.product.id || 'cart_checkout',
      title: items.length === 1 ? items[0].product.title : `DeparStore Sepet (${items.length} Ürün)`,
      price: total,
      customerEmail: address.email,
      customerName: address.fullName,
      customerPhone: address.phone,
      orderId: orderNumber,
      redirectUrl: getSuccessRedirectUrl(orderNumber),
    });

    setIsLemonLoading(false);

    if (res.success && res.url) {
      clearCart();
      redirectToLemonCheckout(res.url);
      // Lemon Squeezy sekmesi/penceresi açıldı; arkada kalan bu modalın
      // artık burada durmasına gerek yok, ödeme onun sayfasında ilerler.
      onClose();
    } else {
      setCheckoutError(res.error || 'Lemon Squeezy ödeme bağlantısı oluşturulamadı.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <RedirectingOverlay show={isLemonLoading} />
      
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-zinc-200/80 overflow-hidden relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#121212] text-white flex items-center justify-center">
              <Lock className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-zinc-900">
                256-Bit SSL Güvenli Ödeme
              </h2>
              <p className="text-[11px] text-zinc-500 font-normal">
                {step === 'address' && 'Adım 1/2: Teslimat ve İletişim Bilgileri'}
                {step === 'payment' && 'Adım 2/2: Ödeme Onayı'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7">
          
          {/* STEP 1: ADDRESS */}
          {step === 'address' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep('payment');
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">E-posta Adresi *</label>
                  <input
                    type="email"
                    required
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    placeholder="ahmet@ornek.com"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Telefon Numarası *</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="+90 555 123 45 67"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Şehir / İl *</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="İstanbul"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">İlçe *</label>
                  <input
                    type="text"
                    required
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    placeholder="Kadıköy"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Posta Kodu</label>
                  <input
                    type="text"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    placeholder="34710"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-zinc-800">Açık Adres (Mahalle, Cadde, No, Daire) *</label>
                  <textarea
                    required
                    rows={2}
                    value={address.addressDetail}
                    onChange={(e) => setAddress({ ...address, addressDetail: e.target.value })}
                    placeholder="Fenerbahçe Mah. Bağdat Cad. No: 42 Daire: 8"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Order Summary Mini Box */}
              <div className="bg-zinc-50/80 rounded-xl p-4 border border-zinc-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500">{items.length} Ürün Toplamı:</span>
                  <div className="text-sm sm:text-base font-bold text-zinc-950">{formatPrice(total)}</div>
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#121212] hover:bg-zinc-800 text-white font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Ödeme Adımına Geç</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT (yalnızca Lemon Squeezy üzerinden gerçek ödeme) */}
          {step === 'payment' && (
            <div className="space-y-4">
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-zinc-900 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-xs sm:text-sm">Lemon Squeezy Güvenli Ödeme</span>
                    </div>
                    <span className="text-[11px] bg-emerald-950/80 text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-800">
                      256-Bit SSL
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Kredi Kartı, Banka Kartı, Apple Pay veya Google Pay ile 3D Secure güvenliğinde anında ödeme yapın. Ödeme sonrasında dijital ürün kodlarınız hemen teslim edilir.
                  </p>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Sepet Tutarı:</span>
                    <span className="text-base font-black text-white">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('address')}
                    className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Adrese Dön</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLemonSqueezyCheckout}
                    disabled={isLemonLoading}
                    className="py-3 px-5 bg-[#121212] hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLemonLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>Ödeme Sayfası Hazırlanıyor...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>Lemon Squeezy ile Güvenli Öde ({formatPrice(total)})</span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
