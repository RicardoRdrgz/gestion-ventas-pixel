import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

/**
 * Pantalla de reestablecimiento de contraseña.
 * Se muestra de forma obligatoria cuando hay una sesión de recuperación
 * (PASSWORD_RECOVERY) pendiente. Bloquea el acceso al contenido de la app
 * hasta que el usuario introduce una contraseña nueva y válida.
 */
export const ResetPassword: React.FC = () => {
  const { clearRecovery, signOut, recoveryPending } = useAuth();
  const navigate = useNavigate();

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPw.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPw !== confirmPw) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      clearRecovery();
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo actualizar la contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl mb-3">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight font-[Google_Sans]">
            Reestablecer contraseña
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {recoveryPending
              ? 'Por seguridad, debes definir una contraseña nueva antes de continuar.'
              : 'Define una contraseña nueva para tu cuenta.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPw" className="block text-xs font-semibold text-zinc-400 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                id="newPw"
                type="password"
                required
                minLength={6}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPw" className="block text-xs font-semibold text-zinc-400 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                id="confirmPw"
                type="password"
                required
                minLength={6}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Actualizar contraseña</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-medium hover:underline"
          >
            Cancelar y salir
          </button>
        </div>
      </div>
    </div>
  );
};
