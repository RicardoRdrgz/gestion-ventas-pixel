import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reunionApi } from '../lib/api';
import { Card, Spinner, Empty, Modal, Field, Button } from '../components/ui';
import { fmtDate, sanitizeUrl } from '../lib/utils';
import { Video, ExternalLink, Clock, Link2 } from 'lucide-react';

function mondayDelProyecto(): Date {
  const now = new Date();
  const d = new Date(now);
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}

function slotFecha(lunes: Date, hora: number, minuto: number): string {
  const d = new Date(lunes);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

export function Reuniones() {
  const uid = useAuth().user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [reunionesDb, setReunionesDb] = useState<any[]>([]);
  const [edit, setEdit] = useState<{ titulo: string; fecha: string; enlace: string } | null>(null);
  const [enlace, setEnlace] = useState('');
  const [saving, setSaving] = useState(false);

  const lunes = useMemo(() => mondayDelProyecto(), []);
  const horarioEquipo = slotFecha(lunes, 10, 0);
  const horarioTsm = slotFecha(lunes, 10, 45);

  const slots = [
    { clave: 'equipo', titulo: 'Videollamada de equipo', hora: '10:00 – 10:45', fecha: horarioEquipo },
    { clave: 'tsm', titulo: 'Reunión con el TSM', hora: '10:45 – 11:00', fecha: horarioTsm },
  ] as const;

  useEffect(() => {
    if (!uid) return;
    reunionApi.list(uid).then((r) => setReunionesDb(r)).catch(console.error).finally(() => setLoading(false));
  }, [uid]);

  const row = (fecha: string) => reunionesDb.find((r) => new Date(r.fecha).getTime() === new Date(fecha).getTime());

  const guardarEnlace = async () => {
    if (!uid || !edit) return;
    setSaving(true);
    try {
      const existing = row(edit.fecha);
      await reunionApi.upsert(uid, {
        id: existing?.id,
        fecha: edit.fecha,
        titulo: edit.titulo,
        enlace,
      });
      setReunionesDb(await reunionApi.list(uid));
      setEdit(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const abrir = (fecha: string) => {
    const r = row(fecha);
    if (r?.enlace) window.open(sanitizeUrl(r.enlace), '_blank', 'noopener,noreferrer');
  };

  if (loading) return <Spinner label="Cargando reuniones…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Reuniones de los lunes</h1>
        <p className="text-sm text-zinc-500">
          Semana del <span className="text-zinc-300">{fmtDate(lunes.toISOString())}</span>. Añade el enlace de Google Meet; al pulsar la tarjeta se abre la videollamada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((s) => {
          const r = row(s.fecha);
          return (
            <Card key={s.clave} className="flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <Video className="w-4 h-4 text-blue-400" /> {s.titulo}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                <Clock className="w-3 h-3" /> {s.hora} · {fmtDate(s.fecha)}
              </div>

              {r?.enlace ? (
                <button
                  onClick={() => abrir(s.fecha)}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir videollamada
                </button>
              ) : (
                <button
                  onClick={() => { setEdit({ titulo: s.titulo, fecha: s.fecha, enlace: r?.enlace ?? '' }); setEnlace(r?.enlace ?? ''); }}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium px-3 py-2 transition-colors"
                >
                  <Link2 className="w-4 h-4" /> Añadir enlace Meet
                </button>
              )}

              <button
                onClick={() => { setEdit({ titulo: s.titulo, fecha: s.fecha, enlace: r?.enlace ?? '' }); setEnlace(r?.enlace ?? ''); }}
                className="mt-2 text-xs text-zinc-500 hover:text-blue-400 text-center"
              >
                {r?.enlace ? 'Editar enlace' : 'Rellenar enlace'}
              </button>
            </Card>
          );
        })}
        <div className="md:col-span-2">
          <Card>
            <Empty msg="Las reuniones son fijas cada lunes. Solo tienes que añadir el enlace de Google Meet de cada una." />
          </Card>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={`Enlace Meet · ${edit?.titulo ?? ''}`}>
        {edit && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); guardarEnlace(); }}>
            <Field label="Enlace (Google Meet)">
              <input className="inp" value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://meet.google.com/…" />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar enlace'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
