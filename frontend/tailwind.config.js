/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          850: '#1a1a2e',
          950: '#0d0d1a',
        },
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-body': '#d1d5db',
            '--tw-prose-headings': '#f9fafb',
            '--tw-prose-code': '#f9fafb',
          },
        },
      },
    },
  },
  plugins: [],
};
