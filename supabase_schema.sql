-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS Y POLÍTICAS RLS PARA GESTIÓN DE VENTAS GOOGLE PIXEL
-- ==============================================================================

-- 1. TABLA: inventario_pixel (Catálogo y stock de dispositivos)
CREATE TABLE IF NOT EXISTS public.inventario_pixel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL CHECK (categoria IN ('Pixel Phone', 'Pixel Buds', 'Pixel Watch', 'Accesorio', 'Otro')),
    modelo TEXT NOT NULL,
    sku TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    precio_recomendado NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (precio_recomendado >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA: ventas (Historial de transacciones de promotores)
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.inventario_pixel(id) ON DELETE SET NULL,
    producto_nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_venta NUMERIC(10, 2) NOT NULL CHECK (precio_venta >= 0),
    tipo_venta TEXT DEFAULT 'Directa' CHECK (tipo_venta IN ('Directa', 'Online', 'Evento', 'Promoción')),
    fecha_venta TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ACTIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.inventario_pixel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE SEGURIDAD ESTRICTAS (Solo el promotor autenticado accede a sus propios datos)
CREATE POLICY "RLS_inventario_select" ON public.inventario_pixel
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "RLS_inventario_insert" ON public.inventario_pixel
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "RLS_inventario_update" ON public.inventario_pixel
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "RLS_inventario_delete" ON public.inventario_pixel
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "RLS_ventas_select" ON public.ventas
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "RLS_ventas_insert" ON public.ventas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "RLS_ventas_update" ON public.ventas
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "RLS_ventas_delete" ON public.ventas
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_inventario_pixel_uid ON public.inventario_pixel(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_uid ON public.ventas(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha_venta DESC);
