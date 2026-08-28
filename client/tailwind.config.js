/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        foreground: '#F8FAFC',
        card: '#1E293B',
        'card-foreground': '#F8FAFC',
        muted: '#334155',
        'muted-foreground': '#94A3B8',
        border: '#334155',
        primary: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          foreground: '#0F172A',
        },
        secondary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 20px -5px rgba(245, 158, 11, 0.3)',
        'glow-accent': '0 0 20px -5px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [],
}
