import { Users, MessageSquare, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Metric } from '../ui/Metric';

export const KPIGrid = ({ data }) => {
  const d = data ?? {};

  const metrics = [
    {
      label:      'Mensajes recibidos',
      value:      d.mensajes    ?? 0,
      icon:       MessageSquare,
      delay:      0,
    },
    {
      label:      'Leads nuevos',
      value:      d.leads       ?? 0,
      icon:       Users,
      delay:      0.06,
    },
    {
      label:      'Leads calificados',
      value:      d.calificados ?? 0,
      icon:       CheckCircle,
      delay:      0.12,
    },
    {
      label:      'T. respuesta',
      value:      Math.round(d.tiempo ?? 0),
      suffix:     's',
      icon:       Clock,
      delay:      0.18,
    },
    {
      label:      'Conversión',
      value:      parseFloat(d.conversion ?? 0),
      suffix:     '%',
      decimals:   1,
      icon:       TrendingUp,
      delay:      0.24,
    },
    {
      label:      'Score IA promedio',
      value:      parseFloat(d.score_avg ?? 0),
      suffix:     '/100',
      decimals:   1,
      icon:       AlertTriangle,
      delay:      0.30,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((m) => (
        <Metric key={m.label} {...m} />
      ))}
    </div>
  );
};
