import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Zap,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Order, OrderAddress, PaymentDetails } from '../types';
import { formatPrice, generateOrderNumber } from '../lib/utils';
import { createLemonCheckout, redirectToLemonCheckout, getSuccessRedirectUrl } from '../lib/lemonSqueezy';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
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

  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [submitting, setSubmitting] = useState(false);
  const [isLemonLoading, setIsLemonLoading] = useState(false);
  const [paymentMethodTab, setPaymentMethodTab] = useState<'lemon' | 'card'>('lemon');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

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

  // Payment Form State
  const [cardHolder, setCardHolder] = useState(userProfile?.displayName || 'AHMET YILMAZ');
  const [cardNumber, setCardNumber] = useState('4543 2198 7654 3210');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('342');
  const [use3DSecure, setUse3DSecure] = useState(true);

  if (!isOpen) return null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setExpiry(val);
  };

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

    try {
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);
      localStorage.setItem('deparstore_active_order_id', newOrder.id);
    } catch (err) {
      console.warn('Firestore write warning for orders:', err);
    }

    const itemsSummary = items.map((i) => `${i.product.title} (x${i.quantity})`).join(', ');

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
    } else {
      setCheckoutError(res.error || 'Lemon Squeezy ödeme bağlantısı oluşturulamadı.');
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);

    const orderNumber = generateOrderNumber();
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      userId: user?.uid || userProfile?.uid || 'guest_user',
      userEmail: address.email,
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
        cardHolder,
        cardNumberLast4: cardNumber.replace(/\s/g, '').slice(-4) || '3210',
        method: 'credit_card',
        paidAt: new Date().toISOString(),
      },
      status: 'İnceleniyor',
      createdAt: new Date().toISOString(),
    };

    try {
      // Save directly to Firebase Firestore `orders` collection
      const orderRef = doc(db, 'orders', newOrder.id);
      await setDoc(orderRef, newOrder);
      localStorage.setItem('deparstore_active_order_id', newOrder.id);
    } catch (err) {
      console.warn('Firestore write warning for orders:', err);
      localStorage.setItem('deparstore_active_order_id', newOrder.id);
    }

    // Save locally or in state for immediate UI feedback
    setCompletedOrder(newOrder);
    clearCart();
    setStep('success');
    setSubmitting(false);

    // Fire celebration confetti!
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // ignore
    }

    onOrderSuccess(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      
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
                {step === 'payment' && 'Adım 2/2: Kart ve Ödeme Onayı'}
                {step === 'success' && 'Siparişiniz Başarıyla Alındı!'}
              </p>
            </div>
          </div>

          {step !== 'success' && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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

          {/* STEP 2: PAYMENT */}
          {step === 'payment' && (
            <div className="space-y-4">
              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('lemon')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethodTab === 'lemon'
                      ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Lemon Squeezy (Önerilen)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('card')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethodTab === 'card'
                      ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Manuel Kart Girişi</span>
                </button>
              </div>

              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Lemon Squeezy Direct Mode */}
              {paymentMethodTab === 'lemon' && (
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
              )}

              {/* Manual Card Mode */}
              {paymentMethodTab === 'card' && (
                <form onSubmit={handleCompleteOrder} className="space-y-4">
                  {/* Virtual Credit Card Mockup */}
                  <div className="p-5 rounded-xl bg-[#121212] text-white shadow-md space-y-4 border border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold tracking-widest text-zinc-400">DEPAR PAY</span>
                      <CreditCard className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div className="text-base sm:text-lg font-mono tracking-widest font-bold">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end text-xs">
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase">Kart Sahibi</div>
                        <div className="font-semibold uppercase tracking-wider">{cardHolder || 'AD SOYAD'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase">Son Kullanma</div>
                        <div className="font-semibold font-mono">{expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-zinc-800">Kart Üzerindeki İsim *</label>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="AHMET YILMAZ"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl uppercase font-semibold text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-zinc-800">Kart Numarası *</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4543 2198 7654 3210"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-800">Son Kullanma Tarihi (AA/YY) *</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={expiry}
                        onChange={handleExpiryChange}
                        placeholder="12/28"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-800">Güvenlik Kodu (CVV) *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="342"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={use3DSecure}
                      onChange={(e) => setUse3DSecure(e.target.checked)}
                      className="rounded text-zinc-900 focus:ring-zinc-900 w-4 h-4"
                    />
                    <span className="font-medium">3D Secure ile Güvenli Doğrulama Yap</span>
                  </label>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setStep('address')}
                      className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Adres Bilgilerine Dön</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="py-2.5 px-5 bg-[#121212] hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {submitting ? 'Sipariş Kaydediliyor...' : `Siparişi Tamamla (${formatPrice(total)})`}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && completedOrder && (
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto border border-zinc-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  Siparişiniz Başarıyla Alındı
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Teşekkür ederiz. Siparişiniz güvenle onaylandı ve kargo hazırlıklarına başlandı.
                </p>
              </div>

              {/* Order Info Card */}
              <div className="bg-zinc-50/80 rounded-xl p-4 border border-zinc-200/80 text-left text-xs space-y-2.5 max-w-lg mx-auto">
                <div className="flex justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Sipariş Numarası:</span>
                  <span className="font-mono font-bold text-zinc-900">{completedOrder.orderNumber}</span>
                </div>

                <div className="flex justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Teslim Edilecek Kişi:</span>
                  <span className="font-semibold text-zinc-900">{completedOrder.shippingAddress.fullName}</span>
                </div>

                <div className="flex justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Teslimat Adresi:</span>
                  <span className="font-medium text-zinc-900 text-right max-w-xs truncate">
                    {completedOrder.shippingAddress.addressDetail}, {completedOrder.shippingAddress.district}/{completedOrder.shippingAddress.city}
                  </span>
                </div>

                <div className="flex justify-between pt-1 font-semibold text-xs">
                  <span className="text-zinc-900">Ödenen Tutar:</span>
                  <span className="text-zinc-950 font-bold text-sm">{formatPrice(completedOrder.total)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#121212] hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
                >
                  Alışverişe Devam Et
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
