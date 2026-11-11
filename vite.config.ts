import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vercel from './vercel.json';

// `vite preview` sirve las mismas cabeceras que producción, para probar la política de seguridad.
const securityHeaders = Object.fromEntries(
  vercel.headers[0].headers.map(({ key, value }) => [key, value.replace('upgrade-insecure-requests; ', '')]),
);

export default defineConfig({
  plugins: [react()],
  preview: { headers: securityHeaders },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
