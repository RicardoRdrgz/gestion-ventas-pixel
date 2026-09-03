import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export const AuthModal: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrorMsg('Debes configurar las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env local.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('¡Cuenta registrada! Ya puedes iniciar sesión con tus credenciales.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 overflow-hidden">
        {/* Banner de la marca */}
        <div className="h-32 bg-gradient-to-br from-zinc-900 via-[#1a1a30] to-[#241f3d] relative flex flex-col items-center justify-center gap-2">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 50% -30%, rgba(66,133,244,0.4), transparent 60%), radial-gradient(ellipse at 90% 120%, rgba(155,114,203,0.35), transparent 50%)',
            }}
          />
          <div className="relative z-10">
            <svg viewBox="0 0 64 64" width="64" height="64" aria-label="Google Gemini">
              <defs>
                <linearGradient id="gem-login" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#4285F4"/>
                  <stop offset="0.33" stopColor="#9B72CB"/>
                  <stop offset="0.66" stopColor="#D96570"/>
                  <stop offset="1" stopColor="#FABB05"/>
                </linearGradient>
              </defs>
              <path fill="url(#gem-login)" d="M32 0c1.5 13.7 5.6 21.8 12.3 26.6C50.9 31.4 56.9 32.3 64 32c-13.4 1 -20.9 5.5 -24.4 13.6C36.1 53.6 33.6 59.7 32 64c-1.6-4.3-4.1-10.4-7.6-18.4C21 37.6 13.4 33 0 32c7.1-.3 13.1-0.6 19.7-5.4C26.4 21.8 30.5 13.7 32 0z"/>
            </svg>
          </div>
          <span className="relative z-10 text-lg font-bold text-white font-[Google_Sans]">Google Pixel</span>
        </div>

        <div className="p-8 pt-6">
          {/* Header with Google branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <GoogleLogo />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight font-[Google_Sans]">
              {isSignUp ? 'Crea tu cuenta de Promotor' : 'Acceso Google Pixel Promotor'}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Consulta ventas, comisiones y objetivos de forma segura.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-4 h-4" /> Configuración requerida
              </div>
              <p>Pega tus claves de Supabase en el archivo <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">.env</code> de este proyecto.</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="promotor@google.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Registrarse' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              {isSignUp
                ? '¿Ya tienes una cuenta? Inicia sesión aquí'
                : '¿Eres nuevo promotor? Crea tu cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
