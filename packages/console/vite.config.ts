import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/auth': 'http://localhost:4000', '/workspaces': 'http://localhost:4000', '/invitations': 'http://localhost:4000' },
  },
});
