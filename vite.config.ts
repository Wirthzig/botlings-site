import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// served from GitHub Pages under /botlings-site/ until there is a domain of its own
export default defineConfig({
  base: '/botlings-site/',
  plugins: [react()],
});
