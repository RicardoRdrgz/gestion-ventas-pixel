import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertBell } from './AlertBell';
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList, Video, Target,
  AlertTriangle, Wallet, BookOpen, Settings, LogOut, Smartphone, Lock,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Panel', icon: LayoutDashboard },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/catalogo', label: 'Catálogo', icon: Package },
  { to: '/formularios', label: 'Formularios', icon: ClipboardList },
  { to: '/reuniones', label: 'Reuniones', icon: Video },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/incidencias', label: 'Incidencias', icon: AlertTriangle },
  { to: '/tickelia', label: 'Tickelia · Gastos', icon: Wallet },
  { to: '/guia', label: 'Guía / Pautas', icon: BookOpen },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export function AppLayout() {
  const { user, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-zinc-950 border-r border-zinc-800/70 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-800/70">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-500 via-violet-500 to-red-500 flex items-center justify-center text-white">
            <Smartphone className="w-4.5 h-4.5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-zinc-100 font-[Google_Sans]">Pixel Promoter</div>
            <div className="text-[0.65rem] text-zinc-500">Gestión de Ventas</div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-zinc-800/70">
          {!isConfigured && (
            <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6rem] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-3 h-3" /> Modo .env
            </div>
          )}
          {user && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold uppercase">
                  {(user.email || 'U').charAt(0)}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-medium text-zinc-200 truncate">{user.email}</div>
                  <div className="text-[0.6rem] text-emerald-400">RLS Protegido</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile nav + alert bell) */}
        <header className="md:hidden sticky top-0 z-30 bg-zinc-950 border-b border-zinc-800/70">
          <div className="flex items-center justify-between px-4 h-14">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-violet-500 to-red-500 flex items-center justify-center text-white">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-zinc-100 font-[Google_Sans]">Pixel Promoter</span>
            </Link>
            <div className="flex items-center gap-2">
              <AlertBell />
              <button onClick={handleSignOut} className="p-2 text-zinc-400 hover:text-red-400">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
