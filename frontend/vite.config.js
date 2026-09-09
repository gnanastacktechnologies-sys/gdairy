import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Exposes Vite over local network (0.0.0.0) for physical mobile phone testing
    port: 3000
  }
});
