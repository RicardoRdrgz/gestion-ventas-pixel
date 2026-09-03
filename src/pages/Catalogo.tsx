import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { catApi, clienteApi } from '../lib/api';
import {
  Card, Badge, Spinner, Empty, Modal, Field, Button, Table, ConfirmDialog,
} from '../components/ui';
import { fmtEur, escapeHtml } from '../lib/utils';
import { CATEGORIAS } from '../types/database.types';
import { Plus, Pencil, Trash2, Smartphone, Users } from 'lucide-react';

type Tab = 'productos' | 'clientes';

export function Catalogo() {
  const uid = useAuth().user?.id ?? null;
  const [tab, setTab] = useState<Tab>('productos');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Catálogo</h1>
        <p className="text-sm text-zinc-500">Productos y clientes.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {([
          ['productos', 'Productos', Smartphone],
          ['clientes', 'Clientes', Users],
        ] as [Tab, string, any][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === key ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>
      {tab === 'productos' && <Productos uid={uid} />}
      {tab === 'clientes' && <Clientes uid={uid} />}
    </div>
  );
}

function Productos({ uid }: { uid: string | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null); // null | {} (nuevo) | {id,...}
  const [del, setDel] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;
    catApi.list(uid).then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [uid]);

  const guardar = async (e: React.FormEvent, form: any) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    try {
      if (modal.id) {
        await catApi.update(uid, modal.id, form);
      } else {
        await catApi.create(uid, form);
      }
      setModal(null);
      setItems(await catApi.list(uid));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setModal({})}><Plus className="w-3.5 h-3.5" /> Añadir producto</Button>
      </div>
      <Card pad={false}>
        <Table headers={['Producto', 'Categoría', 'Color/Cap.', 'Precio', 'Stock', 'Estado', '']}>
          {items.length === 0 ? <tr><td colSpan={7}><Empty msg="Sin productos" /></td></tr> : items.map((p) => (
            <tr key={p.id} className="border-b border-zinc-800/50 last:border-0">
              <td className="py-2.5 px-3">
                <div className="font-medium text-zinc-200">{escapeHtml(p.nombre)}</div>
                {p.especificaciones && <div className="text-[0.65rem] text-zinc-500">{escapeHtml(p.especificaciones)}</div>}
              </td>
              <td className="px-3"><Badge color="gray">{p.categoria}</Badge></td>
              <td className="px-3 text-zinc-400">{p.color ? escapeHtml(p.color) : '—'}{p.capacidad ? ` · ${escapeHtml(p.capacidad)}` : ''}</td>
              <td className="px-3 text-zinc-200">{fmtEur(p.precio_default)}</td>
              <td className="px-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.stock === 0 ? 'bg-red-500/10 text-red-400' : p.stock < 3 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{p.stock}</span>
              </td>
              <td className="px-3"><Badge color={p.activo ? 'green' : 'gray'}>{p.activo ? 'activo' : 'inactivo'}</Badge></td>
              <td className="px-3">
                <div className="flex gap-1">
                  <button onClick={() => setModal(p)} className="p-1.5 text-zinc-400 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDel(p)} className="p-1.5 text-zinc-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar producto' : 'Nuevo producto'}>
        {modal && <ProductoForm key={modal.id} data={modal} saving={saving} onSave={(v) => guardar(v, v)} />}
      </Modal>
      <ConfirmDialog open={!!del} title="Eliminar producto" message={`¿Eliminar "${del?.nombre}"?`} onCancel={() => setDel(null)} onConfirm={async () => { if (uid && del) { await catApi.remove(uid, del.id); setDel(null); setItems(await catApi.list(uid)); } }} />
    </>
  );
}

function ProductoForm({ data, saving, onSave }: { data: any; saving: boolean; onSave: (f: any) => void }) {
  const [form, setForm] = useState({ nombre: data.nombre ?? '', categoria: data.categoria ?? 'pixel_movil', color: data.color ?? '', capacidad: data.capacidad ?? '', especificaciones: data.especificaciones ?? '', precio_default: data.precio_default ?? 0, stock: data.stock ?? 0, activo: data.activo ?? true });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <Field label="Nombre *"><input className="inp" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Categoría"><select className="inp" value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="Color"><input className="inp" value={form.color} onChange={(e) => set('color', e.target.value)} /></Field>
        <Field label="Capacidad"><input className="inp" value={form.capacidad} onChange={(e) => set('capacidad', e.target.value)} /></Field>
      </div>
      <Field label="Especificaciones"><textarea className="inp" rows={2} value={form.especificaciones} onChange={(e) => set('especificaciones', e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Precio (€)"><input className="inp" type="number" step="0.01" min="0" value={form.precio_default} onChange={(e) => set('precio_default', parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Stock"><input className="inp" type="number" min="0" value={form.stock} onChange={(e) => set('stock', parseInt(e.target.value) || 0)} /></Field>
        <Field label="Activo">
          <select className="inp" value={form.activo ? '1' : '0'} onChange={(e) => set('activo', e.target.value === '1')}>
            <option value="1">Sí</option><option value="0">No</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

function Clientes({ uid }: { uid: string | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [del, setDel] = useState<any>(null);
  const [modal, setModal] = useState<any>(null);

  useEffect(() => {
    if (!uid) return;
    clienteApi.list(uid).then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [uid]);

  const guardar = async (form: any) => {
    if (!uid) return;
    try {
      await clienteApi.upsert(uid, form);
      setModal(null);
      setItems(await clienteApi.list(uid));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <Spinner />;
  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setModal({})}><Plus className="w-3.5 h-3.5" /> Añadir cliente</Button>
      </div>
      <Card pad={false}>
        <Table headers={['Nombre', 'Teléfono', 'Email', 'Ventas', '']}>
          {items.length === 0 ? <tr><td colSpan={5}><Empty msg="Sin clientes" /></td></tr> : items.map((c) => (
            <tr key={c.id} className="border-b border-zinc-800/50 last:border-0">
              <td className="py-2.5 px-3 font-medium text-zinc-200">{escapeHtml(c.nombre)}</td>
              <td className="px-3 text-zinc-400">{escapeHtml(c.telefono) || '—'}</td>
              <td className="px-3 text-zinc-400">{escapeHtml(c.email) || '—'}</td>
              <td className="px-3 text-zinc-400">{c.ventas ?? 0}</td>
              <td className="px-3"><div className="flex gap-1">
                <button onClick={() => setModal(c)} className="p-1.5 text-zinc-400 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDel(c)} className="p-1.5 text-zinc-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div></td>
            </tr>
          ))}
        </Table>
      </Card>
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar cliente' : 'Nuevo cliente'}>
        {modal && <ClienteForm data={modal} onSave={guardar} />}
      </Modal>
      <ConfirmDialog open={!!del} title="Eliminar cliente" message={`¿Eliminar a "${del?.nombre}"?`} onCancel={() => setDel(null)} onConfirm={async () => { if (uid && del) { await clienteApi.remove(uid, del.id); setDel(null); setItems(await clienteApi.list(uid)); } }} />
    </>
  );
}

function ClienteForm({ data, onSave }: { data: any; onSave: (f: any) => void }) {
  const [form, setForm] = useState({ id: data.id, nombre: data.nombre ?? '', telefono: data.telefono ?? '', email: data.email ?? '', notas: data.notas ?? '' });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <Field label="Nombre *"><input className="inp" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Teléfono"><input className="inp" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} /></Field>
        <Field label="Email"><input className="inp" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
      </div>
      <Field label="Notas"><textarea className="inp" rows={2} value={form.notas} onChange={(e) => set('notas', e.target.value)} /></Field>
      <div className="flex justify-end pt-2"><Button type="submit">Guardar</Button></div>
    </form>
  );
}
