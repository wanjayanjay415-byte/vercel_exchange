import { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import InvestorsBar from './InvestorsBar';
import { loginUser, registerUser } from '../lib/auth';
import VideoBackground from './VideoBackground';
import Typewriter from './Typewriter';

interface LoginProps {
  onLogin: (userId: string, username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await loginUser(username, password);
        onLogin(user.id, user.username);
      } else {
        const user = await registerUser(username, password);
        onLogin(user.id, user.username);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <VideoBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">

              {/* Brand logo above welcome text */}
              <div className="flex items-center justify-center mb-8">
                <img
                  src="/brand/brand-logo.png"
                  alt="Brand Logo"
                  className="h-36 w-auto object-contain drop-shadow-lg"
                  draggable={false}
                  style={{ maxWidth: 480 }}
                />
              </div>

              <h1 className="text-3xl font-bold text-center text-white mb-2">
                <Typewriter text={isLogin ? 'Welcome Back' : 'Create Account'} speed={70} />
              </h1>
              <p className="text-center text-slate-400 mb-8">
                {isLogin ? 'Login ke akun exchange Anda' : 'Daftar untuk memulai trading'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Masukkan username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="Masukkan password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-white"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
                </button>
              </div>

              {isLogin && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-slate-400 hover:text-emerald-400"
                  >
                    Lupa password?
                  </button>
                </div>
              )}
            </div>

            {/* InvestorsBar only on login/signup */}
            <div className="mt-8">
              <InvestorsBar />
            </div>
          </div>
        </div>
      </VideoBackground>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}
