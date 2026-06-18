import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Metric } from '../components/ui/Metric';
import { Badge } from '../components/ui/Badge';
import { fetchKPIs, fetchCola } from '../lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// -------------------------------------------------------
// KPIGrid
// -------------------------------------------------------
function KPIGrid({ totales }) {
  const metrics = [
    {
      label: 'Leads totales',
      value: totales?.total ?? 0,
      icon: Users,
      trend: 12,
      trendLabel: 'vs. semana anterior',
    },
    {
      label: 'Calificados',
      value: totales?.calificados ?? 0,
      icon: CheckCircle,
      trend: 8,
      trendLabel: `de ${totales?.total ?? 0} recibidos`,
    },
    {
      label: 'En proceso',
      value: totales?.en_proceso ?? 0,
      icon: Clock,
      trend: -3,
      trendLabel: 'pendientes de seguimiento',
    },
    {
      label: 'Score promedio',
      value: totales?.score_candidato_avg ?? 0,
      icon: TrendingUp,
      suffix: '/100',
      trend: 5,
      trendLabel: 'calidad del candidato',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <Metric key={m.label} {...m} delay={i * 0.08} />
      ))}
    </div>
  );
}

// -------------------------------------------------------
// HoursChart
// -------------------------------------------------------
function HoursChart({ horas }) {
  const labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
  const horaMap = Object.fromEntries((horas ?? []).map((h) => [h.hora, h.leads]));
  const data = labels.map((_, i) => horaMap[i] ?? 0);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: '#0EA5E9',
        hoverBackgroundColor: '#0284C7',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
    scales: {
      x: {
        grid: { color: '#334155' },
        ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: '#334155' },
        ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 }, stepSize: 1 },
        beginAtZero: true,
      },
    },
  };

  return (
    <Card delay={0.2}>
      <h3 className="font-display text-sm font-semibold text-textMuted mb-4">
        Leads por hora del día
      </h3>
      <div style={{ height: 180 }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}

// -------------------------------------------------------
// LeadQueue
// -------------------------------------------------------
function LeadQueue({ leads }) {
  if (!leads?.length) {
    return (
      <Card delay={0.3}>
        <p className="text-textMuted text-sm text-center py-8">
          Sin leads pendientes
        </p>
      </Card>
    );
  }

  return (
    <Card delay={0.3} className="p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-display text-sm font-semibold text-text">
          Cola de leads
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {leads.map((lead) => (
          <li
            key={lead.id}
            className="flex items-center gap-4 px-6 py-3 hover:bg-surfaceHover transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {(lead.nombre ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {lead.nombre ?? 'Sin nombre'}
              </p>
              <p className="text-xs text-textMuted truncate">
                {lead.ciudad ?? '—'} · {lead.seccion}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lead.score_ia_candidato && (
                <span className="text-xs text-textMuted font-mono">
                  {lead.score_ia_candidato}
                </span>
              )}
              <Badge value={lead.prioridad} type="prioridad" pulse />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// -------------------------------------------------------
// Dashboard
// -------------------------------------------------------
export default function Dashboard({ empresaId = 1 }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const mesInicio = hoy.slice(0, 8) + '01';

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ['kpis', empresaId],
    queryFn: () => fetchKPIs({ empresa_id: empresaId, desde: mesInicio, hasta: hoy }),
    refetchInterval: 60_000,
  });

  const { data: cola, isLoading: loadingCola } = useQuery({
    queryKey: ['cola', empresaId],
    queryFn: () => fetchCola({ empresa_id: empresaId, limite: 15 }),
    refetchInterval: 30_000,
  });

  if (loadingKpis) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-text">HDreams</h1>
          <p className="text-xs text-textMuted">Panel de reclutamiento</p>
        </div>
        <Badge value="urgente" type="prioridad" pulse />
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <KPIGrid totales={kpis?.totales} />

        <div className="grid lg:grid-cols-2 gap-6">
          <HoursChart horas={kpis?.por_hora} />
          <LeadQueue leads={loadingCola ? [] : cola?.leads} />
        </div>
      </main>
    </div>
  );
}
