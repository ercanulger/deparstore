import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(
    initialMode === 'register' ? 'register' : 'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName || 'Kullanıcı', 'customer');
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Geçersiz e-posta veya şifre.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Şifreniz en az 6 karakter olmalıdır.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Lütfen geçerli bir e-posta adresi girin.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-zinc-200/80 overflow-hidden relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 text-center bg-zinc-50/80 border-b border-zinc-200/80 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#121212] text-white flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-4 h-4 text-zinc-200" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">
            {tab === 'login' ? 'Müşteri Girişi' : 'Yeni Müşteri Kaydı'}
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Satın aldığınız lisans ve siparişleri görüntülemek için giriş yapın.
          </p>

          {/* Tab Selector */}
          <div className="flex bg-zinc-200/70 p-0.5 rounded-xl text-xs font-semibold mt-3">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                tab === 'login' ? 'bg-white text-zinc-900 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                tab === 'register' ? 'bg-white text-zinc-900 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Kayıt Ol
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-zinc-700" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            
            {tab === 'register' && (
              <div className="space-y-1">
                <label className="font-semibold text-zinc-800 block">Ad Soyad</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Adınızı ve soyadınızı girin"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-zinc-800 block">E-Posta Adresi</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-800 block">Şifre</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#121212] hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>İşlem yapılıyor...</span>
              ) : (
                <>
                  <span>{tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
