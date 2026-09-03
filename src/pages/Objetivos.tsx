import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { objApi } from '../lib/api';
import { Card, Badge, Spinner, Empty, Modal, Field, Button, ConfirmDialog } from '../components/ui';
import { escapeHtml, fmtDate, monthKey } from '../lib/utils';
import { sugerirPrioridad, PRIORIDADES, TIPOS_OBJETIVO } from '../lib/business';
import { VentasGoalCard } from '../components/VentasGoalCard';
import { Plus, Pencil, Trash2, Sparkles, History, CheckSquare } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function Objetivos() {
  const uid = useAuth().user?.id ?? null;
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [check, setCheck] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const [verHistorial, setVerHistorial] = useState<any>(null);
  const periodo = monthKey();

  const cargar = async () => {
    if (!uid) return;
    const [o, c, h] = await Promise.all([objApi.list(uid), objApi.checkItems(uid), objApi.historial(uid)]);
    setObjetivos(o);
    setCheck(c);
    setHistorial(h);
  };

  useEffect(() => {
    cargar().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const completado = (id: string) => check.some((c) => c.objetivo_id === id && c.periodo === periodo && c.completado);

  const toggle = async (id: string) => {
    if (!uid) return;
    await objApi.toggle(uid, id, periodo, completado(id));
    await cargar();
  };

  const analizarPrioridades = async () => {
    if (!uid) return;
    try {
      for (const o of objetivos) {
        const p = sugerirPrioridad(o);
        if (o.prioridad !== p) {
          await objApi.upsert(uid, { id: o.id, prioridad: p });
        }
      }
      await cargar();
    } catch (e) {
      console.error(e);
    }
  };

  const progreso = useMemo(() => {
    const activos = objetivos.filter((o) => o.activo);
    const hechos = activos.filter((o) => completado(o.id)).length;
    return activos.length ? Math.round((hechos / activos.length) * 100) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objetivos, check]);

  if (loading) return <Spinner label="Cargando objetivos…" />;

  const prioColor = (p: string) => p === 'alta' ? 'red' as const : p === 'media' ? 'amber' as const : 'blue' as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Objetivos</h1>
          <p className="text-sm text-zinc-500">Checklist de objetivos con prioridad y frecuencia.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={analizarPrioridades}><Sparkles className="w-3.5 h-3.5" /> Analizar prioridades</Button>
          <Button onClick={() => setModal({})}><Plus className="w-3.5 h-3.5" /> Nuevo objetivo</Button>
        </div>
      </div>

      {/* Progreso de objetivos de ventas */}
      <VentasGoalCard />

      {/* Progreso */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">Progreso del mes</span>
          <span className="text-xs font-semibold text-zinc-200">{progreso}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progreso}%` }} />
        </div>
      </Card>

      {objetivos.filter((o) => o.activo).length === 0 ? (
        <Card><Empty msg="Sin objetivos activos" /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {objetivos.filter((o) => o.activo).map((o) => {
            const done = completado(o.id);
            return (
              <Card key={o.id} className={done ? 'border-emerald-500/30' : ''}>
                <div className="flex items-start justify-between">
                  <button onClick={() => toggle(o.id)} className={`flex items-start gap-2 text-left ${done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                    <CheckSquare className={`w-4 h-4 mt-0.5 ${done ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span className="text-sm font-medium">{escapeHtml(o.nombre)}</span>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => setVerHistorial(o)} className="p-1 text-zinc-500 hover:text-blue-400" title="Historial"><History className="w-3.5 h-3.5" /></button>
                    {!o.fijo && <button onClick={() => setModal(o)} className="p-1 text-zinc-500 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>}
                    {!o.fijo && <button onClick={() => setDel(o)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
                {o.descripcion && <p className="text-xs text-zinc-500 mt-1">{escapeHtml(o.descripcion)}</p>}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge color={prioColor(o.prioridad)}>prioridad {o.prioridad}</Badge>
                  <Badge color="gray">freq {o.frecuencia}</Badge>
                  {o.fijo && <Badge color="blue">fijo</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar objetivo' : 'Nuevo objetivo'}>
        {modal && <ObjetivoForm data={modal} onSave={async (f) => { if (uid) { await objApi.upsert(uid, f); setModal(null); await cargar(); } }} />}
      </Modal>
      <ConfirmDialog open={!!del} title="Eliminar objetivo" message={`¿Eliminar "${del?.nombre}"?`} onCancel={() => setDel(null)} onConfirm={async () => { if (uid && del) { await objApi.remove(uid, del.id); setDel(null); await cargar(); } }} />

      <Modal open={!!verHistorial} onClose={() => setVerHistorial(null)} title={`Historial: ${verHistorial?.nombre ?? ''}`} maxWidth="max-w-md">
        {verHistorial && (
          <div className="space-y-2">
            {historial.filter((h) => h.objetivo_id === verHistorial.id).length === 0 ? (
              <Empty msg="Sin histórico de cumplimiento" />
            ) : (
              historial.filter((h) => h.objetivo_id === verHistorial.id).map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/40 text-xs">
                  <span className="text-zinc-300">{h.periodo}</span>
                  <span className="text-zinc-500">{fmtDate(h.fecha_completado)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ObjetivoForm({ data, onSave }: { data: any; onSave: (f: any) => void }) {
  const [form, setForm] = useState({ id: data.id, nombre: data.nombre ?? '', descripcion: data.descripcion ?? '', tipo: data.tipo ?? 'check', prioridad: data.prioridad ?? 'media', frecuencia: data.frecuencia ?? 'semanal', dia_semana: data.dia_semana ?? 0, dia_mes: data.dia_mes ?? 1, horaLimite: data.horaLimite ?? '', enlace: data.enlace ?? '', activo: data.activo ?? true });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <Field label="Nombre *"><input className="inp" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
      <Field label="Descripción"><textarea className="inp" rows={2} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo"><select className="inp" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>{TIPOS_OBJETIVO.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="Prioridad"><select className="inp" value={form.prioridad} onChange={(e) => set('prioridad', e.target.value)}>{PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Frecuencia">
          <select className="inp" value={form.frecuencia} onChange={(e) => set('frecuencia', e.target.value)}>
            <option value="semanal">Semanal</option><option value="mensual">Mensual</option>
          </select>
        </Field>
        {form.frecuencia === 'semanal' ? (
          <Field label="Día de la semana"><select className="inp" value={form.dia_semana} onChange={(e) => set('dia_semana', parseInt(e.target.value))}>{DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>
        ) : (
          <Field label="Día del mes"><input className="inp" type="number" min="1" max="31" value={form.dia_mes} onChange={(e) => set('dia_mes', parseInt(e.target.value) || 1)} /></Field>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hora límite"><input className="inp" type="time" value={form.horaLimite} onChange={(e) => set('horaLimite', e.target.value)} /></Field>
        <Field label="Enlace"><input className="inp" value={form.enlace} onChange={(e) => set('enlace', e.target.value)} /></Field>
      </div>
      <div className="flex justify-end pt-2"><Button type="submit">Guardar</Button></div>
    </form>
  );
}
