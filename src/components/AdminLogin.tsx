import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    setTimeout(() => {
      if ((cleanUsername === 'ercan' || cleanUsername === 'ercanulger') && cleanPassword === '7207') {
        sessionStorage.setItem('deparstore_admin_auth', 'true');
        localStorage.setItem('deparstore_admin_auth', 'true');
        onLoginSuccess();
      } else {
        setErrorMsg('Geçersiz kullanıcı adı veya şifre girdiniz.');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-zinc-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full bg-[#18181B] border border-zinc-800 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Subtle top glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-zinc-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto shadow-inner text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            DeparStore Yönetim Girişi
          </h1>
          <p className="text-xs text-zinc-400 font-normal">
            Yönetim paneline erişmek için yetkili bilgilerinizi giriniz.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 bg-red-950/50 border border-red-800/80 text-red-200 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 block">Kullanıcı Adı</label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı girin"
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
              />
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 block">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full pl-9 pr-10 py-2.5 bg-zinc-900/90 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition font-mono"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Doğrulanıyor...</span>
            ) : (
              <>
                <span>Yönetici Paneline Giriş Yap</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to store */}
        <div className="pt-2 border-t border-zinc-800 text-center">
          <button
            onClick={onBackToStore}
            className="text-xs text-zinc-400 hover:text-zinc-200 font-medium transition cursor-pointer"
          >
            ← Mağaza Vitrinine Dön
          </button>
        </div>

      </div>
    </div>
  );
};
