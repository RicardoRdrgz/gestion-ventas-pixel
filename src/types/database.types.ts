export type PixelCategory = 'Pixel Phone' | 'Pixel Buds' | 'Pixel Watch' | 'Accesorio' | 'Otro';
export type SaleType = 'Directa' | 'Online' | 'Evento' | 'Promoción';

export interface InventarioItem {
  id: string;
  user_id: string;
  categoria: PixelCategory;
  modelo: string;
  sku?: string;
  stock: number;
  precio_recomendado: number;
  created_at: string;
  updated_at: string;
}

export interface VentaItem {
  id: string;
  user_id: string;
  producto_id?: string | null;
  producto_nombre: string;
  cantidad: number;
  precio_venta: number;
  tipo_venta: SaleType;
  fecha_venta: string;
  observaciones?: string | null;
  created_at: string;
}

export interface SalesKPIs {
  totalVentasMonetario: number;
  unidadesVendidas: number;
  ventasPorCategoria: Record<string, number>;
  totalDispositivosEnStock: number;
}
