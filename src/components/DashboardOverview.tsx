import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { VentaItem, InventarioItem } from '../types/database.types';
import { DollarSign, ShoppingBag, Package, TrendingUp, Smartphone, Headphones, Watch, Sparkles } from 'lucide-react';

export const DashboardOverview: React.FC<{ onNavigateToSales: () => void }> = ({ onNavigateToSales }) => {
  const { user } = useAuth();
  const [ventas, setVentas] = useState<VentaItem[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ventasRes, invRes] = await Promise.all([
        supabase.from('ventas').select('*').order('fecha_venta', { ascending: false }),
        supabase.from('inventario_pixel').select('*')
      ]);

      if (ventasRes.data) setVentas(ventasRes.data as VentaItem[]);
      if (invRes.data) setInventario(invRes.data as InventarioItem[]);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs Calculations
  const totalIngresos = ventas.reduce((acc, v) => acc + Number(v.precio_venta) * Number(v.cantidad), 0);
  const totalUnidades = ventas.reduce((acc, v) => acc + Number(v.cantidad), 0);
  const totalStock = inventario.reduce((acc, i) => acc + Number(i.stock), 0);

  // Group by category from inventory or default categories
  const categoryBreakdown: Record<string, { count: number; total: number }> = {
    'Pixel Phone': { count: 0, total: 0 },
    'Pixel Buds': { count: 0, total: 0 },
    'Pixel Watch': { count: 0, total: 0 },
    'Accesorio': { count: 0, total: 0 },
    'Otro': { count: 0, total: 0 },
  };

  // Match sales with category if possible
  ventas.forEach((v) => {
    const matchedItem = inventario.find(i => i.id === v.producto_id);
    const cat = matchedItem?.categoria || 'Otro';
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { count: 0, total: 0 };
    }
    categoryBreakdown[cat].count += Number(v.cantidad);
    categoryBreakdown[cat].total += Number(v.precio_venta) * Number(v.cantidad);
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Pixel Phone': return <Smartphone className="w-5 h-5 text-blue-500" />;
      case 'Pixel Buds': return <Headphones className="w-5 h-5 text-purple-500" />;
      case 'Pixel Watch': return <Watch className="w-5 h-5 text-amber-500" />;
      default: return <Sparkles className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3">
            Google Pixel Promoter Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Panel de Rendimiento y Ventas
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Supervisa en tiempo real tus ventas registradas y el estado de tu stock asegurado en la nube.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <Smartphone className="w-80 h-80" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingresos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Ingresos Totales</p>
            <h3 className="text-2xl font-bold text-gray-900 font-['Google_Sans']">
              {totalIngresos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </h3>
          </div>
        </div>

        {/* Unidades Vendidas */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Unidades Vendidas</p>
            <h3 className="text-2xl font-bold text-gray-900 font-['Google_Sans']">
              {totalUnidades} <span className="text-xs font-normal text-gray-500">artículos</span>
            </h3>
          </div>
        </div>

        {/* Stock Disponible */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Stock en Inventario</p>
            <h3 className="text-2xl font-bold text-gray-900 font-['Google_Sans']">
              {totalStock} <span className="text-xs font-normal text-gray-500">unidades</span>
            </h3>
          </div>
        </div>

        {/* Total Transacciones */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Operaciones</p>
            <h3 className="text-2xl font-bold text-gray-900 font-['Google_Sans']">
              {ventas.length} <span className="text-xs font-normal text-gray-500">ventas</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Categories & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 font-['Google_Sans']">
            Ventas por Ecosistema Pixel
          </h2>
          <div className="space-y-3">
            {Object.entries(categoryBreakdown).map(([cat, data]) => {
              const percentage = totalUnidades > 0 ? Math.round((data.count / totalUnidades) * 100) : 0;
              return (
                <div key={cat} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {getCategoryIcon(cat)}
                      <span className="text-sm font-semibold text-gray-800">{cat}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {data.count} uds ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] text-gray-500">
                    Total: {data.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 font-['Google_Sans']">
              Últimas Ventas Registradas
            </h2>
            <button
              onClick={onNavigateToSales}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Ver todas las ventas &rarr;
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Cargando datos seguros...</div>
          ) : ventas.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto text-gray-300" />
              <p>Aún no has registrado ninguna venta en esta cuenta.</p>
              <button
                onClick={onNavigateToSales}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-xl text-xs hover:bg-blue-100 transition-colors"
              >
                Registrar primera venta
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Producto</th>
                    <th className="pb-3 text-center">Tipo</th>
                    <th className="pb-3 text-center">Cant.</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ventas.slice(0, 5).map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 font-medium text-gray-900">{v.producto_nombre}</td>
                      <td className="py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {v.tipo_venta}
                        </span>
                      </td>
                      <td className="py-3 text-center font-semibold text-gray-700">{v.cantidad}</td>
                      <td className="py-3 text-right font-bold text-gray-900">
                        {(Number(v.precio_venta) * Number(v.cantidad)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="py-3 text-right text-xs text-gray-500">
                        {new Date(v.fecha_venta).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
