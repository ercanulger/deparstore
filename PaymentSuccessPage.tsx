import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Zap,
  Clock,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

interface PaymentSuccessPageProps {
  orderId?: string;
  orders: Order[];
  onGoHome: () => void;
  whatsappNumber: string;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  orderId,
  orders,
  onGoHome,
  whatsappNumber,
}) => {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const matchedOrder = orders.find(
    (o) => o.id === orderId || o.orderNumber === orderId
  );

  useEffect(() => {
    // Launch celebratory confetti effect
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899'],
      });
    } catch (e) {
      console.warn('Confetti effect note:', e);
    }
  }, []);

  // Automatically return to the homepage a short while after payment
  // completes, so the customer isn't left stranded on this page.
  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const redirectTimer = setTimeout(() => {
      onGoHome();
    }, 15000);

    return () => {
      clearInterval(countdown);
      clearTimeout(redirectTimer);
    };
  }, [onGoHome]);

  // This page only loads after Lemon Squeezy redirects back following a
  // real, successful payment - so there's nothing left to "review". Mark
  // the order as completed automatically instead of waiting on manual
  // admin approval.
  useEffect(() => {
    if (!matchedOrder) return;
    if (matchedOrder.status === 'Başarılı' || matchedOrder.status === 'Teslim Edildi') return;

    updateDoc(doc(db, 'orders', matchedOrder.id), {
      status: 'Başarılı',
      updatedAt: new Date().toISOString(),
    }).catch((err) => {
      console.warn('Order auto-confirm warning:', err);
    });
  }, [matchedOrder]);

  const handleCopyOrderNumber = () => {
    const text = matchedOrder?.orderNumber || orderId || 'DEP-ORDER';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppContact = () => {
    const orderNo = matchedOrder?.orderNumber || orderId || 'Bilinmiyor';
    const text = `Merhaba DeparStore, #${orderNo} numaralı siparişim için ödememi Lemon Squeezy üzerinden başarıyla gerçekleştirdim. Bilgi almak istiyorum.`;
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-emerald-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header Visual Banner */}
        <div className="bg-linear-to-br from-emerald-500 via-teal-600 to-emerald-700 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="w-18 h-18 bg-white text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 ring-8 ring-white/20">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Ödeme Başarıyla Alındı</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Siparişiniz Alındı & Hazırlanıyor!
          </h1>
          <p className="text-emerald-100 text-sm mt-1">
            Lemon Squeezy üzerinden güvenli ödemeniz onaylandı.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Order Reference Box */}
          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-zinc-500 block">Sipariş / Takip No</span>
              <span className="text-base sm:text-lg font-black text-zinc-900 tracking-wider font-mono">
                {matchedOrder?.orderNumber || orderId || 'ORD-2026-ONAYLANDI'}
              </span>
            </div>
            <button
              onClick={handleCopyOrderNumber}
              className="px-3 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-500" />
                  <span>Kopyala</span>
                </>
              )}
            </button>
          </div>

          {/* Order Details (if matched) */}
          {matchedOrder && matchedOrder.items && matchedOrder.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Satın Alınan Dijital Ürünler
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {matchedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-zinc-50/70 rounded-xl border border-zinc-100 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover bg-zinc-200"
                      />
                      <div>
                        <div className="font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                        <div className="text-xs text-zinc-500">Adet: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-600">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-sm font-bold">
                <span className="text-zinc-600">Toplam Tutar</span>
                <span className="text-lg text-zinc-900">{formatPrice(matchedOrder.total)}</span>
              </div>
            </div>
          )}

          {/* Digital Key Delivery Notification Box */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
              <Zap className="w-5 h-5 fill-amber-600 text-amber-600" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-amber-950">Teslimat & Aktivasyon Bilgisi</h4>
              <p className="text-amber-900/90 leading-relaxed">
                Dijital lisans anahtarınız / hesap bilgileriniz otomatik olarak hazırlanmaktadır. Siparişiniz dakikalar içinde aktif edilip teslim edilecektir.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleWhatsAppContact}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp'tan Bildir</span>
            </button>

            <button
              onClick={onGoHome}
              className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Kataloğa Dön</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Lemon Squeezy 256-Bit SSL Güvenli Altyapısı</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              {secondsLeft > 0
                ? `${secondsLeft} saniye içinde ana sayfaya yönlendirileceksiniz...`
                : 'Yönlendiriliyorsunuz...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
