import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const host = process.env.VITE_DEV_HOST || '0.0.0.0';
  const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || 'localhost,127.0.0.1')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const config = {
    plugins: [react()],
    server: {
      host,
      port: 3000,
      strictPort: true,
      allowedHosts,
      cors: {
        origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
      },
      fs: {
        strict: true,
        deny: ['.env', '.env.*', '*.pem', '*.crt', '**/.git/**'],
      },
      proxy: {
        '/api': {
          // Backend address. Defaults to uvicorn's default port (8000).
          // Set VITE_BASE_URL in frontend/.env to change it.
          target: process.env.VITE_BASE_URL || 'http://127.0.0.1:8000',
          secure: false,
          changeOrigin: true,
          xfwd: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
  return defineConfig(config);
};
