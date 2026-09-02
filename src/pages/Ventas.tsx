import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ventaApi, configApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Card, Badge, Spinner, Empty, Button } from '../components/ui';
import { fmtDate, fmtEur, escapeHtml, sanitizeUrl } from '../lib/utils';
import { ESTADOS_VENTA } from '../types/database.types';
import { ShoppingCart, Plus, ExternalLink, Search } from 'lucide-react';

export function Ventas() {
  const uid = useAuth().user?.id ?? null;
  const [ventas, setVentas] = useState<any[]>([]);
  const [ventasItems, setVentasItems] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [fEstado, setFEstado] = useState<string>('all');
  const [fMes, setFMes] = useState<string>('all');

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [v, c] = await Promise.all([ventaApi.list(uid), configApi.get(uid)]);
        setVentas(v);
        setConfig(c);
        if (v.length > 0) {
          const ids = v.map((x) => x.id);
          const { data } = await supabase.from('ventas_items').select('*').eq('user_id', uid).in('venta_id', ids);
          setVentasItems((data ?? []) as any[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const itemsPorVenta = useMemo(() => {
    const mapa = new Map<string, any[]>();
    for (const it of ventasItems) {
      const arr = mapa.get(it.venta_id) ?? [];
      arr.push(it);
      mapa.set(it.venta_id, arr);
    }
    return mapa;
  }, [ventasItems]);

  const meses = useMemo(() => {
    const set = new Set<string>();
    for (const v of ventas) {
      const d = new Date(v.fecha);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return [...set].sort().reverse();
  }, [ventas]);

  const filtradas = useMemo(() => {
    return ventas.filter((v) => {
      const matchQ = !q || (v.notas && v.notas.toLowerCase().includes(q.toLowerCase())) || itemsPorVenta.get(v.id)?.some((i) => i.producto_nombre.toLowerCase().includes(q.toLowerCase()));
      const matchE = fEstado === 'all' || v.estado === fEstado;
      const d = new Date(v.fecha);
      const matchM = fMes === 'all' || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === fMes;
      return matchQ && matchE && matchM;
    });
  }, [ventas, q, fEstado, fMes, itemsPorVenta]);

  const totalFiltrado = useMemo(() => {
    let total = 0;
    for (const v of filtradas) {
      for (const it of itemsPorVenta.get(v.id) ?? []) {
        total += Number(it.cantidad) * Number(it.precio_unitario);
      }
    }
    return total;
  }, [filtradas, itemsPorVenta]);

  const reservasUrl = sanitizeUrl(config?.reservas_url);

  if (loading) return <Spinner label="Cargando ventas…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Registro de Ventas Pixel</h1>
          <p className="text-sm text-zinc-500">Ventas con múltiples productos, clientes, eventos y estados.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reservasUrl && (
            <a href={reservasUrl} target="_blank" rel="noreferrer noopener">
              <Button variant="ghost"><ExternalLink className="w-3.5 h-3.5" /> Reservas Google Pixel</Button>
            </a>
          )}
          <Link to="/ventas/nueva">
            <Button><Plus className="w-3.5 h-3.5" /> Nueva venta</Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card pad={false}>
        <div className="p-3 flex flex-col md:flex-row gap-3 items-center justify-between border-b border-zinc-800/60">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              className="inp !pl-9"
              placeholder="Buscar por producto, notas, cliente…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <select className="inp !w-auto" value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
              <option value="all">Estado: todos</option>
              {ESTADOS_VENTA.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <select className="inp !w-auto" value={fMes} onChange={(e) => setFMes(e.target.value)}>
              <option value="all">Mes: todos</option>
              {meses.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="px-4 py-2 text-xs text-zinc-400 flex items-center justify-between">
          <span>{filtradas.length} ventas · Total {fmtEur(totalFiltrado)}</span>
        </div>
      </Card>

      {filtradas.length === 0 ? (
        <Card><Empty msg="No hay ventas que coincidan" /></Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((v) => {
            const items = itemsPorVenta.get(v.id) ?? [];
            const total = items.reduce((a, i) => a + Number(i.cantidad) * Number(i.precio_unitario), 0);
            return (
              <Link key={v.id} to={`/ventas/${v.id}`}>
                <Card className="hover:border-zinc-600">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-200">{fmtDate(v.fecha)}</span>
                        <Badge color={v.estado === 'completada' ? 'green' : v.estado === 'reserva' ? 'amber' : v.estado === 'cancelada' ? 'red' : 'gray'}>{v.estado}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {items.length === 0 ? 'Sin productos' : items.map((i) => `${escapeHtml(i.producto_nombre)} ×${i.cantidad}`).join(' · ')}
                      </div>
                      {v.notas && <div className="mt-0.5 text-[0.7rem] text-zinc-500 italic">{escapeHtml(v.notas)}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-zinc-100">{fmtEur(total)}</div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
