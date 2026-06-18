import { motion } from 'framer-motion';
export const Card = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
};
