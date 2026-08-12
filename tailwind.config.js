/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // Kleine telefoons hebben naast het logo geen ruimte voor twee knoppen.
        xs: '420px',
      },
    },
  },
  plugins: [],
};
