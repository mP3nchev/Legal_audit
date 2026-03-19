/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CraftPolicy brand palette
        'cp-blue':    'hsl(220 90% 50%)',
        'cp-success': 'hsl(142 72% 42%)',
        'cp-warning': 'hsl(38 92% 50%)',
        'cp-error':   'hsl(0 84% 52%)',
      },
    },
  },
  plugins: [],
};
