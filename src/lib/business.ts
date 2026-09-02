/**
 * Lógica de negocio del dashboard de promotores Google Pixel.
 * - Cálculo de comisiones mensuales (3 primeras unidades gratis, tope 14 pagadas).
 * - Verificación de prioridades de objetivos (reglas locales, sin IA).
 * - Auto-detección de TSM/jerarquía por zona geográfica.
 * - Resumen mensual de gastos (Tickelia/Sodexo).
 */

import { monthKey, startOfMonth, endOfMonth } from './utils';

export interface ComisionConfig {
  /** Unidades gratis antes de empezar a cobrar comisión. */
  gratis: number;
  /** Tope máximo de unidades pagadas al mes. */
  tope: number;
}

/** Configuración de comisiones por producto. Precio por unidad pagada. */
export const COMISIONES_PRODUCTO: Record<string, { etiqueta: string; comision: number }> = {
  'Pixel 11': { etiqueta: 'Pixel 11', comision: 20 },
  'Pixel 11 Pro': { etiqueta: 'Pixel 11 Pro', comision: 25 },
};

export const COMISION_DEFAULT = 15;

export interface ComisionItem {
  producto: string;
  unidades: number;
  pagadas: number;
  gratis: number;
  comision: number;
}

export interface ResumenComisiones {
  items: ComisionItem[];
  totalUnidades: number;
  totalPagadas: number;
  totalComision: number;
}

/**
 * Calcula las comisiones del mes según el modelo:
 * por cada producto, las primeras N unidades son gratis y el resto se pagan
 * hasta un tope de unidades pagadas.
 */
export function calcularComisiones(
  ventasMes: { producto_nombre: string; cantidad: number }[],
  config: ComisionConfig = { gratis: 3, tope: 14 },
): ResumenComisiones {
  const porProducto = new Map<string, number>();
  for (const v of ventasMes) {
    const clave = Object.keys(COMISIONES_PRODUCTO).find((k) =>
      v.producto_nombre.toLowerCase().includes(k.toLowerCase()),
    ) ?? v.producto_nombre;
    porProducto.set(clave, (porProducto.get(clave) ?? 0) + Number(v.cantidad));
  }

  let totalUnidades = 0;
  let totalPagadas = 0;
  let totalComision = 0;
  const items: ComisionItem[] = [];

  for (const [producto, unidades] of porProducto) {
    const cfg = COMISIONES_PRODUCTO[producto];
    const comision = cfg?.comision ?? COMISION_DEFAULT;
    const gratis = Math.min(unidades, config.gratis);
    // Contabilidad global del tope: primero computamos pagadas brutas por producto,
    // luego aplicamos el tope global más abajo.
    items.push({
      producto,
      unidades,
      gratis,
      pagadas: Math.max(0, unidades - gratis),
      comision,
    });
    totalUnidades += unidades;
  }

  // Aplicar tope global de unidades pagadas (14/mes).
  let pagadasAcum = 0;
  let comisionAcum = 0;
  const itemsFinal = items.map((it) => {
    const disponibles = Math.max(0, config.tope - pagadasAcum);
    const pagadas = Math.min(it.pagadas, disponibles);
    pagadasAcum += pagadas;
    comisionAcum += pagadas * it.comision;
    return { ...it, pagadas };
  });

  totalPagadas = pagadasAcum;
  totalComision = comisionAcum;

  return { items: itemsFinal, totalUnidades, totalPagadas, totalComision };
}

// ---------------------------------------------------------------------------
// Zonas geográficas y auto-detección de TSM / jerarquía
// ---------------------------------------------------------------------------

export const ZONAS = [
  'Noroeste',
  'Cat Norte',
  'Cat Centro',
  'Cat Sur',
  'Mad Norte',
  'Mad Centro',
  'Mad Sur',
  'Levante',
  'Andalucía',
  'Otra',
] as const;

export type Zona = (typeof ZONAS)[number];

export interface JerarquiaZona {
  zona: Zona;
  tsm: string;
  coordinadora: string;
  supervisora: string;
  kam: string;
  backoffice: string;
}

/**
 * Mapa de jerarquía por zona. En un despliegue real estos datos vendrían de la
 * base de datos; aquí se mantienen como configuración de negocio por defecto.
 */
