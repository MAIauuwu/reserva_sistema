import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pastel-light': '#F0F8FF',
        'pastel-primary': '#B0E0E6',
        'pastel-secondary': '#F0FFF0',
        'pastel-accent': '#FFDAB9',
        'pastel-dark': '#4A5568',
        'action-danger': '#FF6347',
      },
    },
  },
  plugins: [],
};
export default config;
