import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Local preview build: one index.html that opens straight from Finder (file://).
// JS, CSS and fonts are inlined; images stay as files next to it.
export default defineConfig({
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  base: './',
  build: { outDir: 'preview-build', assetsInlineLimit: 100000000 },
});
