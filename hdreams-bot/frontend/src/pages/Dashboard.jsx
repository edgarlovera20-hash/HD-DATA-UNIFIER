import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { KPIGrid }    from '../components/dashboard/KPIGrid';
import { HoursChart } from '../components/dashboard/HoursChart';
import { LeadQueue }  from '../components/dashboard/LeadQueue';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api' });

export default function Dashboard({ empresaId = 1, seccionId = 1 }) {
  const params = { empresa_id: empresaId, seccion_id: seccionId };

  const { data: kpis, isLoading } = useQuery({
    queryKey:       ['kpis', empresaId, seccionId],
    queryFn:        () => api.get('/kpis', { params }).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: horasPico } = useQuery({
    queryKey: ['horas-pico', empresaId, seccionId],
    queryFn:  () => api.get('/kpis/horas-pico', { params }).then((r) => r.data),
    refetchInterval: 300_000,
  });

  const { data: cola } = useQuery({
    queryKey:       ['cola', empresaId],
    queryFn:        () => api.get('/kpis/cola', { params: { empresa_id: empresaId, limite: 20 } }).then((r) => r.data?.leads ?? r.data),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-textMuted">Métricas en tiempo real · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <KPIGrid data={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HoursChart data={horasPico ?? []} />
        <LeadQueue  leads={Array.isArray(cola) ? cola : []} />
      </div>
    </div>
  );
}
