import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // Set the root directory to the current directory
  publicDir: 'public', // Serve files from the public directory
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});