/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
      },
      animation: {
        'scale': 'scale 0.15s ease-in-out',
      },
      keyframes: {
        scale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
        },
      },
    },
  },
  plugins: [],
}