import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Alerta } from '../types/database.types';
import { monthKey } from '../lib/utils';

/**
 * Genera alertas automáticas a partir de objetivos pendientes, formularios,
 * reuniones sin registrar e incidencias abiertas.
 */
export function AlertBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    cargar();
    const interval = setInterval(cargar, 60000);
    return () => clearInterval(interval);
  }, [user]);

  async function cargar() {
    const uid = user!.id;
    const mk = monthKey();

    try {
      const [objRes, formRes, reuRes, incRes, gastRes, formComplRes] = await Promise.all([
        supabase.from('objetivos').select('*').eq('user_id', uid),
        supabase.from('formularios').select('*').eq('user_id', uid),
        supabase.from('reuniones').select('fecha,titulo').eq('user_id', uid),
        supabase.from('incidencia_items').select('id').eq('user_id', uid).eq('estado', 'nueva'),
        supabase.from('gastos').select('fecha').eq('user_id', uid),
        supabase.from('cumplimientos_form').select('formulario_id,periodo').eq('user_id', uid),
      ]);

      const lista: Alerta[] = [];

      // Objetivos activos
      const objetivos = objRes.data ?? [];
      if (objetivos.filter((o: any) => o.activo).length > 0) {
        lista.push({
          tipo: 'info',
          titulo: 'Objetivos',
          mensaje: `${objetivos.filter((o: any) => o.activo).length} objetivos activos para revisar`,
          severidad: 'media',
          enlace: '/objetivos',
        });
      }

      // Formularios sin cumplir este mes
      const formularios = formRes.data ?? [];
      const cumplidos = formComplRes.data ?? [];
      const pendForm = formularios.filter((f: any) => {
        if (!f.activo) return false;
        return !cumplidos.some((c: any) => c.formulario_id === f.id && c.periodo === mk);
      });
      if (pendForm.length > 0) {
        lista.push({
          tipo: 'warning',
          titulo: 'Formularios pendientes',
          mensaje: `${pendForm.length} formulario(s) sin completar este mes`,
          severidad: 'media',
          enlace: '/formularios',
        });
      }

      // Reuniones de la semana
      const reuniones = reuRes.data ?? [];
      const now = new Date();
      const inicioSemana = new Date(now);
      inicioSemana.setDate(now.getDate() - now.getDay() + 1);
      const reunionesSemana = reuniones.filter((r: any) => new Date(r.fecha) >= inicioSemana);
      if (reunionesSemana.length === 0) {
        lista.push({
          tipo: 'alerta',
          titulo: 'Reunión semanal',
          mensaje: 'Aún no has registrado la reunión de esta semana',
          severidad: 'media',
          enlace: '/reuniones',
        });
      }

      // Incidencias abiertas
      const incidencias = incRes.data ?? [];
      if (incidencias.length > 0) {
        lista.push({
          tipo: 'alerta',
          titulo: 'Incidencias abiertas',
          mensaje: `${incidencias.length} incidencia(s) sin resolver`,
          severidad: 'alta',
          enlace: '/incidencias',
        });
      }

      // Gastos: cerca del límite (día 19)
      const gastosMes = (gastRes.data ?? []).filter((g: any) => monthKey(new Date(g.fecha)) === mk);
      const dia = now.getDate();
      if (gastosMes.length === 0 && dia >= 15) {
        lista.push({
          tipo: 'warning',
          titulo: 'Gastos del mes',
          mensaje: 'Recuerda registrar los gastos antes del día 19 (12:00h)',
          severidad: 'baja',
          enlace: '/tickelia',
        });
      }

      setAlertas(lista);
    } catch {
      setAlertas([]);
    }
  }

  const sinLeer = alertas.filter((a) => !leidas.has(a.titulo)).length;

  const icono = (t: Alerta['tipo']) => {
    if (t === 'alerta') return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (t === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <Info className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        title="Alertas"
      >
        <Bell className="w-5 h-5" />
        {sinLeer > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">
            {sinLeer}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-semibold text-zinc-100">Alertas</span>
              {sinLeer > 0 && (
                <button
                  onClick={() => setLeidas(new Set(alertas.map((a) => a.titulo)))}
                  className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Marcar leídas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {alertas.length === 0 ? (
                <div className="text-zinc-500 text-xs text-center py-8">No tienes alertas pendientes 🎉</div>
              ) : (
                alertas.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLeidas(new Set([...leidas, a.titulo]));
                      setOpen(false);
                      if (a.enlace) navigate(a.enlace);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-800/60 transition-colors border-b border-zinc-800/50 last:border-b-0"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{icono(a.tipo)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-200">{a.titulo}</div>
                        <div className="text-[0.7rem] text-zinc-500 mt-0.5">{a.mensaje}</div>
                      </div>
                      {!leidas.has(a.titulo) && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-zinc-800 text-[0.6rem] text-zinc-600 flex justify-between items-center">
              <span>Actualiza cada minuto</span>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
