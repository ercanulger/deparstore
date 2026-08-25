import React from 'react';
import { Sparkles, Shield, Zap, RefreshCw, Tag, CheckCircle2 } from 'lucide-react';
import { Category } from '../types';

interface HeroBannerProps {
  categories: Category[];
  currentCategory: string;
  onSelectCategory: (id: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  categories,
  currentCategory,
  onSelectCategory,
}) => {
  return (
    <div className="relative overflow-hidden bg-[#121212] text-white rounded-2xl my-6 border border-zinc-800/80 shadow-xs">
      <div className="relative px-6 py-12 sm:px-12 sm:py-16 max-w-4xl mx-auto text-center space-y-6">
        
        {/* Top Minimalist Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/60 text-[11px] font-semibold text-zinc-300">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="tracking-widest uppercase text-[10px]">VIP Apple P12 & Dijital Lisans Mağazası</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Apple P12, VIP iOS Hileleri <br className="hidden sm:block" />
          <span className="text-zinc-400 font-light">
            & Premium Dijital Hesaplar
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          iPhone cihazlarınız için sınırsız IPA yükleme sertifikaları, ban korumalı VIP oyun modları, donmasız 4K IPTV ve en popüler premium hesaplar anında teslimat ve Lemon Squeezy güvencesiyle DeparStore'da.
        </p>

        {/* Quick Category Chips */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-zinc-950 shadow-xs font-bold'
                    : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                }`}
              >
                <span>{cat.name}</span>
                {cat.slug === 'all' && <Tag className="w-3 h-3 text-zinc-400" />}
              </button>
            );
          })}
        </div>

        {/* Value Propositions */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-zinc-800/80 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0 border border-zinc-700/50">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Anında Teslimat</div>
              <div className="text-[10px] text-zinc-400">Otomatik & WhatsApp</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0 border border-zinc-700/50">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">1 Yıl Garanti</div>
              <div className="text-[10px] text-zinc-400">Anti-Revoke koruması</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0 border border-zinc-700/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Lemon Squeezy</div>
              <div className="text-[10px] text-zinc-400">Güvenli 3D ödeme</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0 border border-zinc-700/50">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">7/24 Destek</div>
              <div className="text-[10px] text-zinc-400">WhatsApp canlı yardım</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
