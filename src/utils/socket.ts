// ─── BRG Resilient Real-Time WebSocket & Event Dispatch Client ───

type EventHandler<T = any> = (data: T) => void;

class BRGSocketService {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private reconnectAttempts: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection:status', { status: 'connected' });

        // Start heartbeat ping every 25 seconds
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event && message.payload !== undefined) {
            this.emit(message.event, message.payload);
          } else if (message.type === 'pong') {
            // Heartbeat response acknowledged
          }
        } catch (err) {
          console.warn('[BRG WS parse warning]', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.emit('connection:status', { status: 'disconnected' });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[BRG WS connection notice]', err);
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (e) {
      console.warn('[BRG WS Init notice]', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(10000, 1500 * Math.pow(1.5, this.reconnectAttempts));
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);

    return () => this.off(event, handler);
  }

  off<T = any>(event: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  emit<T = any>(event: string, data: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[BRG Socket Error] Event ${event}:`, err);
        }
      });
    }
  }

  // Send message to backend WebSocket server
  send(event: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    } else {
      // Internal bus fallback
      this.emit(event, payload);
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const brgSocket = new BRGSocketService();
