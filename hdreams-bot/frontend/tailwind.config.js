export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:           '#0F172A',
        surface:      '#1E293B',
        surfaceHover: '#263348',
        border:       '#334155',
        primary:      '#0EA5E9',
        primaryHover: '#0284C7',
        success:      '#22C55E',
        warning:      '#F59E0B',
        danger:       '#EF4444',
        info:         '#3B82F6',
        urgente:      '#DC2626',
        alta:         '#EA580C',
        media:        '#2563EB',
        baja:         '#64748B',
        text:         '#F1F5F9',
        textMuted:    '#94A3B8',
        textSubtle:   '#64748B',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'count-up':   'countUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:   { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        countUp:   { '0%': { transform: 'translateY(4px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
}
