import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { incidenciaApi } from '../lib/api';
import { tsmDeZona } from '../lib/business';
import { configApi } from '../lib/api';
import { Card, Badge, Spinner, Empty, Modal, Field, Button, ConfirmDialog } from '../components/ui';
import { fmtDate, escapeHtml, fmtDateTime, monthName } from '../lib/utils';
import { Plus, Trash2, Mail, Copy } from 'lucide-react';
import { TIPOS_INCIDENCIA } from '../types/database.types';

export function Incidencias() {
  const uid = useAuth().user?.id ?? null;
  const [items, setItems] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rapida, setRapida] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const [hasReporte, setHasReporte] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const cargar = async () => {
    if (!uid) return;
    const [i, c, rep] = await Promise.all([incidenciaApi.items(uid), configApi.get(uid), incidenciaApi.reportes(uid)]);
    setItems(i);
    setConfig(c);
    setHasReporte(rep.length > 0);
  };

  useEffect(() => {
    cargar().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const tsm = tsmDeZona(config?.zona);

  // Informe mensual (mailto, sin IA)
  const informe = useMemo(() => {
    const ahora = new Date();
    const delMes = items.filter((i) => {
      const d = new Date(i.fecha);
      return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
    });
    const porTipo = new Map<string, number>();
    delMes.forEach((i) => porTipo.set(i.tipo, (porTipo.get(i.tipo) ?? 0) + 1));
    const cuerpo = [
      `Asunto: Incidencias ${monthName(ahora)}`,
      '',
      `Hola ${tsm},`,
      '',
      `Te envío el informe de incidencias de ${monthName(ahora, false)}.`,
      '',
      `Total incidencias: ${delMes.length}`,
      '',
      'Desglose por tipo:',
      ...[...porTipo.entries()].map(([t, n]) => `- ${t}: ${n}`),
      '',
      'Detalle:',
      ...delMes.map((i, idx) => `${idx + 1}. [${i.tipo}] ${fmtDate(i.fecha)} - ${i.descripcion}${i.tienda ? ` (${i.tienda})` : ''}`),
    ].join('\n');
    return { cuerpo, count: delMes.length, mailto: `mailto:?subject=${encodeURIComponent(`Incidencias ${monthName(ahora)}`)}&body=${encodeURIComponent(cuerpo)}` };
  }, [items, tsm]);

  const copiarInforme = async () => {
    try {
      await navigator.clipboard.writeText(informe.cuerpo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch { /* noop */ }
  };

  if (loading) return <Spinner label="Cargando incidencias…" />;

  const guardarRapida = async (f: any) => {
    if (!uid) return;
    try {
      await incidenciaApi.addItem(uid, {
        ...f,
        tienda: f.tienda || config?.tienda || '',
        promotor: f.promotor || config?.nombre || '',
      });
      setRapida(null);
      await cargar();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Incidencias</h1>
          <p className="text-sm text-zinc-500">Registro de incidencias y envío del informe mensual al TSM ({escapeHtml(tsm)}).</p>
        </div>
        <Button onClick={() => setRapida({})}><Plus className="w-3.5 h-3.5" /> Incidencia rápida</Button>
      </div>

      {/* Informe mensual */}
      <Card title={`Informe mensual · ${monthName()}`} actions={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={copiarInforme}><Copy className="w-3.5 h-3.5" /> {copiado ? 'Copiado' : 'Copiar'}</Button>
          <a href={informe.mailto} target="_blank" rel="noreferrer noopener"><Button variant="success"><Mail className="w-3.5 h-3.5" /> Enviar por Gmail</Button></a>
        </div>
      }>
        <div className="text-sm text-zinc-300">
          <span className="font-semibold text-zinc-100">{informe.count}</span> incidencias este mes
        </div>
        {informe.count > 0 && (
          <pre className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[0.65rem] text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto">{escapeHtml(informe.cuerpo)}</pre>
        )}
        {!hasReporte && <div className="mt-2 text-[0.65rem] text-amber-400">No hay reportes guardados. Usa el informe mensual para enviar por email.</div>}
      </Card>

      {/* Lista */}
      <Card title="Incidencias registradas" pad={false}>
        {items.length === 0 ? (
          <div className="p-4"><Empty msg="Sin incidencias" /></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="text-left text-zinc-500 border-b border-zinc-800"><th className="py-2 px-3">Fecha</th><th className="px-3">Tipo</th><th className="px-3">Estado</th><th className="px-3">Descripción</th><th className="px-3">Tienda</th><th className="px-3"></th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                  <td className="py-2.5 px-3 text-zinc-400">{fmtDateTime(i.fecha)}</td>
                  <td className="px-3"><Badge color={i.tipo === 'material' ? 'red' : i.tipo === 'venta' ? 'amber' : 'gray'}>{i.tipo}</Badge></td>
                  <td className="px-3"><Badge color={i.estado === 'resuelta' ? 'green' : i.estado === 'en curso' ? 'blue' : 'red'}>{i.estado}</Badge></td>
                  <td className="px-3 text-zinc-300 max-w-[260px] truncate">{escapeHtml(i.descripcion)}</td>
                  <td className="px-3 text-zinc-400">{escapeHtml(i.tienda) || '—'}</td>
                  <td className="px-3"><button onClick={() => setDel(i)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!rapida} onClose={() => setRapida(null)} title="Nueva incidencia" maxWidth="max-w-lg">
        {rapida && <RapidaForm data={rapida} config={config} onSave={guardarRapida} />}
      </Modal>
      <ConfirmDialog open={!!del} title="Eliminar incidencia" message="¿Eliminar esta incidencia?" onCancel={() => setDel(null)} onConfirm={async () => { if (uid && del) { await incidenciaApi.removeItem(uid, del.id); setDel(null); await cargar(); } }} />
    </div>
  );
}

function RapidaForm({ data, config, onSave }: { data: any; config: any; onSave: (f: any) => void }) {
  const [form, setForm] = useState({ tipo: data.tipo ?? 'incidencia_general', fecha: (data.fecha || new Date().toISOString()).slice(0, 16), descripcion: data.descripcion ?? '', tienda: data.tienda ?? config?.tienda ?? '', promotor: data.promotor ?? config?.nombre ?? '', accion: data.accion ?? '' });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, fecha: new Date(form.fecha).toISOString() }); }}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo"><select className="inp" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>{TIPOS_INCIDENCIA.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="Fecha"><input type="datetime-local" className="inp" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} /></Field>
      </div>
      <Field label="Descripción *"><textarea className="inp" rows={2} required value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tienda (autocompletada)"><input className="inp" value={form.tienda} onChange={(e) => set('tienda', e.target.value)} /></Field>
        <Field label="Promotor (autocompletado)"><input className="inp" value={form.promotor} onChange={(e) => set('promotor', e.target.value)} /></Field>
      </div>
      <Field label="Acción a tomar"><input className="inp" value={form.accion} onChange={(e) => set('accion', e.target.value)} /></Field>
      <div className="flex justify-end pt-2"><Button type="submit">Guardar incidencia</Button></div>
    </form>
  );
}
