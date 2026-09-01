import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { InventarioItem, PixelCategory } from '../types/database.types';
import { Package, Plus, Search, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

const CATEGORIES: PixelCategory[] = ['Pixel Phone', 'Pixel Buds', 'Pixel Watch', 'Accesorio', 'Otro'];

export const InventoryManager: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModelo, setNewModelo] = useState('');
  const [newCategoria, setNewCategoria] = useState<PixelCategory>('Pixel Phone');
  const [newSku, setNewSku] = useState('');
  const [newStock, setNewStock] = useState(1);
  const [newPrecio, setNewPrecio] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit stock inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);

  useEffect(() => {
    if (user) fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventario_pixel')
        .select('*')
        .order('categoria', { ascending: true })
        .order('modelo', { ascending: true });

      if (error) throw error;
      if (data) setItems(data as InventarioItem[]);
    } catch (err: any) {
      console.error('Error al cargar inventario:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('inventario_pixel')
        .insert({
          user_id: user.id,
          modelo: newModelo.trim(),
          categoria: newCategoria,
          sku: newSku.trim() || null,
          stock: Number(newStock),
          precio_recomendado: Number(newPrecio),
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setItems([...items, data as InventarioItem]);
        setShowAddModal(false);
        // Reset
        setNewModelo('');
        setNewSku('');
        setNewStock(1);
        setNewPrecio(0);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStock = async (id: string, newQty: number) => {
    if (newQty < 0) return;
    try {
      const { error } = await supabase
        .from('inventario_pixel')
        .update({ stock: newQty, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setItems(items.map(i => i.id === id ? { ...i, stock: newQty } : i));
      setEditingId(null);
    } catch (err: any) {
      alert('Error al actualizar stock: ' + err.message);
    }
  };

  const handleDeleteItem = async (id: string, modelo: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${modelo}" del inventario?`)) return;
    try {
      const { error } = await supabase
        .from('inventario_pixel')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
    } catch (err: any) {
      alert('Error al eliminar producto: ' + err.message);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-['Google_Sans']">
            Inventario de Dispositivos Pixel
          </h1>
          <p className="text-sm text-gray-500">
            Control de existencias y precios recomendados para promotores.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Producto</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por modelo o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({items.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Cargando inventario seguro...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm space-y-2">
            <Package className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-gray-600 font-medium">No se encontraron productos en el inventario.</p>
            <p className="text-xs text-gray-400">Haz clic en "Añadir Producto" para registrar dispositivos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Modelo / Dispositivo</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                  <th className="py-3.5 px-4 text-right">Precio Rec.</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{item.modelo}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-500">{item.sku || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      {editingId === item.id ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={tempStock}
                            onChange={(e) => setTempStock(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 px-2 py-1 border border-blue-500 rounded text-center text-xs font-bold"
                          />
                          <button
                            onClick={() => handleUpdateStock(item.id, tempStock)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                            item.stock === 0
                              ? 'bg-red-100 text-red-700'
                              : item.stock < 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.stock} uds
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setTempStock(item.stock);
                            }}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Editar Stock"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                      {Number(item.precio_recomendado).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.id, item.modelo)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
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

      {/* Modal Añadir Producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 font-['Google_Sans']">
                Registrar Nuevo Producto Pixel
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

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
                <select
                  value={newCategoria}
                  onChange={(e) => setNewCategoria(e.target.value as PixelCategory)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Modelo / Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Pixel 8 Pro 128GB Obsidian"
                  value={newModelo}
                  onChange={(e) => setNewModelo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKU (Opcional)</label>
                  <input
                    type="text"
                    placeholder="GA04833-ES"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Precio Recomendado (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={newPrecio}
                  onChange={(e) => setNewPrecio(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
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
                  {saving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
