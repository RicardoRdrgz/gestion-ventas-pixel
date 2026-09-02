import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ventaApi, eventApi, clienteApi } from '../lib/api';
import { Button, Card, Badge, Spinner, Empty, Field, ConfirmDialog } from '../components/ui';
import { fmtDate, fmtEur, escapeHtml, cleanText } from '../lib/utils';
import { ArrowLeft, Trash2, Save, Plus, Phone, Mail } from 'lucide-react';
import { ESTADOS_VENTA, TIPOS_EVENTO } from '../types/database.types';

export function VentaDetail() {
  const { id } = useParams();
  const uid = useAuth().user?.id ?? null;
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editState, setEditState] = useState(false);
  const [estado, setEstado] = useState<any>('completada');
  const [notas, setNotas] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Evento nuevo
  const [evTipo, setEvTipo] = useState<any>('contacto');
  const [evDesc, setEvDesc] = useState('');

  const cargar = async () => {
    if (!uid || !id) return;
    setLoading(true);
    const d = await ventaApi.detail(uid, id);
    if (d) {
      setDetalle(d);
      setEstado(d.venta.estado);
      setNotas(d.venta.notas ?? '');
      setNuevaFecha(d.venta.fecha.slice(0, 16));
      if (d.venta.cliente_id) {
        const c = (await clienteApi.list(uid)).find((x) => x.id === d.venta.cliente_id);
        setCliente(c ?? null);
      } else {
        setCliente(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, id]);

  if (loading) return <Spinner label="Cargando venta…" />;
  if (!detalle) return <Empty msg="No se encontró la venta" />;

  const { venta, items, eventos } = detalle;
  const total = items.reduce((a: number, i: any) => a + Number(i.cantidad) * Number(i.precio_unitario), 0);

  const guardar = async () => {
    if (!uid || !id) return;
    await ventaApi.update(uid, id, { estado, notas: cleanText(notas), fecha: new Date(nuevaFecha).toISOString() });
    setEditState(false);
    cargar();
  };

  const eliminar = async () => {
    if (!uid || !id) return;
    await ventaApi.remove(uid, id);
    navigate('/ventas');
  };

  const anadirEvento = async () => {
    if (!uid || !id || !evDesc.trim()) return;
    await eventApi.create(uid, { venta_id: id, tipo: evTipo, descripcion: evDesc });
    setEvDesc('');
    cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ventas')} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100"><ArrowLeft className="w-3.5 h-3.5" /> Volver a ventas</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Datos de la venta" actions={
            <Badge color={venta.estado === 'completada' ? 'green' : venta.estado === 'reserva' ? 'amber' : venta.estado === 'cancelada' ? 'red' : 'gray'}>{venta.estado}</Badge>
          }>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-zinc-800">
                <tr><td className="py-2 text-zinc-500 w-32">Fecha</td><td className="py-2 text-zinc-200">{fmtDate(venta.fecha)}</td></tr>
                <tr><td className="py-2 text-zinc-500 w-32">Productos</td><td className="py-2 text-zinc-200">{items.map((i: any) => `${escapeHtml(i.producto_nombre)} ×${i.cantidad}`).join(' · ') || '—'}</td></tr>
                <tr><td className="py-2 text-zinc-500">Total</td><td className="py-2 text-zinc-100 font-bold">{fmtEur(total)}</td></tr>
                <tr><td className="py-2 text-zinc-500">Notas</td><td className="py-2 text-zinc-200">{escapeHtml(venta.notas) || '—'}</td></tr>
              </tbody>
            </table>
          </Card>

          {/* Editar */}
          {editState ? (
            <Card title="Editar venta">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Fecha"><input type="datetime-local" className="inp" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} /></Field>
                <Field label="Estado"><select className="inp" value={estado} onChange={(e) => setEstado(e.target.value)}>{ESTADOS_VENTA.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
                <Field label="Notas"><input className="inp" value={notas} onChange={(e) => setNotas(e.target.value)} /></Field>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="ghost" onClick={() => setEditState(false)}>Cancelar</Button>
                <Button variant="success" onClick={guardar}><Save className="w-3.5 h-3.5" /> Guardar</Button>
              </div>
            </Card>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setEditState(true)}>Editar venta</Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 className="w-3.5 h-3.5" /> Eliminar</Button>
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="space-y-6">
          <Card title="Cliente">
            {cliente ? (
              <div className="space-y-1 text-xs">
                <div className="text-sm font-medium text-zinc-200">{escapeHtml(cliente.nombre)}</div>
                {cliente.telefono && <div className="flex items-center gap-1.5 text-zinc-400"><Phone className="w-3 h-3" />{escapeHtml(cliente.telefono)}</div>}
                {cliente.email && <div className="flex items-center gap-1.5 text-zinc-400"><Mail className="w-3 h-3" />{escapeHtml(cliente.email)}</div>}
              </div>
            ) : (
              <Empty msg="Sin cliente asociado" />
            )}
          </Card>

          <Card title="Eventos">
            <div className="space-y-2 mb-3">
              {eventos.length === 0 && <Empty msg="Sin eventos registrados" />}
              {eventos.map((ev: any) => (
                <div key={ev.id} className="flex items-start justify-between p-2 rounded-lg bg-zinc-800/40">
                  <div>
                    <Badge color={ev.tipo === 'venta' ? 'green' : ev.tipo === 'seguimiento' ? 'blue' : 'gray'}>{ev.tipo}</Badge>
                    <div className="mt-1 text-xs text-zinc-300">{escapeHtml(ev.descripcion)}</div>
                    <div className="text-[0.65rem] text-zinc-500">{fmtDate(ev.fecha)}</div>
                  </div>
                  <button onClick={() => uid && id && eventApi.remove(uid, ev.id).then(cargar)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Field label="Añadir evento">
                <select className="inp" value={evTipo} onChange={(e) => setEvTipo(e.target.value)}>
                  {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Descripción">
                <input className="inp" value={evDesc} onChange={(e) => setEvDesc(e.target.value)} placeholder="Detalle del evento…" />
              </Field>
              <Button variant="success" onClick={anadirEvento} disabled={!evDesc.trim()}><Plus className="w-3.5 h-3.5" /> Añadir evento</Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar venta"
        message="¿Seguro que quieres eliminar esta venta? Esta acción no se puede deshacer."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={eliminar}
      />
    </div>
  );
}
