/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          chase: '#1A1F71',
          amex: '#007BC1',
          discover: '#FF6600',
          wellsfargo: '#D71E28',
          capitalone: '#D03027',
          citi: '#003A6C',
          boa: '#012169',
          usbank: '#D01F3C',
          redstone: '#C41230',
          navy: '#003F87',
          penfed: '#003082',
          apple: '#555555',
          target: '#CC0000',
          costco: '#005DAA',
          amazon: '#FF9900',
          bilt: '#1C1C1E',
          fidelity: '#327A45',
          southwest: '#304CB2',
          delta: '#003366',
          united: '#005DAA',
          marriott: '#8B1A3D',
          hyatt: '#7B3F00',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      }
    },
  },
  plugins: [],
}
