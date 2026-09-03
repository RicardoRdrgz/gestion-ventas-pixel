import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ventaApi, configApi, catApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Card, Badge, Spinner, Empty, Button, Modal, Field } from '../components/ui';
import { fmtDate, fmtEur, escapeHtml, sanitizeUrl } from '../lib/utils';
import { ESTADOS_VENTA } from '../types/database.types';
import { ShoppingCart, Plus, ExternalLink, Search, Upload } from 'lucide-react';

type FilaImport = { fecha: string; producto: string; cantidad: number; precio: number; notas: string; error?: string };

export function Ventas() {
  const uid = useAuth().user?.id ?? null;
  const [ventas, setVentas] = useState<any[]>([]);
  const [ventasItems, setVentasItems] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [fEstado, setFEstado] = useState<string>('all');
  const [fMes, setFMes] = useState<string>('all');

  const [importOpen, setImportOpen] = useState(false);
  const [importadoTexto, setImportadoTexto] = useState('');
  const [filas, setFilas] = useState<FilaImport[]>([]);
  const [aciertaConfirmar, setAciertaConfirmar] = useState(false);
  const [importando, setImportando] = useState(false);

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

  const parsearFecha = (s: string): string | null => {
    const t = (s ?? '').trim();
    if (!t) return null;
    let d: Date | null = null;
    const barra = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (barra) {
      const [_, dd, mm, yyyy] = barra;
      const anio = yyyy.length === 2 ? `20${yyyy}` : yyyy;
      d = new Date(Number(anio), Number(mm) - 1, Number(dd), 12);
    } else {
      const iso = new Date(t);
      if (!isNaN(iso.getTime())) d = iso;
    }
    if (!d) return null;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12)).toISOString();
  };

  const cerrarImport = () => {
    setImportOpen(false);
    setImportadoTexto('');
    setFilas([]);
    setAciertaConfirmar(false);
  };

  const parsearPegado = () => {
    const filasNuevas: FilaImport[] = [];
    const lineas = importadoTexto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    lineas.forEach((linea, idx) => {
      const campos = linea.split('\t').map((c) => c.trim());
      // Si no hay tabuladores, intentar separar por ; o ,
      const sep = campos.length === 1 ? linea.split(/[;,]/).map((c) => c.trim()) : campos;
      if (idx === 0 && /fecha|producto|cant|precio/i.test(sep.join(' '))) return; // encabezado
      const [fechaRaw, producto, cantRaw, precioRaw, ...resto] = sep;
      const fechas = parsearFecha(fechaRaw);
      if (!fechas) { filasNuevas.push({ fecha: '', producto: producto ?? '', cantidad: 0, precio: 0, notas: '', error: `Fecha no válida (${fechaRaw ?? ''})` }); return; }
      const cantidad = parseInt((cantRaw ?? '').replace(/\D/g, ''), 10);
      const precio = parseFloat((precioRaw ?? '').replace(',', '.').replace(/[^\d.]/g, ''));
      if (!producto) { filasNuevas.push({ fecha: fechas, producto: '', cantidad, precio: isNaN(precio) ? 0 : precio, notas: resto.join(' '), error: 'Producto vacío' }); return; }
      filasNuevas.push({
        fecha: fechas,
        producto,
        cantidad: isNaN(cantidad) || cantidad < 1 ? 1 : cantidad,
        precio: isNaN(precio) ? 0 : precio,
        notas: resto.join(' '),
      });
    });
    setFilas(filasNuevas);
    setAciertaConfirmar(true);
  };

  const importar = async () => {
    if (!uid) return;
    setImportando(true);
    try {
      const catalog = await catApi.list(uid);
      const valNombres = new Map(catalog.map((p) => [p.nombre.toLowerCase(), p]));
      let creados = 0;
      const errores: string[] = [];
      for (const fila of filas) {
        if (fila.error) { errores.push(`${fila.producto || '(fila)'}: ${fila.error}`); continue; }
        let prod = [...valNombres.entries()].find(([k]) => fila.producto.toLowerCase().includes(k))?.[1];
        if (!prod) {
          prod = await catApi.create(uid, { nombre: fila.producto, categoria: 'otro', precio_default: fila.precio, stock: 0 });
          valNombres.set(prod.nombre.toLowerCase(), prod);
          creados++;
        }
        const precio = fila.precio > 0 ? fila.precio : Number(prod.precio_default) || 0;
        await ventaApi.create(uid, {
          fecha: fila.fecha,
          estado: 'completada',
          notas: fila.notas || undefined,
          items: [{ producto_id: prod.id, producto_nombre: prod.nombre, cantidad: fila.cantidad, precio_unitario: precio }],
        });
      }
      const [v] = await Promise.all([ventaApi.list(uid)]);
      setVentas(v);
      if (v.length > 0) {
        const ids = v.map((x: any) => x.id);
        const { data } = await supabase.from('ventas_items').select('*').eq('user_id', uid).in('venta_id', ids);
        setVentasItems((data ?? []) as any[]);
      }
      let msg = `Se importaron ${filas.length - errores.length} ventas.`;
      if (creados > 0) msg += ` Se crearon ${creados} producto(s) nuevos.`;
      if (errores.length > 0) msg += ` Errores: ${errores.join(' · ')}`;
      alert(msg);
      cerrarImport();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImportando(false);
    }
  };

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
          <Button variant="ghost" onClick={() => setImportOpen(true)}><Upload className="w-3.5 h-3.5" /> Importar</Button>
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

      {/* Modal de importación */}
      <Modal open={importOpen} onClose={cerrarImport} title="Importar ventas">
        {!aciertaConfirmar ? (
          <form
            className="space-y-3"
            onSubmit={(e) => { e.preventDefault(); parsearPegado(); }}
          >
            <p className="text-xs text-zinc-400">
              Pega aquí las filas copiadas de tu hoja de cálculo. Usa la siguiente plantilla (separadas por tabulador,
              punto y coma o coma):
            </p>
            <pre className="text-[0.7rem] text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-x-auto whitespace-pre">
Fecha\tProducto\tCantidad\tPrecio\tNotas/Cliente
02/09/2026\tPixel 11 128GB\t1\t109\tTienda Centro
02/09/2026\tPixel 11 Pro 256GB\t1\t1099\t
            </pre>
            <Field label="Datos pegados">
              <textarea
                className="inp font-mono"
                rows={8}
                placeholder={'02/09/2026\tPixel 11 128GB\t1\t109\tNota\n03/09/2026\tPixel 11 Pro 256GB\t2\t1099\t'}
                value={importadoTexto}
                onChange={(e) => setImportadoTexto(e.target.value)}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={cerrarImport}>Cancelar</Button>
              <Button type="submit">Previsualizar</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">Revisa las filas detectadas. Los productos inexistentes se crearán automáticamente.</p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800/60">
              {filas.length === 0 && <div className="p-3 text-xs text-zinc-500">No se detectaron filas.</div>}
              {filas.map((f, i) => (
                <div key={i} className={`px-3 py-2 text-xs flex items-center justify-between gap-3 ${f.error ? 'bg-red-500/10 text-red-400' : 'bg-zinc-950 text-zinc-300'}`}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{escapeHtml(f.producto || '(sin producto)')} {f.cantidad > 0 && `×${f.cantidad}`}</div>
                    <div className="text-[0.65rem] text-zinc-500 truncate">{fmtDate(f.fecha)} · {fmtEur(f.precio)}{f.notas ? ` · ${escapeHtml(f.notas)}` : ''}</div>
                  </div>
                  {f.error ? <Badge color="red">Error</Badge> : <Badge color="green">ok</Badge>}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setAciertaConfirmar(false)}>Volver</Button>
              <Button disabled={importando} onClick={importar}>{importando ? 'Importando…' : 'Confirmar importación'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
