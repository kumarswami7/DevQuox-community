/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '320px',
      'sm': '480px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#dc2626', // Devquox Signature Red (Matching Logo Swoosh)
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a', // Secondary #0F172A
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Accent #14B8A6
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        bgLight: '#F8FAFC',
        bgDark: '#080C14',
        cardDark: '#0F1626',
        cardDarkBorder: '#1E293B',
      },
      borderRadius: {
        'custom': '16px',
        '2custom': '20px',
        '3custom': '24px',
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(220, 38, 38, 0.35)',
        'glow-accent': '0 0 25px -5px rgba(20, 184, 166, 0.30)',
        'glow-subtle': '0 0 35px -5px rgba(220, 38, 38, 0.12)',
        'card-hover': '0 12px 30px -8px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
