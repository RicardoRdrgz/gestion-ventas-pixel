import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ventaApi, catApi, clienteApi } from '../lib/api';
import { Button, Card, Field } from '../components/ui';
import { cleanText } from '../lib/utils';
import { Plus, Trash2, Save, ArrowLeft, UserPlus } from 'lucide-react';
import { ESTADOS_VENTA } from '../types/database.types';

interface Linea {
  producto_id?: string | null;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export function VentaForm() {
  const uid = useAuth().user?.id ?? null;
  const navigate = useNavigate();
  const [productos, setProductos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16));
  const [estado, setEstado] = useState<any>('completada');
  const [notas, setNotas] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [buscarCliente, setBuscarCliente] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([{ producto_id: null, producto_nombre: '', cantidad: 1, precio_unitario: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [p, c] = await Promise.all([catApi.list(uid), clienteApi.list(uid)]);
        setProductos(p);
        setClientes(c);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [uid]);

  const clientesFiltrados = useMemo(
    () => clientes.filter((c) => !buscarCliente || c.nombre.toLowerCase().includes(buscarCliente.toLowerCase())),
    [clientes, buscarCliente],
  );

  const total = useMemo(
    () => lineas.reduce((a, l) => a + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0),
    [lineas],
  );

  function setLinea(i: number, patch: Partial<Linea>) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function handleProductoSeleccionado(i: number, productoId: string) {
    const prod = productos.find((p) => p.id === productoId);
    setLinea(i, {
      producto_id: productoId,
      producto_nombre: prod ? prod.nombre : '',
      precio_unitario: prod ? Number(prod.precio_default) || 0 : 0,
    });
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    setError(null);
    try {
      // Auto-crear cliente nuevo si se indica
      let clienteIdFinal: string | null = null;
      if (nuevoCliente.trim()) {
        const c = await clienteApi.upsert(uid, { nombre: nuevoCliente.trim(), telefono: nuevoTelefono, email: nuevoEmail });
        clienteIdFinal = c.id;
      }
      const items = lineas
        .filter((l) => l.producto_nombre.trim())
        .map((l) => ({
          producto_id: l.producto_id ?? null,
          producto_nombre: l.producto_nombre.trim(),
          cantidad: Number(l.cantidad) || 1,
          precio_unitario: Number(l.precio_unitario) || 0,
        }));
      if (items.length === 0) {
        setError('Añade al menos un producto a la venta.');
        setSaving(false);
        return;
      }
      const id = await ventaApi.create(uid, {
        fecha: new Date(fecha).toISOString(),
        estado,
        notas: cleanText(notas),
        cliente_id: clienteIdFinal,
        items,
      });
      navigate(`/ventas/${id}`);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/ventas')} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 mb-1"><ArrowLeft className="w-3.5 h-3.5" /> Volver a ventas</button>
          <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Nueva venta</h1>
        </div>
      </div>

      {error && <div className="text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg p-3 text-xs">{error}</div>}

      <form onSubmit={guardar} className="space-y-5">
        <Card title="Datos generales">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Fecha y hora">
              <input type="datetime-local" className="inp" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </Field>
            <Field label="Estado">
              <select className="inp" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS_VENTA.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Notas">
              <input className="inp" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones…" />
            </Field>
          </div>
        </Card>

        <Card title="Cliente">
          <div className="space-y-3">
            <Field label="Buscar cliente existente">
              <input className="inp" list="clientes-list" placeholder="Escribe para filtrar…" value={buscarCliente} onChange={(e) => setBuscarCliente(e.target.value)} />
              <datalist id="clientes-list">
                {clientesFiltrados.map((c) => <option key={c.id} value={c.nombre} />)}
              </datalist>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Nombre nuevo (opcional)">
                <div className="relative">
                  <UserPlus className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input className="inp !pl-9" value={nuevoCliente} onChange={(e) => setNuevoCliente(e.target.value)} placeholder="Si es nuevo cliente" />
                </div>
              </Field>
              <Field label="Teléfono">
                <input className="inp" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="inp" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Productos" actions={<Button type="button" variant="ghost" onClick={() => setLineas([...lineas, { producto_id: null, producto_nombre: '', cantidad: 1, precio_unitario: 0 }])}><Plus className="w-3.5 h-3.5" /> Añadir producto</Button>}>
          <div className="space-y-2">
            {lineas.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-5">
                  <select className="inp" value={l.producto_id ?? ''} onChange={(e) => handleProductoSeleccionado(i, e.target.value)}>
                    <option value="">— Seleccionar del catálogo —</option>
                    {productos.filter((p) => p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.stock} uds)</option>)}
                  </select>
                </div>
                <div className="col-span-12 sm:col-span-2">
                  <input className="inp" readOnly disabled placeholder="Nombre" value={l.producto_nombre} onChange={(e) => setLinea(i, { producto_nombre: e.target.value })} />
                </div>
                <div className="col-span-4 sm:col-span-1">
                  <input className="inp !text-center" type="number" min="1" value={l.cantidad} onChange={(e) => setLinea(i, { cantidad: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input className="inp" type="number" min="0" step="0.01" value={l.precio_unitario} onChange={(e) => setLinea(i, { precio_unitario: parseFloat(e.target.value) || 0 })} placeholder="€/ud" />
                </div>
                <div className="col-span-3 sm:col-span-1 text-right text-sm font-bold text-zinc-100">
                  {(Number(l.cantidad) * Number(l.precio_unitario)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </div>
                <div className="col-span-1 text-right">
                  <button type="button" onClick={() => lineas.length > 1 && setLineas(lineas.filter((_, idx) => idx !== i))} className="p-1.5 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3 pt-3 border-t border-zinc-800">
            <div className="text-sm text-zinc-400 mr-3">Total:</div>
            <div className="text-lg font-bold text-blue-400">{total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/ventas')}>Cancelar</Button>
          <Button type="submit" disabled={saving}><Save className="w-3.5 h-3.5" /> {saving ? 'Guardando…' : 'Guardar venta'}</Button>
        </div>
      </form>
    </div>
  );
}
