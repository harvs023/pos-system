/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0F1D2E',        // deep navy - headers, primary text
        slate: {
          850: '#16232F',
        },
        peso: {
          50: '#EAF7F1',
          100: '#CFEEE0',
          400: '#2FAE7A',
          500: '#1E9469',        // primary action green (money/success)
          600: '#167A55',
          700: '#0F5F42',
        },
        amber: {
          500: '#E8A23D',        // accent - warnings / GCash-adjacent
        },
        gcash: '#0071CE',        // GCash brand blue (for badges only)
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15,29,46,0.06), 0 8px 24px rgba(15,29,46,0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
