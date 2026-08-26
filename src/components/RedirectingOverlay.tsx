import React from 'react';
import { Loader2, Zap } from 'lucide-react';

interface RedirectingOverlayProps {
  show: boolean;
}

/**
 * Full-screen "yönlendiriliyorsunuz" overlay shown while we wait for
 * Lemon Squeezy to return the one-time checkout URL. Prevents the user
 * from thinking nothing happened while the /api/checkout request is in flight.
 */
export const RedirectingOverlay: React.FC<RedirectingOverlayProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 max-w-xs w-full flex flex-col items-center text-center gap-3">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <Loader2 className="w-14 h-14 text-zinc-900 animate-spin absolute" />
          <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
        </div>
        <div>
          <p className="font-bold text-zinc-900 text-sm">Güvenli Ödeme Sayfasına Yönlendiriliyorsunuz</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Lütfen bekleyin, bu işlem birkaç saniye sürebilir. Sayfayı kapatmayın.
          </p>
        </div>
      </div>
    </div>
  );
};
