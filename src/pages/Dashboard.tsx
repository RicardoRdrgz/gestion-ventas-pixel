import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, configApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import {
  calcularComisiones, resumenGastos, tsmDeZona, esMismoMes, sugerirPrioridad,
} from '../lib/business';
import { fmtEur, fmtDate, escapeHtml } from '../lib/utils';
import { Card, Badge, Spinner, Empty } from '../components/ui';
import { VentasGoalCard } from '../components/VentasGoalCard';
import {
  TrendingUp, Clock, Wallet, AlertTriangle, Target, User, Smartphone,
  CheckCircle2, Calendar, ShoppingCart, ChevronRight, ArrowRight,
} from 'lucide-react';
import { Venta } from '../types/database.types';

export function Dashboard() {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [itemsMes, setItemsMes] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [formularios, setFormularios] = useState<any[]>([]);
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [d, c] = await Promise.all([dashboardApi.load(uid), configApi.get(uid)]);
        setVentas(d.ventas);
        setGastos(d.gastos);
        setObjetivos(d.objetivos);
        setFormularios(d.formularios);
        setReuniones(d.reuniones);
        setIncidencias(d.incidencias);
        setConfig(c);

        const mes = new Date();
        const ids = d.ventas
          .filter((v) => esMismoMes(v.fecha, mes))
          .map((v) => v.id);
        if (ids.length > 0) {
          const { data: items } = await supabase
            .from('ventas_items').select('*').eq('user_id', uid).in('venta_id', ids);
          setItemsMes((items ?? []) as any[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const ahora = useMemo(() => new Date(), []);
  const ventasMes = useMemo(() => ventas.filter((v) => esMismoMes(v.fecha, ahora)), [ventas, ahora]);
  const ventasHoy = useMemo(
    () => ventas.filter((v) => new Date(v.fecha).toDateString() === ahora.toDateString()),
    [ventas, ahora],
  );
  const gastosMes = useMemo(() => gastos.filter((g) => esMismoMes(g.fecha, ahora)), [gastos, ahora]);
  const resumen = useMemo(() => resumenGastos(gastosMes), [gastosMes]);
  const comisiones = useMemo(() => calcularComisiones(itemsMes), [itemsMes]);
  const incidenciasAbiertas = useMemo(() => incidencias.filter((i) => i.estado !== 'resuelta'), [incidencias]);
  const objetivosActivos = useMemo(() => objetivos.filter((o) => o.activo), [objetivos]);

  const topProductos = useMemo(() => {
    const mapa = new Map<string, { unidades: number; total: number }>();
    for (const it of itemsMes) {
      const cur = mapa.get(it.producto_nombre) ?? { unidades: 0, total: 0 };
      cur.unidades += Number(it.cantidad);
      cur.total += Number(it.cantidad) * Number(it.precio_unitario);
      mapa.set(it.producto_nombre, cur);
    }
    return [...mapa.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  }, [itemsMes]);

  if (loading) return <Spinner label="Cargando panel…" />;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-red-500/20 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/10 backdrop-blur mb-3">
            <Smartphone className="w-3.5 h-3.5 text-blue-300" />
            Google Pixel Promoter Hub
          </span>
          <h1 className="text-2xl font-bold text-zinc-50 font-[Google_Sans]">Panel de Rendimiento y Ventas</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {config?.nombre ? escapeHtml(config.nombre) : 'Promotor'} · Zona {config?.zona ?? '—'} · TSM:{' '}
            <span className="text-zinc-200">{escapeHtml(tsmDeZona(config?.zona))}</span>
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.65rem] text-zinc-500">Comisión acumulada del mes</div>
            <div className="text-xl font-bold text-zinc-100">{fmtEur(comisiones.totalComision)}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><ShoppingCart className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.65rem] text-zinc-500">Ventas este mes</div>
            <div className="text-xl font-bold text-zinc-100">{ventasMes.length}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.65rem] text-zinc-500">Ventas hoy</div>
            <div className="text-xl font-bold text-zinc-100">{ventasHoy.length}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.65rem] text-zinc-500">Gastos del mes</div>
            <div className="text-xl font-bold text-zinc-100">{fmtEur(resumen.totalMes)}</div>
          </div>
        </Card>
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/incidencias">
          <Card className="hover:border-zinc-600 flex items-center justify-between">
            <div><div className="text-[0.65rem] text-zinc-500">Incidencias abiertas</div><div className="text-lg font-bold text-zinc-100">{incidenciasAbiertas.length}</div></div>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </Card>
        </Link>
        <Link to="/objetivos">
          <Card className="hover:border-zinc-600 flex items-center justify-between">
            <div><div className="text-[0.65rem] text-zinc-500">Objetivos pendientes</div><div className="text-lg font-bold text-zinc-100">{objetivosActivos.length}</div></div>
            <Target className="w-5 h-5 text-violet-400" />
          </Card>
        </Link>
        <Link to="/tickelia">
          <Card className="hover:border-zinc-600 flex items-center justify-between">
            <div>
              <div className="text-[0.65rem] text-zinc-500">Resumen gastos mes</div>
              <div className="text-xs text-zinc-400">Tickelia {fmtEur(resumen.tickelia)} · Sodexo {fmtEur(resumen.sodexo)}</div>
            </div>
            <Wallet className="w-5 h-5 text-emerald-400" />
          </Card>
        </Link>
      </div>

      {/* Objetivo de ventas (semanal/mensual) */}
      <VentasGoalCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comisiones */}
        <Card title="Comisiones del mes" className="lg:col-span-2" actions={<Badge color="blue">3 gratis · tope 14</Badge>}>
          {comisiones.items.length === 0 ? (
            <Empty msg="Registra ventas para calcular comisiones" />
          ) : (
            <div className="space-y-3">
              {comisiones.items.map((it) => (
                <div key={it.producto} className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{escapeHtml(it.producto)}</div>
                    <div className="text-[0.7rem] text-zinc-500">{it.unidades} uds · {it.gratis} gratis · {it.pagadas} pagadas</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">{fmtEur(it.pagadas * it.comision)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400">Total unidades pagadas / tope</span>
                <span className="text-xs font-semibold text-zinc-200">{comisiones.totalPagadas} / 14</span>
              </div>
            </div>
          )}
        </Card>

        {/* Top productos */}
        <Card title="Productos más vendidos (mes)">
          {topProductos.length === 0 ? (
            <Empty msg="Sin ventas este mes" />
          ) : (
            <div className="space-y-2">
              {topProductos.map(([nombre, d]) => (
                <div key={nombre} className="flex items-center justify-between">
                  <div className="text-sm text-zinc-300 truncate">{escapeHtml(nombre)}</div>
                  <div className="text-xs text-zinc-500">{d.unidades} uds · {fmtEur(d.total)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas ventas */}
        <Card title="Últimas ventas" actions={<Link to="/ventas" className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">Ver todas <ChevronRight className="w-3 h-3" /></Link>}>
          {ventas.length === 0 ? (
            <Empty msg="No hay ventas registradas" />
          ) : (
            <div className="space-y-2">
              {ventas.slice(0, 5).map((v) => (
                <Link key={v.id} to={`/ventas/${v.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-200 truncate">{escapeHtml(v.notas || 'Venta')} · {fmtDate(v.fecha)}</div>
                    <div className="text-[0.7rem] text-zinc-500">{fmtDate(v.fecha)}</div>
                  </div>
                  <Badge color={v.estado === 'completada' ? 'green' : v.estado === 'reserva' ? 'amber' : v.estado === 'cancelada' ? 'red' : 'gray'}>
                    {v.estado}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Objetivos próximos */}
        <Card title="Objetivos activos" actions={<Link to="/objetivos" className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">Gestionar <ArrowRight className="w-3 h-3" /></Link>}>
          {objetivosActivos.length === 0 ? (
            <Empty msg="Sin objetivos activos" />
          ) : (
            <div className="space-y-2">
              {objetivosActivos.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2 rounded-lg">
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-200 truncate">{escapeHtml(o.nombre)}</div>
                    <div className="text-[0.7rem] text-zinc-500">Frecuencia {o.frecuencia} · Prioridad {sugerirPrioridad(o)}</div>
                  </div>
                  <Badge color={o.prioridad === 'alta' ? 'red' : o.prioridad === 'media' ? 'amber' : 'blue'}>{o.prioridad}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Resumen row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Formularios semanales" actions={<Link to="/formularios" className="text-xs text-blue-400 hover:underline">Ver</Link>}>
          <div className="text-sm text-zinc-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> {formularios.filter((f) => f.activo).length} activos
          </div>
        </Card>
        <Card title="Reuniones registradas" actions={<Link to="/reuniones" className="text-xs text-blue-400 hover:underline">Ver</Link>}>
          <div className="text-sm text-zinc-300 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" /> {reuniones.length} en total</div>
        </Card>
        <Card title="Mi TSM" actions={<span className="text-xs text-zinc-500"><User className="w-3.5 h-3.5 inline" /></span>}>
          <div className="text-sm text-zinc-300">{escapeHtml(tsmDeZona(config?.zona))}</div>
        </Card>
      </div>
    </div>
  );
}
