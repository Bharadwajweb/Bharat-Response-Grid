// ─── BRG Socket.IO Real-Time Event Architecture ───

type EventHandler<T = any> = (data: T) => void;

class BRGSocketService {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private isConnected: boolean = true;

  constructor() {
    // If a real WebSocket/Socket.IO backend is configured via window or env, bridge it here
    if (typeof window !== 'undefined' && (window as any).__BRG_SOCKET__) {
      const externalSocket = (window as any).__BRG_SOCKET__;
      ['incident:created', 'incident:updated', 'shelter:updated', 'resource:updated', 'team:updated', 'mission:updated'].forEach(
        (event) => {
          externalSocket.on(event, (payload: any) => {
            this.emit(event, payload);
          });
        }
      );
    }
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

  get connected(): boolean {
    return this.isConnected;
  }
}

export const brgSocket = new BRGSocketService();
