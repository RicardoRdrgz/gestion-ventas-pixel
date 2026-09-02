import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  recoveryPending: boolean;
  clearRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  recoveryPending: false,
  clearRecovery: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recoveryPending, setRecoveryPending] = useState<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Un enlace de recuperación otorga sesión pero requiere forzar el cambio
      // de contraseña antes de permitir el acceso al contenido (CWE-287).
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryPending(true);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearRecovery = () => setRecoveryPending(false);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setRecoveryPending(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isConfigured: isSupabaseConfigured, recoveryPending, clearRecovery, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
