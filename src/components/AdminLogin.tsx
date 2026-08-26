import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

const MASTER_ADMIN_EMAIL = 'retrokronik@gmail.com';

// NOT: Yönetici girişi artık gerçek Firebase Authentication üzerinden
// doğrulanıyor. Daha önce burada sabit kodlanmış bir kullanıcı adı/şifre
// kontrolü vardı (örn. "ercan" / "7207") ve bu, sadece tarayıcıda bir
// localStorage bayrağı set ediyordu - Firestore güvenlik kurallarıyla hiçbir
// bağlantısı yoktu. Kurallar sıkılaştırıldığında (bkz. firestore.rules,
// isAdmin() artık gerçek request.auth bekliyor) o eski sahte giriş ekrana
// girmeye devam etse bile hiçbir ürün/sipariş yazma işlemi çalışmazdı.
// Bu yüzden panele girebilmek için artık Firebase'de gerçek bir hesabın
// (retrokronik@gmail.com ya da Firestore'da users/{uid}.role == 'admin'
// olan bir hesabın) e-posta + şifresiyle giriş yapılması gerekiyor.
export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);

      const isMaster = cred.user.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
      let isAdminUser = isMaster;

      if (!isAdminUser) {
        const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
        isAdminUser = userSnap.exists() && userSnap.data()?.role === 'admin';
      }

      if (!isAdminUser) {
        // Firebase'e giriş başarılı ama bu hesabın admin yetkisi yok -
        // oturumu kapat, müşteri hesabıyla panele girilmiş olmasın.
        await fbSignOut(auth);
        setErrorMsg('Bu hesabın yönetici paneline erişim yetkisi bulunmuyor.');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('deparstore_admin_auth', 'true');
      localStorage.setItem('deparstore_admin_auth', 'true');
      onLoginSuccess();
    } catch (err: any) {
      console.warn('Admin login error:', err);
      setErrorMsg('Geçersiz e-posta veya şifre girdiniz.');
    } finally {
      setLoading(false);
    }
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
            Yönetim paneline erişmek için yetkili Firebase hesabınızla giriş yapın.
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
            <label className="font-semibold text-zinc-300 block">E-posta</label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@eposta.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
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
                placeholder="••••••••"
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
