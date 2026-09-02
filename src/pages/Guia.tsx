import { Card, Badge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { configApi } from '../lib/api';
import { useEffect, useState } from 'react';
import { tsmDeZona } from '../lib/business';
import { escapeHtml } from '../lib/utils';

/**
 * Página estática de la guía del promotor. El contenido es fijo y constantes
 * del código (no proviene de la BD), por lo que no presenta riesgo XSS.
 */
export function Guia() {
  const uid = useAuth().user?.id ?? null;
  const [zona, setZona] = useState('Otra');

  useEffect(() => {
    if (!uid) return;
    configApi.get(uid).then((c) => c?.zona && setZona(c.zona));
  }, [uid]);

  const tsm = tsmDeZona(zona);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 font-[Google_Sans]">Guía / Pautas del Promotor</h1>
        <p className="text-sm text-zinc-500">Resumen de KPIs, requisitos, penalizaciones y contactos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="KPIs y cumplimiento">
          <ul className="space-y-2 text-xs text-zinc-300">
            <li className="flex justify-between"><span>Objetivo de ventas</span><Badge color="blue">60% como mínimo</Badge></li>
            <li className="flex justify-between"><span>Variable por cumplimiento</span><Badge color="green">90%</Badge></li>
            <li className="flex justify-between"><span>Reporte Aracne</span><Badge color="amber">80%</Badge></li>
          </ul>
          <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[0.7rem] text-zinc-400">
            El incumplimiento sostenido de los KPIs puede derivar en penalizaciones sobre la parte variable.
          </div>
        </Card>

        <Card title="Feedback semanal">
          <ul className="space-y-1.5 text-xs text-zinc-300">
            <li>• Enviar antes del <span className="font-semibold text-zinc-100">lunes a las 12:00h</span></li>
            <li>• Con copia (CC) a <span className="text-zinc-200">Isabel M.</span>, <span className="text-zinc-200">Sandra R.</span> y tu TSM</li>
            <li>• Incluir ventas de la semana, incidencias y objetivos</li>
          </ul>
        </Card>

        <Card title="Videollamadas de los lunes">
          <ul className="space-y-1.5 text-xs text-zinc-300">
            <li>• <span className="font-semibold text-zinc-100">10:00 – 10:45</span> · Videollamada semanal de equipo</li>
            <li>• <span className="font-semibold text-zinc-100">10:45 – 11:00</span> · Reunión con el TSM</li>
            <li>• Registrar en el módulo "Reuniones"</li>
          </ul>
        </Card>

        <Card title="Incidencias → TSM">
          <p className="text-xs text-zinc-300">
            Las incidencias deben registrarse en el módulo de Incidencias. El informe mensual se envía al TSM de tu zona:
          </p>
          <div className="mt-2"><Badge color="blue">{escapeHtml(tsm)}</Badge></div>
        </Card>

        <Card title="Tickelia · Normas de gastos">
          <ul className="space-y-1.5 text-xs text-zinc-300">
            <li>• Máximo <span className="font-semibold text-zinc-100">11€</span> en comidas (solo sábados)</li>
            <li>• Requiere ticket justificante</li>
            <li>• CIF: <span className="font-mono text-zinc-200">B82738675</span></li>
            <li>• Proyecto: <span className="font-semibold text-zinc-100">GOOGLE GEMS</span></li>
            <li>• Sodexo: 40h → 30€ · 24h → 18€</li>
            <li>• Límite de reporte: <span className="font-semibold text-zinc-100">día 19 antes de las 12:00h</span></li>
          </ul>
        </Card>

        <Card title="Contactos del equipo" actions={<Badge color="gray">ES</Badge>}>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-400">Coordinadora</span><span className="text-zinc-200">Isabel M.</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Supervisora</span><span className="text-zinc-200">Sandra R.</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Tu TSM</span><span className="text-zinc-200">{escapeHtml(tsm)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">BackOffice</span><span className="text-zinc-200">BackOffice ES</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
