/**
 * Capa de acceso a datos Supabase con tipos y saneamiento.
 * Todas las consultas filtran por user_id (RLS refuerza en la BD, pero
 * también lo hacemos explícito a nivel de aplicación — OWASP).
 */

import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';
import { cleanText, sanitizeUrl } from './utils';
import {
  Producto, Cliente, Promotor, Tienda, Superior, Venta, VentaItem, Evento,
  Formulario, CumplimientoForm, Reunion, PuntoClave, Objetivo, CheckItem,
  HistorialObjetivo, ReporteIncidencia, IncidenciaItem, Gasto, ConfigUsuario,
} from '../types/database.types';

export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export const catApi = {
  async list(userId: string): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('inventario_pixel').select('*').eq('user_id', userId).order('nombre');
    if (error) throw error;
    return (data ?? []) as Producto[];
  },
  async create(userId: string, p: Partial<Producto>): Promise<Producto> {
    const { data, error } = await supabase
      .from('inventario_pixel')
      .insert({ user_id: userId, nombre: cleanText(p.nombre), categoria: p.categoria ?? 'otro', precio_default: Number(p.precio_default) || 0, stock: Number(p.stock) || 0, color: cleanText(p.color), capacidad: cleanText(p.capacidad), especificaciones: cleanText(p.especificaciones), activo: p.activo ?? true })
      .select().single();
    if (error) throw error;
    return data as Producto;
  },
  async update(userId: string, id: string, p: Partial<Producto>): Promise<void> {
    const { error } = await supabase
      .from('inventario_pixel')
      .update({
        nombre: p.nombre !== undefined ? cleanText(p.nombre) : undefined,
        categoria: p.categoria ?? undefined,
        color: p.color !== undefined ? cleanText(p.color) : undefined,
        capacidad: p.capacidad !== undefined ? cleanText(p.capacidad) : undefined,
        especificaciones: p.especificaciones !== undefined ? cleanText(p.especificaciones) : undefined,
        precio_default: p.precio_default !== undefined ? Number(p.precio_default) : undefined,
        stock: p.stock !== undefined ? Number(p.stock) : undefined,
        activo: p.activo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('inventario_pixel').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};

export const clienteApi = {
  async list(userId: string): Promise<Cliente[]> {
    const { data, error } = await supabase.from('clientes').select('*').eq('user_id', userId).order('nombre');
    if (error) throw error;
    return (data ?? []) as Cliente[];
  },
  async upsert(userId: string, c: { id?: string; nombre: string; telefono?: string; email?: string; notas?: string }): Promise<Cliente> {
    const payload: any = {
      user_id: userId,
      nombre: cleanText(c.nombre),
      telefono: cleanText(c.telefono) || null,
      email: cleanText(c.email) || null,
      notas: cleanText(c.notas) || null,
    };
    const { data, error } = c.id
      ? await supabase.from('clientes').update(payload).eq('id', c.id).eq('user_id', userId).select().single()
      : await supabase.from('clientes').insert(payload).select().single();
    if (error) throw error;
    return data as Cliente;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('clientes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};

export const promotorApi = {
  async list(userId: string): Promise<Promotor[]> {
    const { data, error } = await supabase.from('promotores').select('*').eq('user_id', userId).order('nombre');
    if (error) throw error;
    return (data ?? []) as Promotor[];
  },
  async upsert(userId: string, p: Partial<Promotor> & { id?: string }): Promise<Promotor> {
    const payload: any = {
      user_id: userId,
      nombre: cleanText(p.nombre),
      email: cleanText(p.email) || null,
      telefono: cleanText(p.telefono) || null,
      tienda: cleanText(p.tienda) || null,
      rol: p.rol ?? 'Promotor',
      zona: p.zona ?? 'Otra',
      activo: p.activo ?? true,
    };
    const { data, error } = p.id
      ? await supabase.from('promotores').update(payload).eq('id', p.id).eq('user_id', userId).select().single()
      : await supabase.from('promotores').insert(payload).select().single();
    if (error) throw error;
    return data as Promotor;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('promotores').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};

export const tiendaApi = {
  async list(userId: string): Promise<Tienda[]> {
    const { data, error } = await supabase.from('tiendas').select('*').eq('user_id', userId).order('nombre');
    if (error) throw error;
    return (data ?? []) as Tienda[];
  },
  async upsert(userId: string, t: Partial<Tienda> & { id?: string }): Promise<Tienda> {
    const payload: any = {
      user_id: userId,
      nombre: cleanText(t.nombre),
      ubicacion: cleanText(t.ubicacion) || null,
      activo: t.activo ?? true,
    };
    const { data, error } = t.id
      ? await supabase.from('tiendas').update(payload).eq('id', t.id).eq('user_id', userId).select().single()
      : await supabase.from('tiendas').insert(payload).select().single();
    if (error) throw error;
    return data as Tienda;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('tiendas').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};

export const superiorApi = {
  async get(userId: string): Promise<Superior | null> {
    const { data, error } = await supabase.from('superiores').select('*').eq('user_id', userId).single();
    if (error) return null;
    return data as Superior;
  },
  async upsert(userId: string, s: Partial<Superior> & { id?: string }): Promise<Superior> {
    const payload: any = {
      user_id: userId,
      zona: s.zona ?? 'Otra',
      tsm: cleanText(s.tsm) || null,
      coordinadora: cleanText(s.coordinadora) || null,
      supervisora: cleanText(s.supervisora) || null,
      kam: cleanText(s.kam) || null,
      backoffice: cleanText(s.backoffice) || null,
    };
    const { data, error } = s.id
      ? await supabase.from('superiores').update(payload).eq('id', s.id).eq('user_id', userId).select().single()
      : await supabase.from('superiores').insert(payload).select().single();
    if (error) throw error;
    return data as Superior;
  },
};

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

interface CreateVentaInput {
  fecha: string;
  estado: Venta['estado'];
  notas?: string;
  cliente_id?: string | null;
  items: { producto_id?: string | null; producto_nombre: string; cantidad: number; precio_unitario: number }[];
}

export const ventaApi = {
  async list(userId: string): Promise<Venta[]> {
    const { data, error } = await supabase.from('ventas').select('*').eq('user_id', userId).order('fecha', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Venta[];
  },
  async detail(userId: string, id: string): Promise<{ venta: Venta; items: VentaItem[]; eventos: Evento[] } | null> {
    const [v, it, ev] = await Promise.all([
      supabase.from('ventas').select('*').eq('id', id).eq('user_id', userId).single(),
      supabase.from('ventas_items').select('*').eq('venta_id', id).eq('user_id', userId),
      supabase.from('eventos').select('*').eq('venta_id', id).eq('user_id', userId).order('fecha'),
    ]);
    if (v.error || !v.data) return null;
    return { venta: v.data as Venta, items: (it.data ?? []) as VentaItem[], eventos: (ev.data ?? []) as Evento[] };
  },
  async create(userId: string, input: CreateVentaInput): Promise<string> {
    const { data: venta, error } = await supabase
      .from('ventas')
      .insert({
        user_id: userId,
        fecha: input.fecha,
        estado: input.estado,
        notas: cleanText(input.notas) || null,
        cliente_id: input.cliente_id ?? null,
      })
      .select().single();
    if (error) throw error;
    const ventaId = (venta as Venta).id;

    for (const item of input.items) {
      const { error: itErr } = await supabase.from('ventas_items').insert({
        user_id: userId,
        venta_id: ventaId,
        producto_id: item.producto_id ?? null,
        producto_nombre: cleanText(item.producto_nombre),
        cantidad: Number(item.cantidad) || 1,
        precio_unitario: Number(item.precio_unitario) || 0,
      });
      if (itErr) throw itErr;
    }
    return ventaId;
  },
  async update(userId: string, id: string, p: { fecha?: string; estado?: Venta['estado']; notas?: string; cliente_id?: string | null }): Promise<void> {
    const { error } = await supabase.from('ventas').update({
      fecha: p.fecha,
      estado: p.estado,
      notas: p.notas !== undefined ? cleanText(p.notas) || null : undefined,
      cliente_id: p.cliente_id !== undefined ? p.cliente_id : undefined,
    }).eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('ventas').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

export const eventApi = {
  async create(userId: string, e: { venta_id?: string; tipo: Evento['tipo']; descripcion?: string; notas?: string; fecha?: string }): Promise<void> {
    const { error } = await supabase.from('eventos').insert({
      user_id: userId,
      venta_id: e.venta_id ?? null,
      tipo: e.tipo,
      descripcion: cleanText(e.descripcion) || null,
      notas: cleanText(e.notas) || null,
      fecha: e.fecha ?? new Date().toISOString(),
    });
    if (error) throw error;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('eventos').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------

export const formApi = {
  async list(userId: string): Promise<Formulario[]> {
    const { data, error } = await supabase.from('formularios').select('*').eq('user_id', userId).order('nombre');
    if (error) throw error;
    return (data ?? []) as Formulario[];
  },
  async upsert(userId: string, f: Partial<Formulario> & { id?: string }): Promise<void> {
    const payload: any = {
      user_id: userId,
      nombre: cleanText(f.nombre),
      descripcion: cleanText(f.descripcion) || null,
      enlace: sanitizeUrl(f.enlace) || null,
      frecuencia: f.frecuencia ?? 'semanal',
      dia_semana: f.dia_semana ?? null,
      activo: f.activo ?? true,
    };
    const { error } = f.id
      ? await supabase.from('formularios').update(payload).eq('id', f.id).eq('user_id', userId)
      : await supabase.from('formularios').insert(payload);
    if (error) throw error;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('formularios').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
  async cumplidos(userId: string): Promise<CumplimientoForm[]> {
    const { data, error } = await supabase.from('cumplimientos_form').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as CumplimientoForm[];
  },
  async toggleCumplido(userId: string, formId: string, periodo: string, cumplido: boolean): Promise<void> {
    if (cumplido) {
      await supabase.from('cumplimientos_form').delete().eq('formulario_id', formId).eq('periodo', periodo).eq('user_id', userId);
    } else {
      await supabase.from('cumplimientos_form').insert({
        user_id: userId, formulario_id: formId, periodo,
      });
    }
  },
};

// ---------------------------------------------------------------------------
// Reuniones
// ---------------------------------------------------------------------------

export const reunionApi = {
  async list(userId: string): Promise<Reunion[]> {
    const { data, error } = await supabase.from('reuniones').select('*').eq('user_id', userId).order('fecha', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Reunion[];
  },
  async detail(userId: string, id: string): Promise<{ reunion: Reunion; puntos: PuntoClave[] } | null> {
    const [r, p] = await Promise.all([
      supabase.from('reuniones').select('*').eq('id', id).eq('user_id', userId).single(),
      supabase.from('puntos_clave').select('*').eq('reunion_id', id).eq('user_id', userId).order('created_at'),
    ]);
    if (r.error || !r.data) return null;
    return { reunion: r.data as Reunion, puntos: (p.data ?? []) as PuntoClave[] };
  },
  async upsert(userId: string, r: Partial<Reunion> & { id?: string }): Promise<string> {
    const payload: any = {
      user_id: userId,
      fecha: r.fecha ?? new Date().toISOString(),
      titulo: cleanText(r.titulo),
      enlace: sanitizeUrl(r.enlace) || null,
      notas: cleanText(r.notas) || null,
      descripcion: cleanText(r.descripcion) || null,
    };
    if (r.id) {
      const { error } = await supabase.from('reuniones').update(payload).eq('id', r.id).eq('user_id', userId);
      if (error) throw error;
      return r.id;
    }
    const { data, error } = await supabase.from('reuniones').insert(payload).select().single();
    if (error) throw error;
    return (data as Reunion).id;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('reuniones').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
  async addPunto(userId: string, reunionId: string, texto: string, timestamp?: string): Promise<void> {
    const { error } = await supabase.from('puntos_clave').insert({
      user_id: userId, reunion_id: reunionId, texto: cleanText(texto), timestamp: timestamp ? cleanText(timestamp) : null,
    });
    if (error) throw error;
  },
  async removePunto(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('puntos_clave').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Objetivos
// ---------------------------------------------------------------------------

export const objApi = {
  async list(userId: string): Promise<Objetivo[]> {
    const { data, error } = await supabase.from('objetivos').select('*').eq('user_id', userId).order('nombre');
    if (error) throw error;
    return (data ?? []) as Objetivo[];
  },
  async upsert(userId: string, o: Partial<Objetivo> & { id?: string }): Promise<void> {
    const payload: any = {
      user_id: userId,
      nombre: cleanText(o.nombre),
      descripcion: cleanText(o.descripcion) || null,
      tipo: o.tipo ?? 'check',
      prioridad: o.prioridad ?? 'media',
      frecuencia: o.frecuencia ?? 'semanal',
      dia_semana: o.dia_semana ?? null,
      dia_mes: o.dia_mes ?? null,
      horaLimite: o.horaLimite ?? null,
      enlace: sanitizeUrl(o.enlace) || null,
      fijo: o.fijo ?? false,
      activo: o.activo ?? true,
    };
    const { error } = o.id
      ? await supabase.from('objetivos').update(payload).eq('id', o.id).eq('user_id', userId)
      : await supabase.from('objetivos').insert(payload);
    if (error) throw error;
  },
  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('objetivos').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
  async checkItems(userId: string): Promise<CheckItem[]> {
    const { data, error } = await supabase.from('check_items').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as CheckItem[];
  },
  async toggle(userId: string, objetivoId: string, periodo: string, completado: boolean): Promise<void> {
    // Buscar si existe check para el periodo
    const { data } = await supabase.from('check_items').select('*').eq('objetivo_id', objetivoId).eq('periodo', periodo).eq('user_id', userId);
    if (completado) {
      // marcar completado
      if (data && data.length > 0) {
        await supabase.from('check_items').update({ completado: true }).eq('id', (data[0] as CheckItem).id).eq('user_id', userId);
      } else {
        await supabase.from('check_items').insert({ user_id: userId, objetivo_id: objetivoId, periodo, completado: true });
      }
      await supabase.from('historial_objetivos').insert({ user_id: userId, objetivo_id: objetivoId, periodo });
    } else {
      if (data && data.length > 0) {
        await supabase.from('check_items').update({ completado: false }).eq('id', (data[0] as CheckItem).id).eq('user_id', userId);
      }
    }
  },
  async historial(userId: string): Promise<HistorialObjetivo[]> {
    const { data, error } = await supabase.from('historial_objetivos').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as HistorialObjetivo[];
  },
};

// ---------------------------------------------------------------------------
// Incidencias
// ---------------------------------------------------------------------------

export const incidenciaApi = {
  async reportes(userId: string): Promise<ReporteIncidencia[]> {
    const { data, error } = await supabase.from('reportes_incidencia').select('*').eq('user_id', userId).order('fecha', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ReporteIncidencia[];
  },
  async crearReporte(userId: string, tsm: string): Promise<string> {
    const { data, error } = await supabase.from('reportes_incidencia').insert({
      user_id: userId, fecha: new Date().toISOString(), tsm, estado: 'borrador',
    }).select().single();
    if (error) throw error;
    return (data as ReporteIncidencia).id;
  },
  async actualizarReporte(userId: string, id: string, p: Partial<ReporteIncidencia>): Promise<void> {
    const { error } = await supabase.from('reportes_incidencia').update(p).eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
  async eliminarReporte(userId: string, id: string): Promise<void> {
    await supabase.from('reportes_incidencia').delete().eq('id', id).eq('user_id', userId);
  },
  async items(userId: string): Promise<IncidenciaItem[]> {
    const { data, error } = await supabase.from('incidencia_items').select('*').eq('user_id', userId).order('fecha', { ascending: false });
    if (error) throw error;
    return (data ?? []) as IncidenciaItem[];
  },
  async addItem(userId: string, it: Partial<IncidenciaItem>): Promise<void> {
    const { error } = await supabase.from('incidencia_items').insert({
      user_id: userId,
      reporte_id: it.reporte_id ?? null,
      tipo: it.tipo ?? 'incidencia_general',
      fecha: it.fecha ?? new Date().toISOString(),
      estado: 'nueva',
      descripcion: cleanText(it.descripcion),
      tienda: cleanText(it.tienda) || null,
      promotor: cleanText(it.promotor) || null,
      accion: cleanText(it.accion) || null,
    });
    if (error) throw error;
  },
  async updateItem(userId: string, id: string, it: Partial<IncidenciaItem>): Promise<void> {
    const { error } = await supabase.from('incidencia_items').update(it).eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
  async removeItem(userId: string, id: string): Promise<void> {
    await supabase.from('incidencia_items').delete().eq('id', id).eq('user_id', userId);
  },
};

// ---------------------------------------------------------------------------
// Gastos
// ---------------------------------------------------------------------------

export const gastoApi = {
  async list(userId: string): Promise<Gasto[]> {
    const { data, error } = await supabase.from('gastos').select('*').eq('user_id', userId).order('fecha', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Gasto[];
  },
  async upsert(userId: string, g: Partial<Gasto> & { id?: string }): Promise<void> {
    const payload: any = {
      user_id: userId,
      fecha: g.fecha ?? new Date().toISOString(),
      tipo: cleanText(g.tipo),
      importe: Number(g.importe) || 0,
      sistema: g.sistema ?? 'tickelia',
      estado: g.estado ?? 'pendiente',
      justificante: cleanText(g.justificante) || null,
      proyecto: cleanText(g.proyecto) || 'GOOGLE GEMS',
      nota: cleanText(g.nota) || null,
    };
    const { error } = g.id
      ? await supabase.from('gastos').update(payload).eq('id', g.id).eq('user_id', userId)
      : await supabase.from('gastos').insert(payload);
    if (error) throw error;
  },
  async remove(userId: string, id: string): Promise<void> {
    await supabase.from('gastos').delete().eq('id', id).eq('user_id', userId);
  },
};

// ---------------------------------------------------------------------------
// Configuración del usuario
// ---------------------------------------------------------------------------

export const configApi = {
  async get(userId: string): Promise<ConfigUsuario | null> {
    const { data, error } = await supabase.from('configuracion_usuario').select('*').eq('user_id', userId).single();
    if (error) return null;
    return data as ConfigUsuario;
  },
  async upsert(userId: string, c: Partial<ConfigUsuario> & { id?: string }): Promise<void> {
    const payload: any = {
      user_id: userId,
      album_url: c.album_url !== undefined ? sanitizeUrl(c.album_url) || null : undefined,
      reservas_url: c.reservas_url !== undefined ? sanitizeUrl(c.reservas_url) || null : undefined,
      nombre: c.nombre !== undefined ? cleanText(c.nombre) || null : undefined,
      email: c.email !== undefined ? cleanText(c.email) || null : undefined,
      tienda: c.tienda !== undefined ? cleanText(c.tienda) || null : undefined,
      zona: c.zona !== undefined ? cleanText(c.zona) || null : undefined,
      mi_rol: c.mi_rol !== undefined ? cleanText(c.mi_rol) || null : undefined,
      objetivo_semanal: c.objetivo_semanal !== undefined ? Number(c.objetivo_semanal) || 0 : undefined,
      objetivo_mensual: c.objetivo_mensual !== undefined ? Number(c.objetivo_mensual) || 0 : undefined,
      updated_at: new Date().toISOString(),
    };
    const { error } = c.id
      ? await supabase.from('configuracion_usuario').update(payload).eq('id', c.id).eq('user_id', userId)
      : await supabase.from('configuracion_usuario').insert(payload);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Dashboard (resumen agregado)
// ---------------------------------------------------------------------------

export const dashboardApi = {
  async load(userId: string) {
    const [ventas, gastos, objetivos, formularios, reuniones, incidencias] = await Promise.all([
      ventaApi.list(userId),
      gastoApi.list(userId),
      objApi.list(userId),
      formApi.list(userId),
      reunionApi.list(userId),
      incidenciaApi.items(userId),
    ]);
    return { ventas, gastos, objetivos, formularios, reuniones, incidencias };
  },
};
