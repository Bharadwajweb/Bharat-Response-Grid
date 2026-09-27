// ─── BRG Real-Time WebSocket & Event Dispatch Handler ───
import type { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function setupWebSocket(server: Server): WebSocketServer {
  // Use noServer so the application socket cannot intercept Vite's HMR
  // upgrade requests. The shared HTTP server routes only /ws here and leaves
  // every other upgrade (including Vite's HMR endpoint) to Vite.
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');
    if (requestUrl.pathname !== '/ws') return;

    wss?.handleUpgrade(request, socket, head, (ws) => {
      wss?.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket, _req) => {
    clients.add(ws);

    // Send initial handshake
    ws.send(
      JSON.stringify({
        event: 'system:handshake',
        payload: {
          status: 'CONNECTED',
          serverTime: new Date().toISOString(),
          activeClients: clients.size,
          gateway: 'BRG EOC Real-Time Grid',
        },
      })
    );

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle heartbeat ping
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (data.event) {
          // Re-broadcast custom events to other clients
          broadcastEvent(data.event, data.payload, ws);
        }
      } catch (err) {
        console.error('[WebSocket message parse error]', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('[WebSocket client error]', err);
      clients.delete(ws);
    });
  });

  return wss;
}

export function broadcastEvent(event: string, payload: any, senderWs?: WebSocket): void {
  const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

  clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.warn(`[Failed to broadcast ${event}]`, err);
      }
    }
  });
}
