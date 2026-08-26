import React, { useEffect, useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  Zap,
  Package,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

interface OrderStatusModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  whatsappNumber?: string;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  order: initialOrder,
  onClose,
  whatsappNumber = '905010000000',
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);
  const [copiedCode, setCopiedCode] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Sync with prop
  useEffect(() => {
    if (initialOrder) {
      setCurrentOrder(initialOrder);
    }
  }, [initialOrder]);

  // Real-time Firestore subscription for the active order
  useEffect(() => {
    if (!initialOrder?.id) return;

    const unsub = onSnapshot(
      doc(db, 'orders', initialOrder.id),
      (docSnap) => {
        if (docSnap.exists()) {
          const updated = docSnap.data() as Order;
          setCurrentOrder(updated);

          // If status transitions to 'Başarılı' or 'Teslim Edildi', trigger confetti once
          if (
            (updated.status === 'Başarılı' || updated.status === 'Teslim Edildi') &&
            !hasCelebrated
          ) {
            setHasCelebrated(true);
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10B981', '#059669', '#34D399', '#FBBF24'],
              });
            } catch (_) {}
          }
        }
      },
      (err) => {
        console.warn('Order subscription error:', err);
      }
    );

    return () => unsub();
  }, [initialOrder?.id, hasCelebrated]);

  if (!isOpen || !currentOrder) return null;

  const status = currentOrder.status;

  const isPending =
    status === 'İnceleniyor' ||
    status === 'Sipariş Alındı' ||
    status === 'Hazırlanıyor';
  const isSuccess = status === 'Başarılı' || status === 'Teslim Edildi';
  const isFailed = status === 'Başarısız' || status === 'İptal Edildi';

  const handleCopyCode = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppContact = () => {
    const text = `Merhaba DeparStore, ${currentOrder.orderNumber} numaralı siparişim hakkında bilgi almak istiyorum. Durum: ${currentOrder.status}`;
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden relative animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#121212] text-white flex items-center justify-center font-bold text-xs">
              D
            </div>
            <div>
              <h2 className="font-bold text-xs sm:text-sm text-zinc-900 flex items-center gap-1.5">
                <span>Sipariş Durum Takibi</span>
                <span className="text-[10px] font-mono text-zinc-500 font-normal">
                  ({currentOrder.orderNumber})
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                {formatDate(currentOrder.createdAt)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* 1. STATUS BANNER */}
          {isPending && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-6 h-6 animate-spin text-amber-600" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[11px] font-bold tracking-wide uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Sipariş İnceleniyor
                </div>
                <h3 className="text-base font-bold text-amber-950">
                  Ödemeniz & Siparişiniz Kontrol Ediliyor
                </h3>
                <p className="text-xs text-amber-800/90 mt-1 max-w-sm mx-auto leading-relaxed">
                  Sipariş talebiniz alındı. Yetkili onayından sonra durum anında güncellenecektir. Bu ekranı kapatabilir veya bekleyebilirsiniz.
                </p>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[11px] font-bold tracking-wide uppercase mb-1">
                  <Check className="w-3 h-3" />
                  Sipariş Onaylandı & Başarılı
                </div>
                <h3 className="text-base font-bold text-emerald-950">
                  Siparişiniz Başarıyla Tamamlandı! 🎉
                </h3>
                <p className="text-xs text-emerald-800/90 mt-1 max-w-sm mx-auto leading-relaxed">
                  Ödemeniz onaylandı. Dijital ürün lisansınız veya teslimat bilgileri aşağıda yer almaktadır.
                </p>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-200/80 text-red-900 text-[11px] font-bold tracking-wide uppercase mb-1">
                  İptal Edildi / Başarısız
                </div>
                <h3 className="text-base font-bold text-red-950">
                  Sipariş Onaylanamadı
                </h3>
                <p className="text-xs text-red-800/90 mt-1 max-w-sm mx-auto leading-relaxed">
                  Ödeme doğrulanamadı veya sipariş iptal edildi. Bilgi veya destek için 7/24 WhatsApp destek hattımıza ulaşabilirsiniz.
                </p>
              </div>
            </div>
          )}

          {/* 2. DIGITAL LICENSE / ADMIN NOTE IF PROVIDED */}
          {currentOrder.digitalCode && (
            <div className="bg-zinc-900 text-white rounded-xl p-3.5 border border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  Dijital Lisans / Kurulum Kodu
                </span>
                <button
                  onClick={() => handleCopyCode(currentOrder.digitalCode!)}
                  className="flex items-center gap-1 text-zinc-300 hover:text-white cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2.5 bg-black/50 rounded-lg font-mono text-xs text-emerald-300 font-bold break-all select-all">
                {currentOrder.digitalCode}
              </div>
            </div>
          )}

          {currentOrder.adminNote && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs space-y-1 text-zinc-700">
              <span className="font-bold text-zinc-900 block">Yönetici Notu & Bilgilendirme:</span>
              <p className="text-zinc-600 leading-relaxed">{currentOrder.adminNote}</p>
            </div>
          )}

          {/* 3. ORDER ITEMS SUMMARY */}
          <div className="space-y-2 border border-zinc-200/80 rounded-xl p-3.5 bg-zinc-50/50">
            <h4 className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-zinc-500" />
              Sipariş Edilen Ürünler
            </h4>

            <div className="divide-y divide-zinc-200/60">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-lg object-cover bg-zinc-900 shrink-0 border border-zinc-200"
                      />
                    )}
                    <div className="truncate">
                      <div className="font-semibold text-zinc-900 truncate">{item.title}</div>
                      <div className="text-[10px] text-zinc-400">{item.quantity} Adet</div>
                    </div>
                  </div>
                  <div className="font-bold text-zinc-900 shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-200 flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-700">Toplam Tutar:</span>
              <span className="font-black text-sm text-zinc-950">
                {formatPrice(currentOrder.total)}
              </span>
            </div>
          </div>

          {/* 4. CUSTOMER INFO SUMMARY */}
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 text-xs space-y-1 text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-400">Müşteri:</span>
              <span className="font-medium text-zinc-900">{currentOrder.shippingAddress?.fullName || 'Belirtilmedi'}</span>
            </div>
            {currentOrder.shippingAddress?.email && (
              <div className="flex justify-between">
                <span className="text-zinc-400">E-posta:</span>
                <span className="font-medium text-zinc-900">{currentOrder.shippingAddress.email}</span>
              </div>
            )}
            {currentOrder.shippingAddress?.phone && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Telefon:</span>
                <span className="font-medium text-zinc-900">{currentOrder.shippingAddress.phone}</span>
              </div>
            )}
          </div>

          {/* 5. ACTION BUTTONS */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleWhatsAppContact}
              className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp ile Hızlı İletişime Geç & Bilgi Al</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Mağazaya Dön / Kapat
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
