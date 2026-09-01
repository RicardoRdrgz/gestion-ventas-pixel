import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { VentaItem, InventarioItem, SaleType } from '../types/database.types';
import { ShoppingCart, Plus, Search, Trash2, Calendar, Download, AlertCircle, X } from 'lucide-react';

const SALE_TYPES: SaleType[] = ['Directa', 'Online', 'Evento', 'Promoción'];

export const SalesManager: React.FC = () => {
  const { user } = useAuth();
  const [ventas, setVentas] = useState<VentaItem[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [customProductName, setCustomProductName] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [tipoVenta, setTipoVenta] = useState<SaleType>('Directa');
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().slice(0, 16));
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ventasRes, invRes] = await Promise.all([
        supabase.from('ventas').select('*').order('fecha_venta', { ascending: false }),
        supabase.from('inventario_pixel').select('*').order('modelo', { ascending: true })
      ]);

      if (ventasRes.data) setVentas(ventasRes.data as VentaItem[]);
      if (invRes.data) setInventario(invRes.data as InventarioItem[]);
    } catch (err: any) {
      console.error('Error al cargar ventas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInventoryItem = (id: string) => {
    setSelectedInventoryId(id);
    const item = inventario.find(i => i.id === id);
    if (item) {
      setCustomProductName(item.modelo);
      setPrecioVenta(Number(item.precio_recomendado));
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMsg(null);

    const prodNombre = selectedInventoryId
      ? inventario.find(i => i.id === selectedInventoryId)?.modelo || customProductName
      : customProductName;

    if (!prodNombre) {
      setErrorMsg('Debes especificar el producto vendido.');
      setSaving(false);
      return;
    }

    try {
      // 1. Insertar venta
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          user_id: user.id,
          producto_id: selectedInventoryId || null,
          producto_nombre: prodNombre,
          cantidad: Number(cantidad),
          precio_venta: Number(precioVenta),
          tipo_venta: tipoVenta,
          fecha_venta: new Date(fechaVenta).toISOString(),
          observaciones: observaciones.trim() || null,
        })
        .select()
        .single();

      if (ventaError) throw ventaError;

      // 2. Si proviene de inventario, descontar stock automáticamente
      if (selectedInventoryId) {
        const item = inventario.find(i => i.id === selectedInventoryId);
        if (item && item.stock >= cantidad) {
          const newStock = item.stock - cantidad;
          await supabase
            .from('inventario_pixel')
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', selectedInventoryId);

          setInventario(inventario.map(i => i.id === selectedInventoryId ? { ...i, stock: newStock } : i));
        }
      }

      if (ventaData) {
        setVentas([ventaData as VentaItem, ...ventas]);
        setShowAddModal(false);
        // Reset form
        setSelectedInventoryId('');
        setCustomProductName('');
        setCantidad(1);
        setPrecioVenta(0);
        setObservaciones('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de venta?')) return;
    try {
      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVentas(ventas.filter(v => v.id !== id));
    } catch (err: any) {
      alert('Error al eliminar venta: ' + err.message);
    }
  };

  const exportToCSV = () => {
    if (ventas.length === 0) return;
    const headers = ['ID', 'Producto', 'Tipo Venta', 'Cantidad', 'Precio Unitario', 'Total', 'Fecha', 'Observaciones'];
    const rows = ventas.map(v => [
      v.id,
      `"${v.producto_nombre}"`,
      v.tipo_venta,
      v.cantidad,
      v.precio_venta,
      (Number(v.precio_venta) * Number(v.cantidad)).toFixed(2),
      new Date(v.fecha_venta).toLocaleDateString('es-ES'),
      `"${v.observaciones || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ventas_pixel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVentas = ventas.filter(v => {
    const matchesSearch = v.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (v.observaciones && v.observaciones.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || v.tipo_venta === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-['Google_Sans']">
            Registro de Ventas Pixel
          </h1>
          <p className="text-sm text-gray-500">
            Historial de ventas de dispositivos y accesorios con cálculo de ingresos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={ventas.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl shadow-xs disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Venta</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por producto u observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Type Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas ({ventas.length})
          </button>
          {SALE_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Cargando ventas seguras...</div>
        ) : filteredVentas.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm space-y-2">
            <ShoppingCart className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-gray-600 font-medium">No se encontraron ventas registradas.</p>
            <p className="text-xs text-gray-400">Haz clic en "Registrar Venta" para añadir tu primera transacción.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4 text-center">Canal / Tipo</th>
                  <th className="py-3.5 px-4 text-center">Cant.</th>
                  <th className="py-3.5 px-4 text-right">Precio Unit.</th>
                  <th className="py-3.5 px-4 text-right">Total Venta</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVentas.map(venta => (
                  <tr key={venta.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div>{venta.producto_nombre}</div>
                      {venta.observaciones && (
                        <div className="text-xs text-gray-400 font-normal italic mt-0.5">{venta.observaciones}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {venta.tipo_venta}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-700">{venta.cantidad}</td>
                    <td className="py-3.5 px-4 text-right text-gray-600">
                      {Number(venta.precio_venta).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                      {(Number(venta.precio_venta) * Number(venta.cantidad)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteSale(venta.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Venta */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 font-['Google_Sans']">
                Registrar Nueva Venta Pixel
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Seleccionar de Inventario (Opcional)
                </label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => handleSelectInventoryItem(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Ingresar producto manual --</option>
                  {inventario.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.modelo} ({item.stock} en stock) - {item.precio_recomendado} €
                    </option>
                  ))}
                </select>
              </div>

              {!selectedInventoryId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Pixel 9 Pro Fold"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Precio Unitario (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Venta</label>
                  <select
                    value={tipoVenta}
                    onChange={(e) => setTipoVenta(e.target.value as SaleType)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {SALE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    required
                    value={fechaVenta}
                    onChange={(e) => setFechaVenta(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Observaciones / Notas (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Promoción con regalo de funda"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center text-sm font-semibold text-gray-900">
                <span>Total de la Venta:</span>
                <span className="text-lg text-blue-600 font-bold">
                  {(cantidad * precioVenta).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Registrando...' : 'Confirmar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
