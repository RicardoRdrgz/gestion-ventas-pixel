import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formApi } from '../lib/api';
import { Card, Badge, Spinner, Empty, Modal, Field, Button } from '../components/ui';
import { escapeHtml, sanitizeUrl, monthKey } from '../lib/utils';
import { ExternalLink, Plus, Pencil, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function Formularios() {
  const uid = useAuth().user?.id ?? null;
  const [forms, setForms] = useState<any[]>([]);
  const [cumplidos, setCumplidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const periodo = monthKey();

  const cargar = async () => {
    if (!uid) return;
    const [f, c] = await Promise.all([formApi.list(uid), formApi.cumplidos(uid)]);
    setForms(f);
    setCumplidos(c);
  };

  useEffect(() => {
    cargar().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  if (loading) return <Spinner label="Cargando formularios…" />;

  const guardar = async (form: any) => {
    if (!uid) return;
    await formApi.upsert(uid, form);
    setModal(null);
    await cargar();
  };

  const esCumplido = (id: string) => cumplidos.some((c) => c.formulario_id === id && c.periodo === periodo);

  const toggle = async (id: string) => {
    if (!uid) return;
    await formApi.toggleCumplido(uid, id, periodo, esCumplido(id));
    await cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Formularios semanales</h1>
          <p className="text-sm text-zinc-500">Registro de Google Forms con frecuencia y fechas límite.</p>
        </div>
        <Button onClick={() => setModal({})}><Plus className="w-3.5 h-3.5" /> Añadir formulario</Button>
      </div>

      {forms.filter((f) => f.activo).length === 0 ? (
        <Card><Empty msg="Sin formularios activos" /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {forms.filter((f) => f.activo).map((f) => {
            const cumplido = esCumplido(f.id);
            return (
              <Card key={f.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">{escapeHtml(f.nombre)}</div>
                    <Badge color="gray">{f.frecuencia}{f.frecuencia === 'semanal' && f.dia_semana != null ? ` · ${DIAS[f.dia_semana]}` : ''}</Badge>
                  </div>
                </div>
                {f.descripcion && <p className="text-xs text-zinc-500 mb-2">{escapeHtml(f.descripcion)}</p>}
                <div className="flex items-center justify-between gap-2 mt-3">
                  <div className="flex gap-1">
                    <Button variant="success" onClick={() => toggle(f.id)}>
                      {cumplido ? <><RotateCcw className="w-3 h-3" /> Desmarcar</> : <><CheckCircle2 className="w-3 h-3" /> Cumplido</>}
                    </Button>
                    {sanitizeUrl(f.enlace) && (
                      <a href={sanitizeUrl(f.enlace)} target="_blank" rel="noreferrer noopener">
                        <Button variant="ghost"><ExternalLink className="w-3 h-3" /></Button>
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(f)} className="p-1.5 text-zinc-400 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDel(f)} className="p-1.5 text-zinc-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge color={cumplido ? 'green' : 'amber'}>{cumplido ? 'Completado' : 'Pendiente'}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar formulario' : 'Nuevo formulario'}>
        {modal && <FormForm data={modal} onSave={guardar} />}
      </Modal>
      <ConfirmDelete open={!!del} onCancel={() => setDel(null)} onConfirm={async () => { if (uid && del) { await formApi.remove(uid, del.id); setDel(null); await cargar(); } }} name={del?.nombre} />
    </div>
  );
}

function FormForm({ data, onSave }: { data: any; onSave: (f: any) => void }) {
  const [form, setForm] = useState({ id: data.id, nombre: data.nombre ?? '', descripcion: data.descripcion ?? '', enlace: data.enlace ?? '', frecuencia: data.frecuencia ?? 'semanal', dia_semana: data.dia_semana ?? 0, activo: data.activo ?? true });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <Field label="Nombre *"><input className="inp" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
      <Field label="Descripción"><textarea className="inp" rows={2} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></Field>
      <Field label="Enlace (Google Form)"><input className="inp" value={form.enlace} onChange={(e) => set('enlace', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Frecuencia">
          <select className="inp" value={form.frecuencia} onChange={(e) => set('frecuencia', e.target.value)}>
            <option value="diaria">Diaria</option><option value="semanal">Semanal</option><option value="mensual">Mensual</option><option value="unica">Única</option>
          </select>
        </Field>
        {form.frecuencia === 'semanal' && (
          <Field label="Día de la semana">
            <select className="inp" value={form.dia_semana} onChange={(e) => set('dia_semana', parseInt(e.target.value))}>
              {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </Field>
        )}
      </div>
      <div className="flex justify-end pt-2"><Button type="submit">Guardar</Button></div>
    </form>
  );
}

function ConfirmDelete({ open, onCancel, onConfirm, name }: { open: boolean; onCancel: () => void; onConfirm: () => void; name?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-zinc-100 mb-2">Eliminar formulario</h2>
        <p className="text-xs text-zinc-400 mb-4">¿Eliminar "{escapeHtml(name)}"?</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>Eliminar</Button>
        </div>
      </div>
    </div>
  );
}
