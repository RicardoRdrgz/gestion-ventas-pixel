import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DashboardOverview } from './components/DashboardOverview';
import { InventoryManager } from './components/InventoryManager';
import { SalesManager } from './components/SalesManager';

function MainLayout() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ventas' | 'inventario'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafd]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Iniciando sesión segura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <AuthModal />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardOverview onNavigateToSales={() => setActiveTab('ventas')} />
            )}
            {activeTab === 'ventas' && <SalesManager />}
            {activeTab === 'inventario' && <InventoryManager />}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
