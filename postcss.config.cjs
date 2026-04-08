// AUDIT-G7: Tailwind CSS v4 includes autoprefixer built-in, removed explicit autoprefixer
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
