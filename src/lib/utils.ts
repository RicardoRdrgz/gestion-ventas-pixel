/**
 * Utilidades de seguridad y formato.
 * Implementa protección contra XSS (escapado de HTML), validación de entrada
 * y saneamiento de URLs siguiendo las recomendaciones OWASP.
 */

/**
 * Escapa peligrosos caracteres HTML en strings provenientes de datos de usuario
 * o de la base de datos para prevenir ataques XSS (OWASP Cheat Sheet).
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanea una URL para permitir únicamente esquemas seguros (http/https/mailto).
 * Devuelve '' si la URL es inválida o peligrosa. Previene javascript:/data: XSS.
 */
export function sanitizeUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return trimmed;
    }
    // eslint-disable-next-line no-empty
  } catch {
    // fall through: puede ser una ruta relativa o un valor que no sea URL
  }
  return '';
}

/**
 * Recorta y normaliza un string de entrada de usuario. Usa en formularios.
 */
export function cleanText(value: unknown, maxLength = 2000): string {
  const str = value === null || value === undefined ? '' : String(value);
  return str.slice(0, maxLength).trim();
}

/** Formatea un número como moneda en euros (es-ES). */
export function fmtEur(value: number | string | null | undefined): string {
  const n = Number(value) || 0;
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

/** Formatea una fecha a string corto en es-ES. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Formatea una fecha y hora corta en es-ES. */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Devuelve el primer día del mes actual (para filtros). */
export function startOfMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Devuelve el último día del mes actual. */
export function endOfMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Nombre del mes para títulos (es-ES). */
export function monthName(date: Date = new Date(), capitalized = true): string {
  const s = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  if (!capitalized) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Identify current month key in YYYY-MM format. */
export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
