import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import vercel from './vercel.json';

// `vite preview` sirve las mismas cabeceras que producción, para probar la política de seguridad.
const securityHeaders = Object.fromEntries(
  vercel.headers[0].headers.map(({ key, value }) => [key, value.replace('upgrade-insecure-requests; ', '')]),
);

// En desarrollo, /api/chat corre la misma función que Vercel usa en producción.
const devApi = (): Plugin => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const { POST } = await server.ssrLoadModule('/api/chat.ts');
      const response: Response = await POST(new Request('http://localhost/api/chat', {
        method: req.method, headers: req.headers as Record<string, string>, body: Buffer.concat(chunks),
      }));
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(await response.text());
    });
  },
});

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'OPENROUTER_'));
  return {
    plugins: [react(), devApi()],
    preview: { headers: securityHeaders },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  };
});
