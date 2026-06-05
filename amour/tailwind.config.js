/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { bg: '#0d0118', surface: '#1a0533', card: '#1e0a3c', pink: '#e91e8c', 'pink-light': '#ff6ab0', purple: '#9b59b6', 'purple-deep': '#6c3483', gold: '#f39c12', muted: '#8b6fa8' },
      fontFamily: { display: ['Playfair Display', 'serif'], sans: ['DM Sans', 'sans-serif'] },
      animation: { float: 'float 6s ease-in-out infinite', heartbeat: 'heartbeat 1.5s ease-in-out infinite', pulseGlow: 'pulse 2s ease infinite' },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0) rotate(0)' }, '50%': { transform: 'translateY(-12px) rotate(3deg)' } },
        heartbeat: { '0%,100%': { transform: 'scale(1)' }, '25%': { transform: 'scale(1.15)' }, '40%': { transform: 'scale(1)' }, '60%': { transform: 'scale(1.1)' } }
      }
    }
  },
  plugins: []
}
