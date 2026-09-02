import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { gastoApi } from '../lib/api';
import { Card, Badge, Spinner, Empty, Modal, Field, Button, ConfirmDialog } from '../components/ui';
import { fmtEur, escapeHtml, fmtDate, monthName } from '../lib/utils';
import { resumenGastos, TIPOS_GASTO, SISTEMAS_GASTO, ESTADOS_GASTO } from '../lib/business';
import { Plus, Pencil, Trash2, Wallet, AlertTriangle } from 'lucide-react';

export function Tickelia() {
  const uid = useAuth().user?.id ?? null;
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [del, setDel] = useState<any>(null);

  const cargar = async () => {
    if (!uid) return;
    setGastos(await gastoApi.list(uid));
  };

  useEffect(() => {
    if (!uid) return;
    cargar().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const ahora = useMemo(() => new Date(), []);
  const gastosMes = useMemo(() => gastos.filter((g) => {
    const d = new Date(g.fecha);
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  }), [gastos, ahora]);
  const resumen = useMemo(() => resumenGastos(gastosMes), [gastosMes]);

  const dia = ahora.getDate();
  const cercaLimite = dia >= 15;

  if (loading) return <Spinner label="Cargando gastos…" />;

  const guardar = async (f: any) => {
    if (!uid) return;
    await gastoApi.upsert(uid, f);
    setModal(null);
    await cargar();
  };

  const estadoBadge = (e: string) => e === 'aprobado' ? 'green' as const : e === 'enviado' ? 'blue' as const : e === 'rechazado' ? 'red' as const : 'amber' as const;
  const sisBadge = (s: string) => s === 'tickelia' ? 'blue' as const : 'magenta' as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Tickelia · Gastos</h1>
          <p className="text-sm text-zinc-500">Registro de gastos personales (Tickelia / Sodexo). Proyecto GOOGLE GEMS.</p>
        </div>
        <Button onClick={() => setModal({})}><Plus className="w-3.5 h-3.5" /> Nuevo gasto</Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
          <div><div className="text-[0.65rem] text-zinc-500">Total mes</div><div className="text-xl font-bold text-zinc-100">{fmtEur(resumen.totalMes)}</div></div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
          <div><div className="text-[0.65rem] text-zinc-500">Tickelia</div><div className="text-xl font-bold text-zinc-100">{fmtEur(resumen.tickelia)}</div></div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
          <div><div className="text-[0.65rem] text-zinc-500">Sodexo/ECI</div><div className="text-xl font-bold text-zinc-100">{fmtEur(resumen.sodexo)}</div></div>
        </Card>
        <Card className={`flex items-center gap-3 ${cercaLimite ? 'border-amber-500/30' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.65rem] text-zinc-500">Límite de reporte</div>
            <div className="text-sm font-bold text-zinc-100">Día 19 · 12:00h</div>
            {cercaLimite && <div className="text-[0.6rem] text-amber-400">¡Recuerda reportar a tiempo!</div>}
          </div>
        </Card>
      </div>

      <Card title={`Gastos de ${monthName()}`} pad={false}>
        {gastosMes.length === 0 ? (
          <div className="p-4"><Empty msg="Sin gastos este mes" /></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="text-left text-zinc-500 border-b border-zinc-800"><th className="py-2 px-3">Fecha</th><th className="px-3">Tipo</th><th className="px-3">Importe</th><th className="px-3">Sistema</th><th className="px-3">Estado</th><th className="px-3">Nota</th><th className="px-3"></th></tr></thead>
            <tbody>
              {gastosMes.map((g) => (
                <tr key={g.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                  <td className="py-2.5 px-3 text-zinc-400">{fmtDate(g.fecha)}</td>
                  <td className="px-3 text-zinc-200">{escapeHtml(g.tipo)}</td>
                  <td className="px-3 font-bold text-zinc-100">{fmtEur(g.importe)}</td>
                  <td className="px-3"><Badge color={sisBadge(g.sistema)}>{g.sistema}</Badge></td>
                  <td className="px-3"><Badge color={estadoBadge(g.estado)}>{g.estado}</Badge></td>
                  <td className="px-3 text-zinc-500 max-w-[180px] truncate">{escapeHtml(g.nota) || '—'}</td>
                  <td className="px-3"><div className="flex gap-1">
                    <button onClick={() => setModal(g)} className="p-1 text-zinc-500 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDel(g)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar gasto' : 'Nuevo gasto'} maxWidth="max-w-lg">
        {modal && <GastoForm data={modal} onSave={guardar} />}
      </Modal>
      <ConfirmDialog open={!!del} title="Eliminar gasto" message={`¿Eliminar gasto de ${fmtEur(del?.importe)}?`} onCancel={() => setDel(null)} onConfirm={async () => { if (uid && del) { await gastoApi.remove(uid, del.id); setDel(null); await cargar(); } }} />
    </div>
  );
}

function GastoForm({ data, onSave }: { data: any; onSave: (f: any) => void }) {
  const [form, setForm] = useState({ id: data.id, fecha: (data.fecha || new Date().toISOString()).slice(0, 16), tipo: data.tipo ?? 'RESTAURANTE', importe: data.importe ?? 0, sistema: data.sistema ?? 'tickelia', estado: data.estado ?? 'pendiente', justificante: data.justificante ?? '', proyecto: data.proyecto ?? 'GOOGLE GEMS', nota: data.nota ?? '' });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, fecha: new Date(form.fecha).toISOString(), importe: Number(form.importe) || 0 }); }}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha"><input type="datetime-local" className="inp" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} /></Field>
        <Field label="Importe (€)"><input className="inp" type="number" step="0.01" min="0" value={form.importe} onChange={(e) => set('importe', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo"><select className="inp" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>{TIPOS_GASTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="Sistema"><select className="inp" value={form.sistema} onChange={(e) => set('sistema', e.target.value)}>{SISTEMAS_GASTO.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Estado"><select className="inp" value={form.estado} onChange={(e) => set('estado', e.target.value)}>{ESTADOS_GASTO.map((e) => <option key={e} value={e}>{e}</option>)}</select></Field>
        <Field label="Proyecto"><input className="inp" value={form.proyecto} onChange={(e) => set('proyecto', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Justificante"><select className="inp" value={form.justificante} onChange={(e) => set('justificante', e.target.value)}><option value="">—</option><option value="Tique">Tique</option><option value="Factura">Factura</option></select></Field>
        <Field label="Nota"><input className="inp" value={form.nota} onChange={(e) => set('nota', e.target.value)} /></Field>
      </div>
      <div className="flex justify-end pt-2"><Button type="submit">Guardar</Button></div>
    </form>
  );
}
