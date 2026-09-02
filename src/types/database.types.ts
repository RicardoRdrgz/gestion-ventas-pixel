/**
 * Modelos de datos de la BD Supabase.
 * Todas las tablas están aisladas por usuario mediante Row Level Security (RLS),
 * con la columna `user_id` referenciando a auth.users(id).
 * Se recomienda escapar cualquier campo de texto con escapeHtml() antes de
 * renderizarlo (prevención XSS).
 */

// ---------------------------------------------------------------------------
// Catálogo / Inventario
// ---------------------------------------------------------------------------

export const CATEGORIAS = ['pixel_movil', 'buds', 'watch', 'accesorio', 'otro'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ROLES = ['Promotor', 'TSM', 'Coordinadora', 'KAM', 'BackOffice', 'Supervisor', 'Gerente', 'Otro'] as const;
export type Rol = (typeof ROLES)[number];

export interface Producto {
  id: string;
  user_id: string;
  nombre: string;
  categoria: Categoria;
  color?: string | null;
  capacidad?: string | null;
  especificaciones?: string | null;
  precio_default: number;
  stock: number;
  activo: boolean;
  imagen_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  user_id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  created_at: string;
}

export interface Promotor {
  id: string;
  user_id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  tienda?: string | null;
  rol: Rol;
  zona: string;
  activo: boolean;
}

export interface Tienda {
  id: string;
  user_id: string;
  nombre: string;
  ubicacion?: string | null;
  activo: boolean;
}

/** Jerarquía de superiores por zona (datos personales del promotor). */
export interface Superior {
  id: string;
  user_id: string;
  zona: string;
  tsm?: string | null;
  coordinadora?: string | null;
  supervisora?: string | null;
  kam?: string | null;
  backoffice?: string | null;
}

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

export const ESTADOS_VENTA = ['completada', 'reserva', 'cancelada', 'devuelto'] as const;
export type EstadoVenta = (typeof ESTADOS_VENTA)[number];

export const TIPOS_EVENTO = ['contacto', 'demo', 'asesoria', 'venta', 'seguimiento', 'entrega', 'otro'] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export interface Venta {
  id: string;
  user_id: string;
  fecha: string;
  estado: EstadoVenta;
  notas?: string | null;
  cliente_id?: string | null;
  promotor_id?: string | null;
  created_at: string;
}

export interface VentaItem {
  id: string;
  user_id: string;
  venta_id: string;
  producto_id?: string | null;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
}

export interface VentaDetalle extends Venta {
  items: VentaItem[];
  cliente?: Cliente | null;
  eventos: Evento[];
}

export interface Evento {
  id: string;
  user_id: string;
  venta_id?: string | null;
  tipo: TipoEvento;
  fecha: string;
  descripcion?: string | null;
  notas?: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------

export const FRECUENCIAS_FORM = ['diaria', 'semanal', 'mensual', 'unica'] as const;
export type FrecuenciaForm = (typeof FRECUENCIAS_FORM)[number];

export interface Formulario {
  id: string;
  user_id: string;
  nombre: string;
  descripcion?: string | null;
  enlace?: string | null;
  frecuencia: FrecuenciaForm;
  dia_semana?: number | null;
  activo: boolean;
}

export interface CumplimientoForm {
  id: string;
  user_id: string;
  formulario_id: string;
  periodo: string;
  fecha_limite?: string | null;
  fecha_completado: string;
  notas?: string | null;
}

// ---------------------------------------------------------------------------
// Reuniones (sin transcripción / compresión)
// ---------------------------------------------------------------------------

export interface Reunion {
  id: string;
  user_id: string;
  fecha: string;
  titulo: string;
  enlace?: string | null;
  notas?: string | null;
  descripcion?: string | null;
}

export interface PuntoClave {
  id: string;
  user_id: string;
  reunion_id: string;
  texto: string;
  timestamp?: string | null;
}

// ---------------------------------------------------------------------------
// Objetivos
// ---------------------------------------------------------------------------

export const FRECUENCIAS_OBJ = ['semanal', 'mensual'] as const;
export type FrecuenciaObj = (typeof FRECUENCIAS_OBJ)[number];

export interface Objetivo {
  id: string;
  user_id: string;
  nombre: string;
  descripcion?: string | null;
  tipo: string;
  prioridad?: string | null;
  frecuencia: FrecuenciaObj;
  dia_semana?: number | null;
  dia_mes?: number | null;
  horaLimite?: string | null;
  enlace?: string | null;
  fijo: boolean;
  activo: boolean;
}

export interface CheckItem {
  id: string;
  user_id: string;
  objetivo_id: string;
  periodo: string;
  fecha_limite?: string | null;
  completado: boolean;
}

export interface HistorialObjetivo {
  id: string;
  user_id: string;
  objetivo_id: string;
  periodo: string;
  fecha_completado: string;
}

// ---------------------------------------------------------------------------
// Incidencias
// ---------------------------------------------------------------------------

export const TIPOS_INCIDENCIA = ['venta', 'cliente', 'material', 'app/aracne', 'horario', 'incidencia_general', 'otro'] as const;
export type TipoIncidencia = (typeof TIPOS_INCIDENCIA)[number];
export const ESTADOS_INCIDENCIA = ['nueva', 'en curso', 'resuelta'] as const;
export type EstadoIncidencia = (typeof ESTADOS_INCIDENCIA)[number];
export const ESTADOS_REPORTE = ['borrador', 'pendiente', 'enviado', 'resuelto'] as const;
export type EstadoReporte = (typeof ESTADOS_REPORTE)[number];

export interface ReporteIncidencia {
  id: string;
  user_id: string;
  fecha: string;
  tsm?: string | null;
  tienda?: string | null;
  titulo?: string | null;
  notas?: string | null;
  estado: EstadoReporte;
}

export interface IncidenciaItem {
  id: string;
  user_id: string;
  reporte_id?: string | null;
  tipo: TipoIncidencia;
  fecha: string;
  estado: EstadoIncidencia;
  descripcion: string;
  tienda?: string | null;
  promotor?: string | null;
  accion?: string | null;
}

// ---------------------------------------------------------------------------
// Gastos / Tickelia
// ---------------------------------------------------------------------------

export interface Gasto {
  id: string;
  user_id: string;
  fecha: string;
  tipo: string;
  importe: number;
  sistema: string;
  estado: string;
  justificante?: string | null;
  proyecto?: string | null;
  nota?: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Configuración del usuario
// ---------------------------------------------------------------------------

export interface ConfigUsuario {
  id: string;
  user_id: string;
  album_url?: string | null;
  reservas_url?: string | null;
  nombre?: string | null;
  email?: string | null;
  tienda?: string | null;
  zona?: string | null;
  mi_rol?: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Alertas (derivadas, no persistidas o en tabla local)
// ---------------------------------------------------------------------------

export interface Alerta {
  tipo: 'alerta' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
  severidad: 'alta' | 'media' | 'baja';
  fecha_limite?: string | null;
  enlace?: string | null;
  accion?: string | null;
}
