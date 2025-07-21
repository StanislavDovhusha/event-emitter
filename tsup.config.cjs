const { defineConfig } = require('tsup');

module.exports = defineConfig([
  {
    entry: ['index.ts'],
    format: ['esm', 'cjs'],
    minify: false,
    dts: true,
    clean: true,
    sourcemap: false,
    splitting: false,
    esModuleInterop: true,
    outDir: 'dist',
  },
  {
    entry: ['index.ts'],
    format: ['esm', 'cjs'],
    minify: true,
    dts: true,
    clean: true,
    sourcemap: false,
    outExtension: () => ({ js: '.mini.js' }),
  },
]);
