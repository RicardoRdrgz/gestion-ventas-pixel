import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ventaApi, configApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Card, Spinner } from './ui';
import { calcularProgresoVentas } from '../lib/business';
import { Target } from 'lucide-react';

function Barra({ vendidas, objetivo, pct, color }: { vendidas: number; objetivo: number; pct: number; color: string }) {
  const hecha = objetivo > 0 && pct >= 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[0.7rem] text-zinc-500">{vendidas} / {objetivo} dispositivos</span>
        <span className={`text-xs font-semibold ${hecha ? 'text-emerald-400' : 'text-zinc-200'}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export function VentasGoalCard() {
  const uid = useAuth().user?.id ?? null;
  const [progress, setProgress] = useState<ReturnType<typeof calcularProgresoVentas> | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [ventas, config] = await Promise.all([ventaApi.list(uid), configApi.get(uid)]);
        let items: any[] = [];
        if (ventas.length > 0) {
          const ids = ventas.map((v) => v.id);
          const { data } = await supabase.from('ventas_items').select('*').eq('user_id', uid).in('venta_id', ids);
          items = (data ?? []) as any[];
        }
        setProgress(calcularProgresoVentas(ventas as any, items as any, {
          semanal: config?.objetivo_semanal,
          mensual: config?.objetivo_mensual,
        }));
        if (!config?.objetivo_semanal && !config?.objetivo_mensual) setEmpty(true);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [uid]);

  if (!progress) return <Spinner label="Cargando objetivo…" />;
  if (empty) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Target className="w-4 h-4 text-violet-400" />
          Configura tu objetivo de ventas (semanal/mensual) en Ajustes para ver el progreso aquí.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Objetivo de ventas" actions={<Target className="w-4 h-4 text-violet-400" />}>
      <div className="space-y-4">
        <Barra
          color={progress.semanal.pct >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}
          vendidas={progress.semanal.vendidas}
          objetivo={progress.semanal.objetivo}
          pct={progress.semanal.pct}
        />
        <div className="text-[0.65rem] text-zinc-500 -mt-2">Semana actual (lunes-domingo)</div>
        <Barra
          color={progress.mensual.pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}
          vendidas={progress.mensual.vendidas}
          objetivo={progress.mensual.objetivo}
          pct={progress.mensual.pct}
        />
        <div className="text-[0.65rem] text-zinc-500 -mt-2">Mes actual</div>
      </div>
    </Card>
  );
}
