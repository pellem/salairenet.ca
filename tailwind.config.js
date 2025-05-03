module.exports = {
  content: [
    "./src/**/*.{astro,js,ts,jsx,tsx,html}",
    "./public/**/*.html",
  ],
  safelist: [
    "text-green-700",
    "text-red-700",
    "font-bold",
    "font-semibold",
    "bg-gradient-to-r",
    "from-patente-primary",
    "to-patente-accent",
    "text-patente-primary",
    "text-patente-accent",
    "bg-patente-primary",
    "bg-patente-accent"
  ],
  theme: {
    extend: {
      colors: {
        patente: {
          primary: '#0F172A',       // bleu nuit stylé
          secondary: '#FACC15',     // jaune Patente
          accent: '#10B981',        // vert doux
        },
        'patente-primary': '#0F172A',
        'patente-accent': '#10B981',
        'patente-secondary': '#FACC15',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
