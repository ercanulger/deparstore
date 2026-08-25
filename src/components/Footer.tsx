import React from 'react';
import { ShieldCheck, Zap, Lock, Headphones, CheckCircle } from 'lucide-react';
import { Category } from '../types';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ categories, onSelectCategory }) => {
  return (
    <footer className="bg-white text-zinc-600 border-t border-zinc-200/80 mt-16">
      
      {/* Top Features Ribbon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-zinc-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-200/80 shrink-0">
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-zinc-900">Anında Dijital Teslimat</h4>
              <p className="text-[11px] text-zinc-400">Otomatik & WhatsApp ile anında kod</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-200/80 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-zinc-900">1 Yıl Garanti & Değişim</h4>
              <p className="text-[11px] text-zinc-400">Apple P12 ve Lisans güvencesi</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-200/80 shrink-0">
              <Lock className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-zinc-900">Lemon Squeezy Güvenli Ödeme</h4>
              <p className="text-[11px] text-zinc-400">256-Bit SSL ve 3D Secure koruma</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-200/80 shrink-0">
              <Headphones className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-zinc-900">7/24 WhatsApp Desteği</h4>
              <p className="text-[11px] text-zinc-400">Kurulum ve teknik yardım</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#121212] text-white flex items-center justify-center font-bold text-xs">
                D
              </div>
              <span className="text-base font-bold tracking-tight text-zinc-900">
                DEPAR<span className="text-zinc-500 font-normal">STORE</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-normal">
              Apple P12 Geliştirici Sertifikaları, VIP iOS Oyun Hileleri, Tweaked IPA mağazası, 4K IPTV ve premium dijital hesaplar için güvenilir tek adresiniz.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Anında Teslimat & 7/24 Kesintisiz Hizmet</span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h5 className="font-semibold text-xs uppercase tracking-wider text-zinc-900">Popüler Kategoriler</h5>
            <ul className="space-y-2 text-xs text-zinc-500">
              {categories.slice(1, 6).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onSelectCategory(c.slug)}
                    className="hover:text-zinc-900 transition cursor-pointer text-left"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links & Policies */}
          <div className="space-y-3">
            <h5 className="font-semibold text-xs uppercase tracking-wider text-zinc-900">Müşteri Rehberi</h5>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li>P12 & IPA Kurulum Rehberi</li>
              <li>Lemon Squeezy ile Güvenli Ödeme Nasıl Yapılır?</li>
              <li>Garanti ve Anti-Revoke Koşulları</li>
              <li>WhatsApp Destek Hattı</li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            © {new Date().getFullYear()} DeparStore. Tüm hakları saklıdır.
          </div>
          <div className="flex items-center gap-2">
            <span>VIP Dijital Ürün & Lisans Platformu</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