export const JERARQUIA_POR_ZONA: Record<Zona, JerarquiaZona> = {
  'Noroeste': { zona: 'Noroeste', tsm: 'Carlos Núñez', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Noroeste', backoffice: 'BackOffice ES' },
  'Cat Norte': { zona: 'Cat Norte', tsm: 'Laura Vidal', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Cataluña', backoffice: 'BackOffice ES' },
  'Cat Centro': { zona: 'Cat Centro', tsm: 'Laura Vidal', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Cataluña', backoffice: 'BackOffice ES' },
  'Cat Sur': { zona: 'Cat Sur', tsm: 'Laura Vidal', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Cataluña', backoffice: 'BackOffice ES' },
  'Mad Norte': { zona: 'Mad Norte', tsm: 'Miguel Ángel R.', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Madrid', backoffice: 'BackOffice ES' },
  'Mad Centro': { zona: 'Mad Centro', tsm: 'Miguel Ángel R.', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Madrid', backoffice: 'BackOffice ES' },
  'Mad Sur': { zona: 'Mad Sur', tsm: 'Miguel Ángel R.', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Madrid', backoffice: 'BackOffice ES' },
  'Levante': { zona: 'Levante', tsm: 'Alicia Ferrer', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Levante', backoffice: 'BackOffice ES' },
  'Andalucía': { zona: 'Andalucía', tsm: 'Rafael Ortega', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: 'KAM Andalucía', backoffice: 'BackOffice ES' },
  'Otra': { zona: 'Otra', tsm: 'Por asignar', coordinadora: 'Isabel M.', supervisora: 'Sandra R.', kam: '—', backoffice: 'BackOffice ES' },
};

export function tsmDeZona(zona: Zona | string | undefined): string {
  if (!zona) return 'Por asignar';
  return JERARQUIA_POR_ZONA[zona as Zona]?.tsm ?? 'Por asignar';
}

// ---------------------------------------------------------------------------
// Gastos / Tickelia
// ---------------------------------------------------------------------------

export const TIPOS_GASTO = ['RESTAURANTE', 'TAXI/METRO', 'OTROS GASTOS'] as const;
export type TipoGasto = (typeof TIPOS_GASTO)[number];
export const SISTEMAS_GASTO = ['tickelia', 'sodexo'] as const;
export type SistemaGasto = (typeof SISTEMAS_GASTO)[number];
export const ESTADOS_GASTO = ['pendiente', 'enviado', 'aprobado', 'rechazado'] as const;
export type EstadoGasto = (typeof ESTADOS_GASTO)[number];

export interface GastoResumen {
  totalMes: number;
  tickelia: number;
  sodexo: number;
}

/**
 * Calcula el resumen mensual de gastos.
 */
export function resumenGastos(gastosMes: { importe: number; sistema: SistemaGasto }[]): GastoResumen {
  const totalMes = gastosMes.reduce((a, g) => a + Number(g.importe || 0), 0);
  const tickelia = gastosMes
    .filter((g) => g.sistema === 'tickelia')
    .reduce((a, g) => a + Number(g.importe || 0), 0);
  const sodexo = gastosMes
    .filter((g) => g.sistema === 'sodexo')
    .reduce((a, g) => a + Number(g.importe || 0), 0);
  return { totalMes, tickelia, sodexo };
}

// ---------------------------------------------------------------------------
// Objetivos: análisis de prioridades (reglas locales)
// ---------------------------------------------------------------------------

export const PRIORIDADES = ['alta', 'media', 'baja'] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

export const TIPOS_OBJETIVO = [
  'check', 'form', 'reunion', 'gastos', 'informe_ventas', 'feedback', 'incidencias', 'otro',
] as const;
export type TipoObjetivo = (typeof TIPOS_OBJETIVO)[number];

interface ObjetivoInput {
  tipo: TipoObjetivo;
  prioridad?: Prioridad;
  diaSemana?: number | null;
  horaLimite?: string | null;
  activo: boolean;
}

/**
 * Reglas locales para sugerir la prioridad de un objetivo sin usar IA:
 * los objetivos de tipo ventas/form/informe tienden a ser altos; los de
 * check genericos bajos; si no, se mantiene la prioridad manual.
 */
export function sugerirPrioridad(o: ObjetivoInput): Prioridad {
  if (o.tipo === 'informe_ventas' || o.tipo === 'feedback' || o.tipo === 'incidencias') return 'alta';
  if (o.tipo === 'form' || o.tipo === 'reunion' || o.tipo === 'gastos') return 'media';
  return o.prioridad && PRIORIDADES.includes(o.prioridad) ? o.prioridad : 'baja';
}

// ---------------------------------------------------------------------------
// Helpers de periodo
// ---------------------------------------------------------------------------

export function esMismoMes(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export { monthKey, startOfMonth, endOfMonth };
