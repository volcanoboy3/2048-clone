import { defineConfig } from 'vite';

// Fixed port so the preview URL is predictable (Zelda uses 4175, pet-rescue 4180).
export default defineConfig({
  server: { host: true, port: 4178 },
  preview: { host: true, port: 4178 },
});
