import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = parseFloat(target) || 0;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

export const Metric = ({
  label,
  value,
  suffix = '',
  prefix = '',
  trend,
  trendLabel,
  icon: Icon,
  delay = 0,
}) => {
  const counted = useCountUp(value);
  const positive = trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium font-sans text-textMuted">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon size={16} />
          </span>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="font-display text-3xl font-bold text-text tracking-tight">
          {prefix}{counted}{suffix}
        </span>
        {trend !== undefined && (
          <span
            className={[
              'text-xs font-medium mb-1 px-1.5 py-0.5 rounded',
              positive
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger',
            ].join(' ')}
          >
            {positive ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      {trendLabel && (
        <p className="text-2xs text-textSubtle font-sans">{trendLabel}</p>
      )}
    </motion.div>
  );
};
