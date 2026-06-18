import { motion } from 'framer-motion';

const PRIORIDAD_STYLES = {
  urgente: 'bg-urgente/15 text-urgente border border-urgente/30',
  alta:    'bg-alta/15 text-alta border border-alta/30',
  media:   'bg-media/15 text-media border border-media/30',
  baja:    'bg-baja/15 text-baja border border-baja/30',
};

const ESTADO_STYLES = {
  nuevo:      'bg-info/15 text-info border border-info/30',
  en_proceso: 'bg-warning/15 text-warning border border-warning/30',
  calificado: 'bg-success/15 text-success border border-success/30',
  descartado: 'bg-danger/15 text-danger border border-danger/30',
  contratado: 'bg-primary/15 text-primary border border-primary/30',
};

const LABEL_MAP = {
  urgente:    'Urgente',
  alta:       'Alta',
  media:      'Media',
  baja:       'Baja',
  nuevo:      'Nuevo',
  en_proceso: 'En proceso',
  calificado: 'Calificado',
  descartado: 'Descartado',
  contratado: 'Contratado',
};

const DOT_COLORS = {
  urgente:    'bg-urgente',
  alta:       'bg-alta',
  media:      'bg-media',
  baja:       'bg-baja',
  nuevo:      'bg-info',
  en_proceso: 'bg-warning',
  calificado: 'bg-success',
  descartado: 'bg-danger',
  contratado: 'bg-primary',
};

export const Badge = ({ value, type = 'prioridad', pulse = false, className = '' }) => {
  const styles =
    type === 'prioridad'
      ? PRIORIDAD_STYLES[value] ?? 'bg-baja/15 text-baja border border-baja/30'
      : ESTADO_STYLES[value] ?? 'bg-baja/15 text-baja border border-baja/30';

  const label = LABEL_MAP[value] ?? value;
  const dot = DOT_COLORS[value] ?? 'bg-baja';

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium font-sans',
        styles,
        className,
      ].join(' ')}
    >
      <span
        className={[
          'w-1.5 h-1.5 rounded-full shrink-0',
          dot,
          pulse && value === 'urgente' ? 'animate-pulse-soft' : '',
        ].join(' ')}
      />
      {label}
    </motion.span>
  );
};
