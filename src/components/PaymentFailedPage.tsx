import React from 'react';
import { AlertTriangle, RefreshCw, ShoppingBag, MessageCircle, HelpCircle } from 'lucide-react';

interface PaymentFailedPageProps {
  onGoHome: () => void;
  whatsappNumber: string;
}

export const PaymentFailedPage: React.FC<PaymentFailedPageProps> = ({
  onGoHome,
  whatsappNumber,
}) => {
  const handleWhatsAppContact = () => {
    const text = 'Merhaba DeparStore, Lemon Squeezy ile ödeme yaparken bir sorun yaşadım. Yardımcı olabilir misiniz?';
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header Visual Banner */}
        <div className="bg-linear-to-br from-rose-500 via-rose-600 to-rose-700 p-8 text-white text-center relative overflow-hidden">
          <div className="w-18 h-18 bg-white text-rose-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 ring-8 ring-white/20">
            <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">
            Ödeme Tamamlanamadı
          </h1>
          <p className="text-rose-100 text-xs sm:text-sm mt-1">
            İşlem iptal edilmiş veya bankanız tarafından reddedilmiş olabilir.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs text-zinc-600 space-y-2">
            <div className="font-bold text-zinc-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-zinc-400" />
              Neler Yapabilirsiniz?
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-500">
              <li>Kart bilgilerinizi ve internet alışveriş limitinizi kontrol edin.</li>
              <li>Farklı bir banka/kredi kartı ile tekrar deneyin.</li>
              <li>7/24 WhatsApp canlı destek hattımızla iletişime geçin.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={onGoHome}
              className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tekrar Dene / Kataloğa Dön</span>
            </button>

            <button
              onClick={handleWhatsAppContact}
              className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm rounded-2xl border border-emerald-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              <span>WhatsApp Destek ile İletişime Geç</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
