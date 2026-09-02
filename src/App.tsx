import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './pages/Dashboard';
import { Ventas } from './pages/Ventas';
import { VentaForm } from './pages/VentaForm';
import { VentaDetail } from './pages/VentaDetail';
import { Catalogo } from './pages/Catalogo';
import { Formularios } from './pages/Formularios';
import { Reuniones } from './pages/Reuniones';
import { Objetivos } from './pages/Objetivos';
import { Incidencias } from './pages/Incidencias';
import { Tickelia } from './pages/Tickelia';
import { Guia } from './pages/Guia';
import { Configuracion } from './pages/Configuracion';
import { ResetPassword } from './pages/ResetPassword';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, recoveryPending } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Iniciando sesión segura…</p>
        </div>
      </div>
    );
  }
  // Si hay una recuperación de contraseña pendiente, NO se permite acceso al
  // panel: se fuerza la pantalla de reestablecimiento (CWE-287 / OWASP).
  if (recoveryPending) return <ResetPassword />;
  if (!user) return <AuthModal />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="ventas/nueva" element={<VentaForm />} />
        <Route path="ventas/:id" element={<VentaDetail />} />
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="formularios" element={<Formularios />} />
        <Route path="reuniones" element={<Reuniones />} />
        <Route path="objetivos" element={<Objetivos />} />
        <Route path="incidencias" element={<Incidencias />} />
        <Route path="tickelia" element={<Tickelia />} />
        <Route path="guia" element={<Guia />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
