/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // The client's brand, from their posters: navy and royal blue, with the green of the logo's leaves.
      // The storefront around it follows the big Indian marketplaces: a grey canvas under white panels,
      // yellow "Add to cart" and orange "Buy now" buttons, and green for discounts and ratings.
      colors: {
        navy: { DEFAULT: '#0c2b66', dark: '#081f4d' },
        brand: { DEFAULT: '#1558c0', dark: '#0f4499', soft: '#eaf1fb' },
        leaf: { DEFAULT: '#0f7a5f', soft: '#e5f3ee' },
        canvas: '#f1f3f6',
        cart: { DEFAULT: '#ffd814', dark: '#f7ca00' },
        buy: { DEFAULT: '#ffa41c', dark: '#fa8900' },
        deal: '#047857',
        whatsapp: '#1da851',
      },
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        logo: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
