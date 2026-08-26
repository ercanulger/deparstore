import React, { useState } from 'react';
import {
  ShoppingBag,
  User,
  Search,
  LogOut,
  Package,
  Sparkles,
  Menu,
  X,
  Zap,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Order } from '../types';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenOrders: () => void;
  onSelectCategory: (catId: string) => void;
  currentCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activePendingOrder?: Order | null;
  onOpenOrderStatus?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenOrders,
  onSelectCategory,
  currentCategory,
  searchQuery,
  onSearchChange,
  activePendingOrder,
  onOpenOrderStatus,
}) => {
  const { userProfile, signOut } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FDFDFD]/95 backdrop-blur-md border-b border-zinc-200/80">
      {/* Top Notification Bar */}
      <div className="bg-[#121212] text-zinc-300 text-xs py-2 px-4 text-center flex items-center justify-between tracking-wide">
        <div className="hidden sm:flex items-center gap-2 text-zinc-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-300">DeparStore VIP Lisans & Hesap</span>
        </div>
        <div className="flex-1 text-center font-medium text-xs text-zinc-200">
          ⚡ Anında Otomatik & WhatsApp Teslimatı &bull; <span className="text-white font-bold tracking-wider">Lemon Squeezy</span> Güvenli Ödeme
        </div>
        <div className="hidden md:flex items-center gap-2 text-zinc-400 text-[11px]">
          <span>7/24 Canlı Destek</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectCategory('all')}
              className="flex items-center gap-3 group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#121212] text-white flex items-center justify-center font-bold text-lg tracking-tighter shadow-xs group-hover:bg-zinc-800 transition-colors">
                D
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-[#121212] flex items-center gap-1">
                  DEPAR<span className="text-zinc-500 font-light">STORE</span>
                </span>
                <span className="block text-[9px] tracking-widest uppercase font-semibold text-zinc-400">
                  VIP Dijital Ürünler
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="P12 Sertifika, VIP Hile, IPTV, Premium Hesap ara..."
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition shadow-xs"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-700 font-semibold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Active Pending Order Button (if any) */}
            {activePendingOrder && onOpenOrderStatus && (
              <button
                onClick={onOpenOrderStatus}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition animate-pulse cursor-pointer border border-amber-600"
                title="İncelenen siparişinizi görüntüleyin"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Siparişiniz İnceleniyor</span>
                <span className="sm:hidden">İnceleniyor</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 sm:px-4 sm:py-2.5 bg-[#121212] hover:bg-zinc-800 text-white rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
              aria-label="Alışveriş Sepeti"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-300" />
              <span className="hidden sm:inline text-xs font-semibold">Sepet</span>
              {itemCount > 0 && (
                <span className="min-w-4 h-4 px-1 bg-white text-zinc-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            <div className="relative">
              {userProfile ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 bg-white hover:bg-zinc-50 rounded-xl transition border border-zinc-200 cursor-pointer shadow-xs"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#121212] text-white flex items-center justify-center font-bold text-xs uppercase">
                      {userProfile.displayName.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left text-xs">
                      <div className="font-semibold text-zinc-900 truncate max-w-[110px]">
                        {userProfile.displayName}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Müşteri Hesabı
                      </div>
                    </div>
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-50 text-xs text-zinc-700 animate-in fade-in duration-100">
                      <div className="px-4 py-2 border-b border-zinc-100">
                        <p className="font-bold text-zinc-900">{userProfile.displayName}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{userProfile.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          onOpenOrders();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Package className="w-4 h-4 text-zinc-400" />
                        Siparişlerim & Lisanslarım
                      </button>

                      <div className="border-t border-zinc-100 my-1"></div>

                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-semibold rounded-xl transition border border-zinc-200 cursor-pointer shadow-xs"
                >
                  <User className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Giriş Yap</span>
                </button>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-zinc-200 space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="P12 Sertifika, VIP Hile, IPTV, Premium Hesap ara..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
