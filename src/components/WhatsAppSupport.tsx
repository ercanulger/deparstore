import React, { useState } from 'react';
import { MessageCircle, X, Send, Check, ShieldCheck, Sparkles, ExternalLink, QrCode, PhoneCall } from 'lucide-react';
import { Product } from '../types';

interface WhatsAppSupportProps {
  whatsappNumber?: string;
  selectedProduct?: Product | null;
}

export const WhatsAppSupport: React.FC<WhatsAppSupportProps> = ({
  whatsappNumber = '905010000000',
  selectedProduct,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'qr'>('chat');

  const defaultPhone = whatsappNumber || '905010000000';

  const quickTopics = [
    'Apple P12 Sertifika Kurulumu',
    'VIP iOS Oyun Hileleri & Ban Koruması',
    'IPTV 4K Donmasız Test Yayını',
    'Netflix / Spotify Premium Teslimatı',
    'Lemon Squeezy Ödeme & Sipariş Sorgulama',
  ];

  const handleStartChat = (messageText?: string) => {
    const textToSend =
      messageText ||
      customMessage ||
      (selectedProduct
        ? `Merhaba DeparStore, "${selectedProduct.title}" (${selectedProduct.salePrice || selectedProduct.price} ₺) hakkında bilgi almak ve sipariş vermek istiyorum.`
        : 'Merhaba DeparStore, dijital ürünleriniz ve siparişim hakkında bilgi almak istiyorum.');

    const cleanPhone = defaultPhone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(`+${defaultPhone.replace(/\D/g, '')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="WhatsApp Canlı Destek"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 fill-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-[#25D366] animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-[#25D366]" />
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline-block">
            WhatsApp Destek
          </span>
          <span className="sm:hidden text-xs font-bold">Destek</span>
        </button>
      )}

      {/* WhatsApp Chat & QR Window Card */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
          {/* Header */}
          <div className="bg-[#128C7E] text-white p-4 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <MessageCircle className="w-6 h-6 fill-white text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    DeparStore Destek
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                  </h3>
                  <p className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Çevrimiçi &bull; Ortalama 2-3 Dk Yanıt
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab switchers: Sohbet & QR Kod */}
            <div className="flex bg-black/15 p-0.5 rounded-lg mt-3 text-xs font-medium">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1 text-center rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'chat' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-emerald-100 hover:text-white'
                }`}
              >
                <Send className="w-3 h-3" />
                Hızlı Sohbet
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-1 text-center rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'qr' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-emerald-100 hover:text-white'
                }`}
              >
                <QrCode className="w-3 h-3" />
                QR Kod ile Ekle
              </button>
            </div>
          </div>

          {/* Body Content */}
          {activeTab === 'chat' ? (
            <div className="p-4 space-y-3.5 bg-zinc-50 max-h-[380px] overflow-y-auto">
              {/* Agent Greeting Bubble */}
              <div className="bg-white p-3 rounded-xl rounded-tl-none border border-zinc-200/80 shadow-xs text-xs text-zinc-700 space-y-1">
                <div className="font-bold text-zinc-900 text-[11px] flex items-center gap-1">
                  DeparStore Dijital Asistanı
                </div>
                <p className="leading-relaxed">
                  Merhaba! iOS P12 Sertifikaları, VIP Oyun Hileleri, IPTV ve Premium Hesap siparişleriniz için 7/24 anında destek veriyoruz.
                </p>
                <div className="text-[9px] text-zinc-400 text-right">Şimdi</div>
              </div>

              {/* Quick Inquiry Options */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Sık Sorulan Konular
                </span>
                <div className="flex flex-col gap-1.5">
                  {quickTopics.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => handleStartChat(`Merhaba, ${topic} hakkında detaylı bilgi ve anında satın alma için yazıyorum.`)}
                      className="text-left text-xs bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-zinc-200 p-2 rounded-lg text-zinc-800 transition cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate">{topic}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom message input */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-200">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Mesajınızı veya sorunuzu yazın..."
                    className="flex-1 text-xs bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:outline-none focus:border-[#25D366]"
                    onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
                  />
                  <button
                    onClick={() => handleStartChat()}
                    className="p-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl transition cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
                    title="WhatsApp'ta Aç"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* QR Kod Ekranı (Kullanıcının yüklediği görsel stili ve QR okutma ekranı) */
            <div className="p-5 bg-emerald-50/50 flex flex-col items-center text-center space-y-3">
              <div className="bg-white p-3.5 rounded-2xl shadow-md border border-zinc-200 flex flex-col items-center">
                <div className="text-center pb-2 border-b border-zinc-100 w-full">
                  <div className="text-xs font-bold text-zinc-900">DeparStore WhatsApp</div>
                  <div className="text-[10px] text-zinc-400">Doğrudan İletişim Hattı</div>
                </div>
                
                {/* Visual WhatsApp QR Display */}
                <div className="my-3 p-2 bg-white rounded-xl border border-zinc-200 flex flex-col items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://wa.me/${defaultPhone.replace(/\D/g, '')}`)}`}
                    alt="WhatsApp QR Kodu"
                    className="w-36 h-36 object-contain"
                  />
                  <span className="text-[10px] text-zinc-500 font-medium mt-1">
                    WhatsApp kamerasıyla okutun
                  </span>
                </div>

                <button
                  onClick={handleCopyPhone}
                  className="w-full py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <PhoneCall className="w-3.5 h-3.5 text-zinc-600" />}
                  <span>{copied ? 'Numara Kopyalandı!' : `+${defaultPhone}`}</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-500 max-w-[260px] leading-tight">
                Telefonunuzun WhatsApp uygulamasından Bağlı Cihazlar &gt; Cihaz Bağla veya kamera ile okutarak doğrudan yazabilirsiniz.
              </p>
            </div>
          )}

          {/* Footer Action */}
          <div className="p-3 bg-white border-t border-zinc-200">
            <button
              onClick={() => handleStartChat()}
              className="w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp Sohbeti Başlat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
