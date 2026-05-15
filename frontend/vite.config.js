import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Standard Vite port
    proxy: {
      // Proxying API requests to the backend server
      '/api': {
        target: 'http://localhost:5000', // Your backend server address
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false,      // Set to false if backend is not using HTTPS
      },
    },
  },
});