// ─── BRG Command Gateway Full-Stack Server Entry Point ───
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/routes/api';
import { setupWebSocket } from './src/server/websocket/wsHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = '0.0.0.0';

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Mount API router
  app.use('/api', apiRouter);

  // Create HTTP server
  const server = http.createServer(app);

  // Setup WebSocket on the same port at /ws
  setupWebSocket(server);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite Dev Server middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: HOST, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[BRG Command Server] Live on http://${HOST}:${PORT}`);
    console.log(`[BRG WebSocket] ws://${HOST}:${PORT}/ws`);
  });
}

startServer().catch((err) => {
  console.error('[BRG Server startup error]', err);
  process.exit(1);
});
