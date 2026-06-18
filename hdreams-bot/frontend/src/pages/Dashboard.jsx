import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js';
import { Users, CheckCircle, Clock, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Badge } from '../components/ui/Badge';
import { fetchKPIs, fetchCola, fetchKPIHoras } from '../lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// -------------------------------------------------------
// KPIGrid — 6 métricas top
// -------------------------------------------------------
function KPIGrid({ t }) {
  const metrics = [
    { label: 'Leads totales',    value: t?.total ?? 0,             icon: Users,         trend: 12,  trendLabel: 'vs. semana anterior' },
    { label: 'Calificados',      value: t?.calificados ?? 0,       icon: CheckCircle,   trend: 8,   trendLabel: `de ${t?.total ?? 0} recibidos` },
    { label: 'Entrevistas',      value: t?.entrevistas_agendadas ?? 0, icon: Clock,     trend: 5,   trendLabel: 'agendadas este periodo' },
    { label: 'Contratados',      value: t?.contratados ?? 0,       icon: TrendingUp,   trend: 15,  trendLabel: 'cierre exitoso' },
    { label: 'Score candidato',  value: t?.score_candidato_avg ?? 0, icon: AlertTriangle, trend: 3, trendLabel: 'promedio IA', suffix: '/100', decimals: 1 },
    { label: 'T. respuesta',     value: t?.tiempo_respuesta_avg ?? 0, icon: MessageSquare, trend: -8, trendLabel: 'segundos promedio', suffix: 's' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((m, i) => (
        <Metric key={m.label} {...m} delay={i * 0.06} />
      ))}
    </div>
  );
}

// -------------------------------------------------------
// HoursChart — barras por hora
// -------------------------------------------------------
function HoursChart({ horas, canal }) {
  const labels   = Array.from({ length: 24 }, (_, i) => `${i}h`);
  const horaMap  = Object.fromEntries((horas ?? []).map((h) => [h.hora, h.leads]));
  const data     = labels.map((_, i) => horaMap[i] ?? 0);

  return (
    <Card delay={0.3}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-text">Leads por hora</h3>
        {canal && <Badge value={canal} />}
      </div>
      <div style={{ height: 160 }}>
        <Bar
          data={{
            labels,
            datasets: [{
              data,
              backgroundColor:      '#0EA5E9',
              hoverBackgroundColor: '#0284C7',
              borderRadius: 3,
              borderSkipped: false,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: '#334155' }, ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10 } } },
              y: { grid: { color: '#334155' }, ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10 }, stepSize: 1 }, beginAtZero: true },
            },
          }}
        />
      </div>
    </Card>
  );
}

// -------------------------------------------------------
// PrioridadChart — dona
// -------------------------------------------------------
function PrioridadChart({ data }) {
  const colores = { urgente: '#DC2626', alta: '#EA580C', media: '#2563EB', baja: '#64748B' };
  const items   = data ?? [];

  return (
    <Card delay={0.35}>
      <h3 className="font-display text-sm font-semibold text-text mb-4">Por prioridad</h3>
      {items.length ? (
        <div style={{ height: 140 }}>
          <Doughnut
            data={{
              labels:   items.map((i) => i.prioridad),
              datasets: [{
                data:            items.map((i) => i.total),
                backgroundColor: items.map((i) => colores[i.prioridad] ?? '#64748B'),
                borderWidth: 0,
                hoverOffset: 4,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '68%',
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      ) : (
        <p className="text-textMuted text-sm text-center py-8">Sin datos</p>
      )}
      <ul className="mt-3 space-y-1">
        {items.map((i) => (
          <li key={i.prioridad} className="flex items-center justify-between">
            <Badge value={i.prioridad} />
            <span className="text-sm font-mono text-textMuted">{i.total}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// -------------------------------------------------------
// LeadQueue — cola priorizada
// -------------------------------------------------------
function LeadQueue({ leads }) {
  if (!leads?.length) {
    return (
      <Card delay={0.4}>
        <p className="text-textMuted text-sm text-center py-10">Sin leads pendientes</p>
      </Card>
    );
  }

  return (
    <Card delay={0.4} className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-text">Cola de leads</h3>
        <span className="text-xs text-textMuted">{leads.length} pendientes</span>
      </div>
      <ul className="divide-y divide-border max-h-80 overflow-y-auto">
        {leads.map((lead) => (
          <li key={lead.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surfaceHover transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {(lead.nombre ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{lead.nombre ?? 'Sin nombre'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge value={lead.canal} showDot={false} />
                <span className="text-xs text-textMuted truncate">{lead.seccion}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge value={lead.prioridad} />
              {lead.score_ia_candidato > 0 && (
                <span className="text-xs text-textMuted font-mono">{lead.score_ia_candidato}/100</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// -------------------------------------------------------
// CanalStats
// -------------------------------------------------------
function CanalStats({ canales }) {
  if (!canales?.length) return null;
  return (
    <Card delay={0.45}>
      <h3 className="font-display text-sm font-semibold text-text mb-4">Leads por canal</h3>
      <ul className="space-y-3">
        {canales.map((c) => {
          const pct = canales[0]?.total ? Math.round((c.total / canales[0].total) * 100) : 0;
          return (
            <li key={c.canal}>
              <div className="flex items-center justify-between mb-1">
                <Badge value={c.canal} />
                <span className="text-xs text-textMuted font-mono">{c.total} leads</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// -------------------------------------------------------
// Dashboard
// -------------------------------------------------------
const CANALES = ['todos','whatsapp','messenger','instagram','facebook'];

export default function Dashboard({ empresaId = 1 }) {
  const hoy      = new Date().toISOString().slice(0, 10);
  const mesInicio = hoy.slice(0, 8) + '01';
  const [canal, setCanal] = useState(null);

  const { data: kpis, isLoading } = useQuery({
    queryKey:       ['kpis', empresaId, canal],
    queryFn:        () => fetchKPIs({ empresa_id: empresaId, desde: mesInicio, hasta: hoy, ...(canal ? { canal } : {}) }),
    refetchInterval: 60_000,
  });

  const { data: cola } = useQuery({
    queryKey:       ['cola', empresaId],
    queryFn:        () => fetchCola({ empresa_id: empresaId, limite: 20 }),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-bg z-10">
        <div>
          <h1 className="font-display text-lg font-bold text-text">HDreams</h1>
          <p className="text-xs text-textMuted">Panel de reclutamiento · {hoy}</p>
        </div>

        {/* Filtro canal */}
        <div className="flex items-center gap-2">
          {CANALES.map((c) => (
            <button
              key={c}
              onClick={() => setCanal(c === 'todos' ? null : c)}
              className={[
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                (canal === c || (c === 'todos' && !canal))
                  ? 'bg-primary text-white'
                  : 'bg-surface text-textMuted hover:text-text border border-border',
              ].join(' ')}
            >
              {c === 'todos' ? 'Todos' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
        <KPIGrid t={kpis?.totales} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HoursChart horas={kpis?.por_hora} canal={canal} />
          </div>
          <PrioridadChart data={kpis?.por_prioridad} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LeadQueue leads={cola?.leads} />
          </div>
          <CanalStats canales={kpis?.por_canal} />
        </div>
      </main>
    </div>
  );
}
