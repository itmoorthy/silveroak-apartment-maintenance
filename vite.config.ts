
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set base to './' so that assets are loaded correctly on GitHub Pages
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
