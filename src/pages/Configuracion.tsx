import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { configApi, superiorApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Card, Badge, Spinner, Field, Button, Modal } from '../components/ui';
import { escapeHtml } from '../lib/utils';
import { ZONAS, tsmDeZona } from '../lib/business';
import { Save, KeyRound, User } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Configuracion() {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [superior, setSuperior] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Cambio de contraseña
  const [pwModal, setPwModal] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const [c, s] = await Promise.all([configApi.get(uid), superiorApi.get(uid)]);
      setConfig(c);
      setSuperior(s);
      setForm({ id: c?.id, nombre: c?.nombre ?? '', email: c?.email ?? user?.email ?? '', tienda: c?.tienda ?? '', zona: c?.zona ?? 'Otra' });
      setLoading(false);
    })();
  }, [uid, user?.email]);

  if (loading) return <Spinner label="Cargando configuración…" />;
  if (!form) return null;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const zonaSeleccionada = form.zona || config?.zona;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      if (form.email && !EMAIL_RE.test(form.email)) {
        setErr('El email no es válido.');
        setSaving(false);
        return;
      }
      await configApi.upsert(uid, form);
      // Auto-guardar jerarquía desde la zona seleccionada
      const j = tsmDeZona(form.zona);
      await superiorApi.upsert(uid, { ...superior, id: superior?.id, zona: form.zona, tsm: j });
      setMsg('Configuración guardada correctamente.');
    } catch (error: any) {
      setErr(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setNewPw('');
      setPwModal(false);
    } catch (error: any) {
      setPwMsg(error.message || 'Error al cambiar la contraseña.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Configuración</h1>
        <p className="text-sm text-zinc-500">Tus datos, preferencias y jerarquía.</p>
      </div>

      {msg && <div className="text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3 text-xs">{msg}</div>}
      {err && <div className="text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg p-3 text-xs">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Mis datos">
          <form onSubmit={guardar} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre">
                <div className="relative"><User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" /><input className="inp !pl-9" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></div>
              </Field>
              <Field label="Email"><input className="inp" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
            </div>
            <Field label="Mi tienda"><input className="inp" value={form.tienda} onChange={(e) => set('tienda', e.target.value)} /></Field>
            <Field label="Mi zona">
              <select className="inp" value={form.zona} onChange={(e) => set('zona', e.target.value)}>
                {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </Field>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
              TSM auto-detectado: <span className="text-zinc-200 font-medium">{escapeHtml(tsmDeZona(zonaSeleccionada))}</span>
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={saving}><Save className="w-3.5 h-3.5" /> {saving ? 'Guardando…' : 'Guardar'}</Button></div>
          </form>
        </Card>

        <Card title="Reservas Google Pixel" actions={<Badge color="blue">acciones rápidas</Badge>}>
          <Field label="Enlace a la hoja de reservas">
            <input className="inp" defaultValue={config?.reservas_url ?? ''} onBlur={async (e) => { if (uid) { await configApi.upsert(uid, { ...form, reservas_url: e.target.value }); setConfig(await configApi.get(uid)); } }} placeholder="https://docs.google.com/spreadsheets/…" />
          </Field>
          <div className="mt-2 text-[0.65rem] text-zinc-500">Este enlace se usa en el botón "Reservas Google Pixel" de la página de Ventas.</div>
        </Card>

        <Card title="Seguridad" className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-200">{user?.email}</div>
              <div className="text-[0.7rem] text-zinc-500 flex items-center gap-1"><Badge color="green">RLS protegido</Badge> tus datos están aislados por usuario</div>
            </div>
            <Button variant="ghost" onClick={() => setPwModal(true)}><KeyRound className="w-3.5 h-3.5" /> Cambiar contraseña</Button>
          </div>
        </Card>
      </div>

      <Modal open={pwModal} onClose={() => setPwModal(false)} title="Cambiar contraseña" maxWidth="max-w-md">
        <form onSubmit={cambiarPassword} className="space-y-3">
          <Field label="Nueva contraseña">
            <input type="password" className="inp" minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </Field>
          <p className="text-[0.65rem] text-zinc-500">Supabase notificará el cambio. Usa una contraseña segura.</p>
          {pwMsg && <div className="text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3 text-xs">{pwMsg}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setPwModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={newPw.length < 8}><KeyRound className="w-3.5 h-3.5" /> Cambiar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
