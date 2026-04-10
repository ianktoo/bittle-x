import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        fun: {
          bg: '#000000', // Black
          card: '#18181b', // Zinc 900
          primary: '#FACC15', // Yellow 400
          secondary: '#FFFFFF', // White
          accent: '#27272a', // Zinc 800
          success: '#bef264', // Lime
          danger: '#ef4444', // Red
          text: '#ffffff',
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
