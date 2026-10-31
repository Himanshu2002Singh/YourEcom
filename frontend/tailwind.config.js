/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // The client's brand, from their posters: navy and royal blue, with the green of the logo's leaves.
      colors: {
        navy: { DEFAULT: '#0c2b66', dark: '#081f4d' },
        brand: { DEFAULT: '#1558c0', dark: '#0f4499', soft: '#eaf1fb' },
        leaf: { DEFAULT: '#0f7a5f', soft: '#e5f3ee' },
        whatsapp: '#1da851',
      },
      fontFamily: {
        display: ['Poppins', 'DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
