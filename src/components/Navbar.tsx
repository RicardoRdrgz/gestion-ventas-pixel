import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Smartphone, LayoutDashboard, ShoppingCart, Package, LogOut, Lock } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'ventas' | 'inventario';
  setActiveTab: (tab: 'dashboard' | 'ventas' | 'inventario') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, signOut, isConfigured } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-red-500 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-1.5 font-['Google_Sans']">
                Pixel <span className="text-blue-600 font-medium">Promoter</span>
              </span>
              <span className="text-xs text-gray-400 block -mt-1 font-mono">Gestión de Ventas</span>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('ventas')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'ventas'
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ventas</span>
              </button>
              <button
                onClick={() => setActiveTab('inventario')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'inventario'
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Inventario</span>
              </button>
            </nav>
          )}

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            {!isConfigured && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                <Lock className="w-3 h-3" /> Modo Configuración .env
              </span>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-medium text-gray-900 truncate max-w-[160px]">
                    {user.email}
                  </div>
                  <div className="text-[10px] text-green-600 font-medium">RLS Protegido</div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors title='Cerrar Sesión'"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
