﻿/** @type {import('tailwindcss').Config} */
import lineClamp from '@tailwindcss/line-clamp';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Animações
      keyframes: {
        slideDown: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '500px', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.3s ease-out forwards',
        fadeIn: 'fadeIn 0.4s ease-out forwards',
        fadeOut: 'fadeOut 0.3s ease-in forwards',
      },
    },
  },
  plugins: [
    // Opcional: útil se quiser usar line-clamp util (ex.: line-clamp-3)
    lineClamp,
  ],
};