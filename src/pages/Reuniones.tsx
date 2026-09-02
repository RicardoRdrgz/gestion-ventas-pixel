import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reunionApi } from '../lib/api';
import { Card, Spinner, Empty, Modal, Field, Button, ConfirmDialog } from '../components/ui';
import { fmtDate, escapeHtml, sanitizeUrl } from '../lib/utils';
import { Video, Plus, Pencil, Trash2, ExternalLink, Clock, X, Check } from 'lucide-react';

export function Reuniones() {
  const uid = useAuth().user?.id ?? null;
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<any>(null);
  const [nuevoPunto, setNuevoPunto] = useState('');

  const cargar = async () => {
    if (!uid) return;
    setReuniones(await reunionApi.list(uid));
  };

  useEffect(() => {
    if (!uid) return;
    cargar().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (!uid || !detalleId) return;
    reunionApi.detail(uid, detalleId).then((d) => setDetalle(d));
  }, [uid, detalleId]);

  const guardar = async (form: any) => {
    if (!uid) return;
    const id = await reunionApi.upsert(uid, form);
    setModal(null);
    await cargar();
    if (id) setDetalleId(id);
  };

  const anadirPunto = async () => {
    if (!uid || !detalleId || !nuevoPunto.trim()) return;
    await reunionApi.addPunto(uid, detalleId, nuevoPunto);
    setNuevoPunto('');
    setDetalle(await reunionApi.detail(uid, detalleId));
  };

  if (loading) return <Spinner label="Cargando reuniones…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Reuniones de los lunes</h1>
          <p className="text-sm text-zinc-500">Registro de las videollamadas con enlace, notas y puntos clave.</p>
        </div>
        <Button onClick={() => setModal({})}><Plus className="w-3.5 h-3.5" /> Nueva reunión</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reuniones.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3"><Empty msg="Sin reuniones registradas" /></Card>
        ) : reuniones.map((r) => (
          <Card key={r.id} onClick={() => setDetalleId(r.id)} className="hover:border-zinc-600 cursor-pointer">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Video className="w-4 h-4 text-blue-400" /> {escapeHtml(r.titulo)}
              </div>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setModal(r); }} className="p-1 text-zinc-500 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); setDel(r); }} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500"><Clock className="w-3 h-3" /> {fmtDate(r.fecha)}</div>
            {r.enlace && (
              <a href={sanitizeUrl(r.enlace)} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()} className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"><ExternalLink className="w-3 h-3" /> Abrir videollamada</a>
            )}
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar reunión' : 'Nueva reunión'}>
        {modal && <ReunionForm data={modal} onSave={guardar} />}
      </Modal>
      <ConfirmDialog open={!!del} title="Eliminar reunión" message={`¿Eliminar "${del?.titulo}"?`} onCancel={() => setDel(null)} onConfirm={async () => { if (uid && del) { await reunionApi.remove(uid, del.id); setDel(null); await cargar(); if (detalleId === del.id) setDetalleId(null); } }} />

      <Modal open={!!detalle} onClose={() => { setDetalle(null); setDetalleId(null); }} title={detalle?.reunion?.titulo ?? 'Detalle'}>
        {detalle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-zinc-500">Fecha</div><div className="text-zinc-200">{fmtDate(detalle.reunion.fecha)}</div></div>
              <div><div className="text-zinc-500">Enlace</div><div className="text-zinc-200">{detalle.reunion.enlace ? <a href={sanitizeUrl(detalle.reunion.enlace)} target="_blank" rel="noreferrer noopener" className="text-blue-400 hover:underline">Abrir</a> : '—'}</div></div>
            </div>
            {detalle.reunion.descripcion && <div><div className="text-xs text-zinc-500 mb-1">Descripción</div><p className="text-xs text-zinc-300 whitespace-pre-wrap">{escapeHtml(detalle.reunion.descripcion)}</p></div>}
            {detalle.reunion.notas && <div><div className="text-xs text-zinc-500 mb-1">Notas</div><p className="text-xs text-zinc-300 whitespace-pre-wrap">{escapeHtml(detalle.reunion.notas)}</p></div>}

            <div className="border-t border-zinc-800 pt-3">
              <div className="text-xs font-semibold text-zinc-300 mb-2">Puntos clave</div>
              <div className="space-y-2">
                {detalle.puntos.length === 0 && <Empty msg="Sin puntos clave" />}
                {detalle.puntos.map((p: any) => (
                  <div key={p.id} className="flex items-start justify-between p-2 rounded-lg bg-zinc-800/40">
                    <div className="text-xs text-zinc-300 flex-1">{escapeHtml(p.texto)}{p.timestamp && <span className="text-zinc-500 ml-2">[{escapeHtml(p.timestamp)}]</span>}</div>
                    <button onClick={async () => { if (uid) { await reunionApi.removePunto(uid, p.id); setDetalle(await reunionApi.detail(uid, detalleId!)); } }} className="p-1 text-zinc-500 hover:text-red-400 ml-2"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input className="inp flex-1" value={nuevoPunto} onChange={(e) => setNuevoPunto(e.target.value)} placeholder="Añadir punto clave…" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), anadirPunto())} />
                <Button variant="success" onClick={anadirPunto}><Check className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ReunionForm({ data, onSave }: { data: any; onSave: (f: any) => void }) {
  const [form, setForm] = useState({ id: data.id, titulo: data.titulo ?? '', fecha: (data.fecha || new Date().toISOString()).slice(0, 16), enlace: data.enlace ?? '', descripcion: data.descripcion ?? '', notas: data.notas ?? '' });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, fecha: new Date(form.fecha).toISOString() }); }}>
      <Field label="Título *"><input className="inp" required value={form.titulo} onChange={(e) => set('titulo', e.target.value)} /></Field>
      <Field label="Fecha y hora"><input type="datetime-local" className="inp" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} /></Field>
      <Field label="Enlace (Google Meet)"><input className="inp" value={form.enlace} onChange={(e) => set('enlace', e.target.value)} /></Field>
      <Field label="Descripción"><textarea className="inp" rows={3} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></Field>
      <Field label="Notas"><textarea className="inp" rows={3} value={form.notas} onChange={(e) => set('notas', e.target.value)} /></Field>
      <div className="flex justify-end pt-2"><Button type="submit">Guardar</Button></div>
    </form>
  );
}
