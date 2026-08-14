import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Generate manifest for PWA
    manifest: true,
    // Jayce heeft een iPhone die niet verder komt dan iOS 15, dus daar moet de
    // bundel op draaien. Zonder deze regel gaat Vite uit van nieuwere browsers.
    target: ['es2020', 'safari15', 'chrome87', 'firefox78'],
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
