// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // ngrok tunnels to this dev server (shared payment links, PayMongo webhook)
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Updated to match backend port 3001
        changeOrigin: true,
      },
    },
  },
});