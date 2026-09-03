-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS Y POLÍTICAS RLS PARA GESTIÓN DE VENTAS GOOGLE PIXEL
-- Todas las tablas están aisladas por usuario (user_id -> auth.users).
-- RLS habilitado en TODAS las tablas (OWASP: acceso a datos por usuario).
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 1. inventario_pixel -> EVOLUCIONADO a "productos" (catálogo con detalles)
-- Por compatibilidad se mantiene el nombre, añadiendo columnas nuevas.
-- ---------------------------------------------------------------------------
ALTER TABLE public.inventario_pixel ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.inventario_pixel ADD COLUMN IF NOT EXISTS capacidad TEXT;
ALTER TABLE public.inventario_pixel ADD COLUMN IF NOT EXISTS especificaciones TEXT;
ALTER TABLE public.inventario_pixel ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.inventario_pixel ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- ---------------------------------------------------------------------------
-- 2. clientes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- 3. promotores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    tienda TEXT,
    rol TEXT NOT NULL DEFAULT 'Promotor',
    zona TEXT NOT NULL DEFAULT 'Otra',
    activo BOOLEAN NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 4. tiendas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 5. superiores (jerarquía por zona)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.superiores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    zona TEXT NOT NULL,
    tsm TEXT,
    coordinadora TEXT,
    supervisora TEXT,
    kam TEXT,
    backoffice TEXT
);

-- ---------------------------------------------------------------------------
-- 6. ventas (cabecera) — multi-ítem
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada','reserva','cancelada','devuelto')),
    notas TEXT,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    promotor_id UUID REFERENCES public.promotores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- 7. ventas_items (líneas de detalle)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ventas_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.inventario_pixel(id) ON DELETE SET NULL,
    producto_nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
    descuento NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0)
);

-- ---------------------------------------------------------------------------
-- 8. eventos (asociados a una venta o independientes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL DEFAULT 'contacto' CHECK (tipo IN ('contacto','demo','asesoria','venta','seguimiento','entrega','otro')),
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    descripcion TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- 9. formularios (semana/mes/día) y cumplimientos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.formularios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    enlace TEXT,
    frecuencia TEXT NOT NULL DEFAULT 'semanal' CHECK (frecuencia IN ('diaria','semanal','mensual','unica')),
    dia_semana INTEGER,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.cumplimientos_form (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
    periodo TEXT NOT NULL,
    fecha_limite TIMESTAMPTZ,
    fecha_completado TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    notas TEXT
);

-- ---------------------------------------------------------------------------
-- 10. reuniones (sin transcripción) y puntos clave
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reuniones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ NOT NULL,
    titulo TEXT NOT NULL,
    enlace TEXT,
    notas TEXT,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.puntos_clave (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    reunion_id UUID NOT NULL REFERENCES public.reuniones(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    timestamp TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- 11. objetivos, check_items, historial_objetivos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.objetivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL DEFAULT 'check',
    prioridad TEXT NOT NULL DEFAULT 'media',
    frecuencia TEXT NOT NULL DEFAULT 'semanal' CHECK (frecuencia IN ('semanal','mensual')),
    dia_semana INTEGER,
    dia_mes INTEGER,
    horaLimite TEXT,
    enlace TEXT,
    fijo BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.check_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    objetivo_id UUID NOT NULL REFERENCES public.objetivos(id) ON DELETE CASCADE,
    periodo TEXT NOT NULL,
    fecha_limite TIMESTAMPTZ,
    completado BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.historial_objetivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    objetivo_id UUID NOT NULL REFERENCES public.objetivos(id) ON DELETE CASCADE,
    periodo TEXT NOT NULL,
    fecha_completado TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- 12. incidencias, reportes, incidencia_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reportes_incidencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    tsm TEXT,
    tienda TEXT,
    titulo TEXT,
    notas TEXT,
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','pendiente','enviado','resuelto'))
);

CREATE TABLE IF NOT EXISTS public.incidencia_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    reporte_id UUID REFERENCES public.reportes_incidencia(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL DEFAULT 'incidencia_general',
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    estado TEXT NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva','en curso','resuelta')),
    descripcion TEXT NOT NULL,
    tienda TEXT,
    promotor TEXT,
    accion TEXT
);

-- ---------------------------------------------------------------------------
-- 13. gastos (Tickelia / Sodexo)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    tipo TEXT NOT NULL,
    importe NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (importe >= 0),
    sistema TEXT NOT NULL DEFAULT 'tickelia' CHECK (sistema IN ('tickelia','sodexo')),
    estado TEXT NOT NULL DEFAULT 'pendiente',
    justificante TEXT,
    proyecto TEXT DEFAULT 'GOOGLE GEMS',
    nota TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- 14. configuracion_usuario (preferencias y datos personales)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.configuracion_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    album_url TEXT,
    reservas_url TEXT,
    nombre TEXT,
    email TEXT,
    tienda TEXT,
    zona TEXT,
    mi_rol TEXT,
    objetivo_semanal INTEGER,
    objetivo_mensual INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ACTIVAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- ==============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'inventario_pixel','clientes','promotores','tiendas','superiores',
    'ventas','ventas_items','eventos',
    'formularios','cumplimientos_form',
    'reuniones','puntos_clave',
    'objetivos','check_items','historial_objetivos',
    'reportes_incidencia','incidencia_items',
    'gastos','configuracion_usuario'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "RLS_%I_select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id);', t, t);
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "RLS_%I_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);', t, t);
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "RLS_%I_update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);', t, t);
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "RLS_%I_delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id);', t, t);
  END LOOP;
END $$;

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_inventario_uid ON public.inventario_pixel(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_uid ON public.ventas(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_items_venta ON public.ventas_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_eventos_venta ON public.eventos(venta_id);
CREATE INDEX IF NOT EXISTS idx_puntos_clave_reunion ON public.puntos_clave(reunion_id);
CREATE INDEX IF NOT EXISTS idx_check_items_objetivo ON public.check_items(objetivo_id);
CREATE INDEX IF NOT EXISTS idx_incidencia_reporte ON public.incidencia_items(reporte_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON public.gastos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_reuniones_fecha ON public.reuniones(fecha DESC);
