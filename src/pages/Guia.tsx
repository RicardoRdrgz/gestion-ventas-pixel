import { Card, Badge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { configApi } from '../lib/api';
import { useEffect, useState } from 'react';
import { tsmDeZona } from '../lib/business';
import { escapeHtml } from '../lib/utils';

/**
 * Página estática de la guía del promotor (contenido 2026). El contenido es fijo
 * y constante del código, por lo que no presenta riesgo XSS.
 */
export function Guia() {
  const uid = useAuth().user?.id ?? null;
  const [zona, setZona] = useState('Otra');

  useEffect(() => {
    if (!uid) return;
    configApi.get(uid).then((c) => c?.zona && setZona(c.zona));
  }, [uid]);

  const tsm = tsmDeZona(zona);

  const requisitos = [
    { label: 'Reporte', detalle: 'Reporte de ventas diario en Aracne (ventas y stock)' },
    { label: 'Participación', detalle: 'Asistencia obligatoria a las CALL' },
    { label: 'Tienda', detalle: 'Mantenimiento Pixel Table / Inline, demos y cartelería (estado operativo constante)' },
    { label: 'Uniforme', detalle: 'Uniforme obligatorio en sala de ventas' },
    { label: 'Dispositivo Pixel', detalle: 'Uso exclusivo en sala de ventas' },
    { label: 'Continuidad', detalle: 'Compromiso y continuidad en el proyecto' },
    { label: 'Penalización', detalle: 'Baja voluntaria / NSPP → 0% parte variable' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Guía / Pautas del Promotor 2026</h1>
        <p className="text-sm text-zinc-500">Resumen de KPIs, requisitos, mecánica de trabajo y contactos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="KPIs y cumplimiento">
          <ul className="space-y-2 text-xs text-zinc-300">
            <li className="flex justify-between items-center"><span>Cumplimiento mínimo del target</span><Badge color="blue">60%</Badge></li>
            <li className="flex justify-between items-center"><span>Ventas oficiales reportadas por el promotor</span><Badge color="amber">80%</Badge></li>
            <li className="flex justify-between items-center"><span>Variable si target conseguido</span><Badge color="green">90%</Badge></li>
            <li className="flex justify-between items-center"><span>Parte variable adicional</span><Badge color="green">10%</Badge></li>
          </ul>
          <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[0.7rem] text-zinc-400">
            El reporte de ventas en Aracne es obligatorio para acceder a la parte variable/incentivo.
            Sin reporte y sin un correcto check-in/out no existe comprobación del desempeño.
          </div>
        </Card>

        <Card title="Requisitos obligatorios">
          <ul className="space-y-2 text-xs text-zinc-300">
            {requisitos.map((r) => (
              <li key={r.label} className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/60">
                <span className="font-semibold text-zinc-100">{r.label}:</span>{' '}
                <span className="text-zinc-400">{r.detalle}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Videollamadas de los lunes">
          <ul className="space-y-1.5 text-xs text-zinc-300">
            <li>• <span className="font-semibold text-zinc-100">10:00 – 10:45</span> · Videollamada semanal de equipo</li>
            <li>• <span className="font-semibold text-zinc-100">10:45 – 11:00</span> · Reunión con el TSM</li>
            <li>• Registrar y acceder desde el módulo "Reuniones"</li>
          </ul>
        </Card>

        <Card title="Incidencias → TSM">
          <p className="text-xs text-zinc-300">
            Las incidencias deben registrarse en el módulo de Incidencias. El informe mensual se envía al TSM de tu zona:
          </p>
          <div className="mt-2"><Badge color="blue">{escapeHtml(tsm)}</Badge></div>
        </Card>

        <Card title="Mecánica de trabajo · Aracne">
          <ul className="space-y-1.5 text-xs text-zinc-300">
            <li>• <span className="font-semibold text-zinc-100">Check-in</span> desde el PDV al llegar a tienda (ubicación por la app Aracne)</li>
            <li>• <span className="font-semibold text-zinc-100">Check-out</span> desde el PDV al finalizar la jornada</li>
            <li>• <span className="font-semibold text-zinc-100">Reporte de ventas</span> y reporte de incidencias (formularios obligatorios diarios)</li>
            <li>• Notificaciones: Info Sheet + promociones activas MSH & ECI mediante Aracne</li>
            <li className="text-zinc-400">Consulta de tu horario mensual y planificación de tienda vía Aracne.</li>
          </ul>
        </Card>

        <Card title="Uniforme y dispositivo">
          <ul className="space-y-1.5 text-xs text-zinc-300">
            <li>• Parte superior: camiseta oficial Pixel (obligatoria) y sudadera oficial para climas fríos</li>
            <li>• Parte inferior: pantalón vaquero azul oscuro o negro, liso y sin roturas</li>
            <li>• Calzado: zapatillas deportivas limpias, blancas o negras</li>
            <li>• Dispositivo en cesión: <span className="text-zinc-100 font-semibold">Pixel 9 Pro XL</span> o <span className="text-zinc-100 font-semibold">Pixel 10 Pro XL</span> para uso activo en tienda</li>
          </ul>
        </Card>

        <Card title="Tickelia / Sodexo · Normas de gastos" className="lg:col-span-2">
          <ul className="space-y-1.5 text-xs text-zinc-300">
            <li>• Dietas: <span className="font-semibold text-zinc-100">11€ máx.</span> (solo sábados)</li>
            <li>• Tickets válidos deben incluir: CIF de la empresa, fecha, nº de ticket e importe total. No se aceptan tickets de supermercados (DIA, Carrefour, Primaprix…)</li>
            <li>• App Tickelia: CIF <span className="font-mono text-zinc-200">B82738675</span>, usuario y contraseña inicial = vuestro DNI, empresa <span className="text-zinc-100 font-semibold">SALESLAND S.L.</span></li>
            <li>• Tipos de gasto: RESTAURANTE, TAXI/METRO y OTROS GASTOS (autorizados)</li>
            <li>• Proyecto en todos los gastos e informes: <span className="text-zinc-100 font-semibold">GOOGLE GEMS</span></li>
            <li>• Sodexo (ECI): 40h → <span className="text-zinc-100 font-semibold">30€</span> · 24h → <span className="text-zinc-100 font-semibold">18€</span></li>
            <li>• Límite de reporte de informes: <span className="text-zinc-100 font-semibold">día 19 de cada mes antes de las 12:00h</span>. Si no se envía en plazo, los gastos no se abonan.</li>
          </ul>
        </Card>

        <Card title="Contactos del equipo" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <Contacto puesto="KAM" nombre="Julia Cuenca" email="juliacuenca@gem-salesland.net" telefono="" />
            <Contacto puesto="Coordinadora nacional" nombre="Isabel Hoyas" email="isabelhoyas@gem.salesland.net" telefono="634 78 23 53" />
            <Contacto puesto="Backoffice" nombre="Noemí González" email="noemiares@gem.salesland.net" telefono="661 687 902" />
            <Contacto puesto="Team Leader" nombre="Manuel Benajes" email="manuelbenajes@gem.salesland.net" telefono="692 025 411" />
            <Contacto puesto="Project Manager" nombre="Alex Osaba" email="alejandromosaba@gem.salesland.net" telefono="692 098 690" />
            <Contacto puesto="Supervisora nacional" nombre="Carlos Mendez" email="supervision@gem.salesland.net" telefono="664 550 444" />
            <Contacto puesto="Tu TSM" nombre={tsm} email="" telefono="" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Contacto({ puesto, nombre, email, telefono }: { puesto: string; nombre: string; email: string; telefono: string }) {
  return (
    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/60">
      <div className="flex justify-between items-center">
        <span className="text-zinc-400">{puesto}</span>
        <span className="text-zinc-100 font-semibold">{escapeHtml(nombre)}</span>
      </div>
      {email && <div className="text-[0.7rem] text-zinc-500 truncate">{escapeHtml(email)}</div>}
      {telefono && (
        <div className="flex items-center justify-between mt-0.5 text-[0.7rem]">
          <span className="text-zinc-500">Telf.</span>
          <span className="text-zinc-300">{escapeHtml(telefono)}</span>
        </div>
      )}
    </div>
  );
}
